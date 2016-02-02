require('chai').should();
var request = require('supertest');
var util = require('util');
var app = require('../../app');

describe('Users service', function () {
	beforeEach(function () {
		process.env.USER_DATA_PATH = require('path').join(__dirname, '../../../../test/data/userSpecific');
		console.log('user services env:', process.env.USER_DATA_PATH);
	})

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

	describe('config access', function () {
		var agent = request(app);
		describe('for arbitrary buckets', function () {
			it('should return 404 for unknown config buckets', function (done) {
				agent
					.get('/config/someone/foo')
					.expect(404, done);
			});

			it('should accept config', function (done) {
				agent
					.post('/config/someone/foo')
					.type('form')
					.send({
						configJSON: {
							foo: 42
						}
					})
					.expect(201, done);
			});

			it('should return previously saved config when requested', function (done) {
				agent
					.get('/config/someone/foo')
					.expect(200, {
						foo: 42
					}, done);
			});
		});
	});
});
