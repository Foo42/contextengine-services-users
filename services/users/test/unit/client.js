var proxyquire = require('proxyquire');
require('chai').should()

describe('user config client', function () {
	describe('fetching config sections', function () {
		it('should build an appropriate url', function (done) {
			var configToReturn = {
				hello: 'world'
			};

			var substitutions = {
				'request': function (url, callback) {
					url.should.match(/.*\/config\/someone\/notifications$/);
					callback(null, {
						statusCode: 200
					}, JSON.stringify(configToReturn));
				}
			}
			var client = proxyquire('../../client', substitutions);

			client.configAccessForUser({
				id: 'someone'
			}).getConfig('/notifications').then(function (config) {
				done();
			}).catch(done);
		});
	});
});
