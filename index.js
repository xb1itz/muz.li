var express = require('express');
var WebSocket = require('ws');
var http = require('http');
var q = require('q');
var r = require('rethinkdb');
var api = require('./api');


var app = express();
var server = http.createServer(app);
var wss = new WebSocket.Server({ server });
var databaseSetUp = q.defer();
var databaseName = 'muzli';
var connection;

r.connect({ host: 'localhost', port: 28015 }, function(err, conn) {
    
    if (err) throw err;
    
    connection = conn;

    r.dbList().contains(databaseName)
	    .do(function(databaseExists) {
	    	return r.branch(databaseExists, { dbs_created: 0 }, r.dbCreate(databaseName));
	    })
	    .do(function() {
	    	return r.db(databaseName).tableList().contains('posts').do(function(tableExists) {
		    	return r.branch(tableExists, { tables_created: 0 }, r.db(databaseName).tableCreate('posts'));
		    })
	    })
	    .run(conn, function(err, cursor) {
	    	
	    	if (err) throw err;

	    	conn.use(databaseName);
	    	databaseSetUp.resolve(connection);

	    });

})


databaseSetUp.promise.then(function() {

	app.use('/api', api(databaseSetUp.promise, wss));

	wss.on('connection', function connection(ws, req) {
	  ws.on('message', function incoming(message) {
	    console.log('received: %s', message);
	  });
	});

	server.listen(3000, function listening() {
	  console.log('Listening on %d', server.address().port);
	});
})

