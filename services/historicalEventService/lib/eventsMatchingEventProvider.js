var logger = require('../../../core/logger');
var Promise = require('bluebird');
var distexProvider = require('./distexProvider');
var getEventBusAccessForUser = require('../../../core/contextEventBusReader');
var sift = require('sift');

function objectMatches(object, conditions) {
	var query = sift(conditions);
	return query(object);
}

module.exports = {
	start: function () {
		return distexProvider.create(function (message) {
			var expression = message.expression;
			var canHandle = !!expression.eventMatching;
			return Promise.resolve(canHandle);
		}).then(function (provider) {
			logger.log('Registered as distexProvider');
			provider.on('contract accepted', function (contract) {
				logger.log('contract accepted for:', contract.expression);

				function processEvent(event) {
					if (objectMatches(event, contract.expression.eventMatching)) {
						contract.pushEvent({
							type: 'eventMatching',
							matchingEventId: event.id
						});
					}
				}

				var gettingEventBusAccess = getEventBusAccessForUser(contract.userId);

				contract.startWatching = function () {
					return gettingEventBusAccess.then(function (bus) {
						bus.on('context event', processEvent);
					}).catch(logger.error.bind(logger, 'Error subscribing to context bus events'));
				};
				contract.stopWatching = function () {
					return gettingEventBusAccess.then(function (bus) {
						bus.removeListener('context event', processEvent);
					});
				};
			});

		});
	}
}
