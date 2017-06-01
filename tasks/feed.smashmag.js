var request = require('request');
var cheerio = require('cheerio');
var q = require('q');
var r = require('rethinkdb');
var FeedParser = require('feedparser');
var cfgManager = require('node-config-manager');

var req = request('https://www.smashingmagazine.com/feed/');
var feedparser = new FeedParser();

var databaseSetUp = q.defer();
var recentPostLoaded = q.defer();
var connection;
var dbConfig;


/*============================================
=            Load database config            =
============================================*/

cfgManager.init({
	configDir: '../config',
});

cfgManager.addConfig('db');
dbConfig = cfgManager.getConfig('db');


/*===========================================
=            Setup DB connection            =
===========================================*/

r.connect({ host: 'localhost', port: 28015 }, function(err, conn) {
    
    if (err) throw err;
    
    connection = conn;

    r.dbList().contains(dbConfig.name)
	    .do(function(databaseExists) {
	    	return r.branch(databaseExists, { dbs_created: 0 }, r.dbCreate(dbConfig.name));
	    })
	    .do(function() {
	    	return r.db(dbConfig.name).tableList().contains('posts').do(function(tableExists) {
		    	return r.branch(tableExists, { tables_created: 0 }, r.db(dbConfig.name).tableCreate('posts'));
		    })
	    })
	    .run(conn, function(err, cursor) {
	    	
	    	if (err) throw err;

	    	conn.use(dbConfig.name);
	    	databaseSetUp.resolve();

	    });

})

databaseSetUp.promise.then(function() {
	r.table('posts').filter(r.row('source').eq('smashmag')).orderBy(r.desc('createdAt')).limit(1).
	run(connection, function(err, cursor) {

		if (err) throw err;

		cursor.toArray(function(err, result) {

			if (err) throw err;

			if (result.length) {
				recentPostLoaded.resolve(result[0]);
			} else {
				recentPostLoaded.resolve();
			}

		});

	});
})

req.on('error', function(error) {
    console.error(error);
});

req.on('response', function(res) {
    var stream = this; // `this` is `req`, which is a stream

    if (res.statusCode !== 200) {
        this.emit('error', new Error('Bad status code'));
    } else {
        stream.pipe(feedparser);
    }
});

feedparser.on('error', function(error) {
    console.error(error);
});

feedparser.on('readable', function() {

    var stream = this;
    var posts = [];
    var item;

    recentPostLoaded.promise.then(function(lastPost) {

    	while (item = stream.read()) {
    		
    		if (lastPost && lastPost.createdAt >= item.date) {
    			break;
    		};
        
	        var description = cheerio.load(item.description)

	        var article = {
	        	title: item.title,
	        	description: description('p').first().text().trim(),
	        	image: description('figure img').attr('src'),
	        	url: item.link,
	        	createdAt: new Date(item.date),
	        	source: 'smashmag',
	        };

	        posts.push(article);
    	};

    	if (posts.length) {
			r.table('posts').insert(posts).run(connection, function(err, result) {
			    if (err) throw err;

			    console.log('Added ' + posts.length + ' posts from Smashing Magazine')
			})
    	};

    })
});

feedparser.on('finish', function(message) {
    connection.close();
});
