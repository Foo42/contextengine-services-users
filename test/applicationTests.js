var assert = require('assert');
var http = require('http');
var request = require('request');
var path = require('path');
var cheerio = require('cheerio');
var fork = require('child_process').fork;

describe('application', function () {
	var app;
	var server;
	var host = 'http://localhost:9005';
	var child;

	beforeEach(function (done) {
		var childEnv = {};
		childEnv.OFFLINE_MODE = true;
		childEnv.USER_DATA_PATH = path.join(__dirname, '../data/userSpecific');
		child = fork('./index.js', {
			env: childEnv,
			silent: true
		});
		child.disconnect(); //dont need the ipc channel
		setTimeout(done, 500);
	});


	function assertIsRedirectTo(response, path) {
		assert.equal(response.statusCode, 302);
		assert.equal(response.headers['location'], '/events/recent')
	}

	afterEach(function (done) {
		setTimeout(function () {
			child.kill();
			done();
		}, 100);
	});

	it('should start, allow an event to be submitted and list that event when queried for recent events', function (done) {
		request.post({
			url: host + '/events/text',
			form: {
				eventText: 'testing'
			}
		}, function (err, response, body) {
			assert.ifError(err);
			assertIsRedirectTo(response, '/events/recent');

			request.get({
				url: host + '/events/recent'
			}, function (err, response, body) {
				assert.ifError(err);
				var $ = cheerio.load(body);
				assert.equal($('li').text(), 'type: text detail:testing');
			});
			done();
		});
	});

	it('simple test to ensure service exited correctly between tests', function (done) {
		request.get({
			url: host + '/'
		}, function (err, response, body) {
			assert.ifError(err);
			assert.equal(response.statusCode, 200);
			done();
		});
	});
});
