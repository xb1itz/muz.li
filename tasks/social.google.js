var cfgManager = require('node-config-manager');
var rp = require('request-promise');
var q = require('q');
var r;

var databaseSetUp = q.defer();
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

var updateShareCounts = function (posts) {

	var fetchPromises = [];
	var options = {
	    method: 'POST',
	    uri: 'https://clients6.google.com/rpc',
	    body: {
	    	'method': 'pos.plusones.get',
	    	'id': '',
	    	'params': {
	    		'nolog': true,
	    		'id': '',
	    		'source': 'widget',
	    		'userId': '@viewer',
	    		'groupId': '@self'
	    	},
	    	'jsonrpc': '2.0',
	    	'key': 'p',
	    	'apiVersion': 'v1'
	    },
	    json: true
	};	

	posts.forEach(function(post) {

		var dataFetched = q.defer();

		fetchPromises.push(dataFetched.promise);

		options.body.id = post.url;
		options.body.params.id = post.url;

		rp(options).then(function (response) {
        	
        	post.googleShareCount = response.result.metadata.globalCounts.count;
	        dataFetched.resolve(post);

	    }).catch(function (err) {
	        console.error(err);
	    });
	})

	return q.all(fetchPromises);
};

/*================================================
=            Initialize DB connection            =
================================================*/

r = require('rethinkdbdash')({
	db: dbConfig.name
})



/*================================================================
=            Check if database has specific structure            =
================================================================*/

r.dbList().do(function() {
	return r.tableList().contains('posts').do(function(tableExists) {
    	return r.branch(tableExists, { tables_created: 0 }, r.tableCreate('posts'));
    })
})
.run().then(function(result) {
	databaseSetUp.resolve();
}).catch(function (err) {
    console.error(err);
    r.getPoolMaster().drain();
});;



/*==========================================================
=            Load posts & update share counters            =
==========================================================*/

databaseSetUp.promise.then(function() {

	//Post age in days, we want to be updated
	var postAge = parseInt(process.argv[2]) || 30;
	
	r.table('posts')
	.pluck('id', 'url', 'createdAt')
	.filter(function(post) {
		return r.now().sub(post('createdAt')).lt(postAge*60*60*24)
	})
	.run()
	.then(function(result) {

		if (result.length) {

			return updateShareCounts(result).then(function(posts) {

				var updatePromises = [];

				//Bulk update could be here
				posts.forEach(function(post) {

					var postUpdated = q.defer();

					updatePromises.push(postUpdated.promise);

					r.table('posts').get(post.id).update({
						googleShareCount: post.googleShareCount
					}).run().then(function(post) {
						postUpdated.resolve(post);
					})
				})

				return q.all(updatePromises)
			});
		} else {
			return q.resolve([]);
		};

	}).then(function(result) {
		console.log('Updated documents: ' + result.length);
		r.getPoolMaster().drain();
	});

}).catch(function (err) {
    console.error(err);
});