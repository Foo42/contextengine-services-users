require('chai').should();
var request = require('supertest');
var util = require('util');
var app = require('../../app');

describe('Users service', function () {
	describe('fetching list of users', function () {
		it('should return an array', function (done) {
			request(app)
				.get('/users')
				.expect(200)
				.expect(function (res) {
					if (!util.isArray(res.body)) {
						return 'result was not array';
					}
				})
				.end(function (err, res) {
					if (err) {
						return done(err);
					}
					done();
				});
		});
	});
});
