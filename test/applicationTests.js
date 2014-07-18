var assert = require('assert');
var http = require('http');
var request = require('request');
var path = require('path');
var cheerio = require('cheerio');

describe('application', function(){
	var app;
	var server;
	var host;

	beforeEach(function(done){
		process.env.OFFLINE_MODE = true;
		process.env.USER_DATA_PATH = path.join(__dirname, '../data/userSpecific');
		console.log('offline mode = ' + process.env.OFFLINE_MODE);
		app = require('../app');		
		host = 'http://localhost:'+app.get('port');
		server = http.createServer(app).listen(app.get('port'), function(){
		  console.log('Express server listening on port ' + app.get('port'));
		  done();
		});
	}); 


	function assertIsRedirectTo(response, path){
		assert.equal(response.statusCode, 302);
		assert.equal(response.headers['location'], '/events/recent')
	}

	afterEach(function(done){
		server.once('close',done);
		server.close();
	});

	it.only('should start, allow an event to be submitted and list that event when queried for recent events', function(done){
		request.post({url:host+'/events/text', form:{eventText:'testing'}}, function(err, response, body){
			assert.ifError(err);
			assertIsRedirectTo(response, '/events/recent');

			request.get({url:host+'/events/recent'}, function(err, response, body){
				assert.ifError(err);
				var $ = cheerio.load(body);
				//$.()
				
			});
			done();
		});
	});
});