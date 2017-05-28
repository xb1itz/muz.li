var cheerio = require('cheerio');
var q = require('q');
var r = require('rethinkdb');
var Crawler = require("crawler");


var databaseSetUp = q.defer();
var recentPostLoaded = q.defer();
var databaseName = 'muzli';
var c = new Crawler();
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
	r.table('posts').filter(r.row('source').eq('httpster')).orderBy(r.desc('createdAt')).limit(1).
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

c.queue([{

    uri: 'http://httpster.net/',
    jQuery: true,

    callback: function(error, res, done) {

        if (error) {
            console.log(error);
        } else {

            var $ = res.$;
            var posts = [];

		    recentPostLoaded.promise.then(function(lastPost) {

		    	$('article').each(function(index, post) {

		    		var postMeta = JSON.parse($(post).find('noscript').attr('data-json'))
		    		var postDate = new Date($(post).find('.Preview__date').text().trim());
		    		var postUrl = $(post).find('.Preview__action').attr('href')

		    		//Parse relative date 
		    		if (!postDate.valueOf()) {
		    			var daysBefore = parseInt($(post).find('.Preview__date').text());
		    			var date = new Date();
		    			date.setDate(date.getDate() - daysBefore);
		    			postDate = date;
		    		}

		    		if (lastPost && lastPost.url == postUrl) {
		    			return false;
		    		};

		    		var article = {
			        	title: $(post).find('h1').text(),
			        	image: 'https://httpster.net' + postMeta.set['450'],
			        	url: $(post).find('.Preview__action').attr('href'),
			        	createdAt: postDate,
			        	source: 'httpster',
			        };

			        posts.push(article);

	            })

		    	if (posts.length) {
					r.table('posts').insert(posts).run(connection, function(err, result) {
					    
					    if (err) throw err;

					    console.log('Added ' + posts.length + ' posts from Httpster')

					    connection.close();
					})
		    	} else {
					connection.close();
		    	}

    		}).catch(function(error) {
    			console.log(error);
    		})

        }

        done();
    }

}]);







