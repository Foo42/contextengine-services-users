var assert = require('assert');
var EventEmitter = require('events').EventEmitter;
var Promise = require('bluebird');
var proxyquire = require('proxyquire');

describe('cron events', function () {
	it('should create a cron job when expression spec has cron property', function (done) {
		var fakeCron = {
			CronJob: function (spec, cb) {
				assert.equal(spec, '00 26 12 * * *');
				done();
			}
		};

		var fakeDistexProvider = new EventEmitter();

		cronService = proxyquire('../../index', {
			'./distexProvider': {
				create: function (predicate) {
					return Promise.resolve(fakeDistexProvider);
				}
			},
			'cron': fakeCron
		});

		setImmediate(function () {
			var fakeContract = new EventEmitter();
			fakeContract.expression = {
				cron: '00 26 12 * * *'
			};
			fakeDistexProvider.emit('contract accepted', fakeContract);
		});
	});
});
