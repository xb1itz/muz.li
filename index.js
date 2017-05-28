var express = require('express');
var q = require('q');
var r = require('rethinkdb');
var api = require('./api');


var app = express();
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
	    	databaseSetUp.resolve();

	    });

})


databaseSetUp.promise.then(function() {
	app.use('/api', api(connection));
	app.listen(3000, function () {
		console.log('Example app listening on port 3000!')
	})
})

