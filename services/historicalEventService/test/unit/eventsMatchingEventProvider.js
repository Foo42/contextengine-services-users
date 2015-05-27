var proxyquire = require('proxyquire');
var Promise = require('bluebird');
var EventEmitter = require('events').EventEmitter;
var assert = require('assert');

describe('eventMatchingEventProvider', function () {
	it('should handle distex event contracts for eventsMatching expressions and raise events when it observes matching events', function (done) {
		var fakeProvider
		var fakeDistexProvider = new EventEmitter();
		var fakeEventBusReader = new EventEmitter();
		var substitutions = {
			'./distexProvider': {
				create: function (predicate) {
					return Promise.resolve(fakeDistexProvider);
				}
			},
			'../../../core/contextEventBusReader': function (userId) {
				assert.equal(userId, 'bob');
				return Promise.resolve(fakeEventBusReader);
			}
		};
		var eventMatchingEventProvider = proxyquire('../../lib/eventsMatchingEventProvider', substitutions);
		eventMatchingEventProvider.start().then(function () {
			var fakeContract = new EventEmitter();
			fakeContract.userId = 'bob';
			fakeContract.expression = {
				eventMatching: {
					text: 'banana'
				}
			};

			fakeDistexProvider.emit('contract accepted', fakeContract);

			fakeContract.pushEvent = function (e) {
				done();
			}

			console.log('sending watch')
			console.dir(fakeContract);
			fakeContract.startWatching().then(function () {
				fakeEventBusReader.emit('context event', {
					text: 'banana'
				});
			});
		});
	});
});
