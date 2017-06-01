var WebSocket = require('ws');
var app = require('express')();
var r = require('rethinkdb');
var q = require('q');

var databaseSetUp = q.defer();
var connection;
var websocket;

/*=====================================
=            CORS HANDLERS            =
=====================================*/

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://local.muz.li");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});



/*===================================
=            API METHODS            =
===================================*/

app.get('/posts', function(req, res) {

    var offset = parseInt(req.query.offset) || 0;
    var limit = parseInt(req.query.limit) || 10;
    var source = req.query.feed;
    var order = req.query.order;

    r.table('posts')
    .filter(function (post) {

        if (source) {
            return post('source').eq(source);
        } else {
            return post
        }

    })
    .orderBy(r.desc(function(post) {

        if (order === 'social') {
            return post('fbShareCount').add(post('googleShareCount'))
        } else {
            return post('createdAt')
        }

    }))
    .skip(offset)
    .limit(limit)
    .run(connection, function(err, cursor) {

            if (err) throw err;

            cursor.toArray(function(err, result) {

                if (err) throw err;

                res.json(result); 

            });

        });
})

databaseSetUp.promise.then(function(connection) {
    r.table('posts')
    .changes()
    .run(connection, function(err, cursor) {

        if (err) throw err;
        
        cursor.each(function(err, row) {
            
            if (err) throw err;

            if (!row.old_val) {
                websocket.clients.forEach(function each(client) {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: 'newPost',
                            data: row.new_val,
                        }));
                    }
                });
            };
        });
    });
});


/*=================================
=            FALLBACKS            =
=================================*/

app.all('*', function(req, res) {
    res.sendStatus(404);
});

module.exports = function (dbSetUpPromise, ws) {

    dbSetUpPromise.then(function(con) {
        
        connection = con;
        websocket = ws;
        
        databaseSetUp.resolve(con);
    });


    return app;
};
