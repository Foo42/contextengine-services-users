var proxyquire = require('proxyquire');
var EventEmitter = require('events').EventEmitter;
var Promise = require('bluebird');
var assert = require('assert');

describe('historical event access', function () {
	it('should observe events for registered users and return them when requested', function (done) {
		var fakeUserAccess = {
			getAllRegisteredUsers: function () {
				return Promise.resolve([{
					id: 'bob'
				}]);
			}
		};
		var usersContextEventEmitter = new EventEmitter();
		var fakeContextEventBusReader = function () {
			return Promise.resolve(usersContextEventEmitter);
		}

		var fakePersistance = {
			persistEvent: function () {}
		}

		var substitutions = {
			'../../../core/contextEventBusReader': fakeContextEventBusReader,
			'../../users/client': fakeUserAccess,
			'./eventPersistance': fakePersistance
		}

		var historicalEventAccess = proxyquire('../../lib/historicalEventAccess', substitutions);

		historicalEventAccess.start().then(function () {
			usersContextEventEmitter.emit('context event', {
				text: 'I am a fake event',
				userId: 'bob'
			});

			historicalEventAccess.getRecentEventsForUser('bob').then(function (recentEvents) {
				assert.equal(recentEvents.length, 1);
				assert.equal(recentEvents[0].text, 'I am a fake event');
				done();
			})
		});
	});
});
