var logger = require('../../../core/logger');
logger.log('HistorialEventService starting...');
var getEventBusListener = require('../../../core/contextEventBusReader');
var registeredUsersAccess = require('../../users/client');
var Promise = require('promise');
var path = require('path');
var persistEvent = require('./eventPersistance').persistEvent;

var recentEvents = {};

function getRecentEventsForUser(userId) {
	return Promise.resolve(recentEvents[userId] || []);
}

function processIncomingContextEvent(event) {
	logger.log('recieved context event ' + JSON.stringify(event));
	recentEvents[event.userId] = recentEvents[event.userId] || [];
	recentEvents[event.userId].push(event);
	persistEvent(event);
}

var baseUserDataPath = (process.env.USER_DATA_PATH || path.join(path.dirname(require.main.filename), 'data', 'userSpecific'));

function start() {
	logger.log('loading registered users');
	return registeredUsersAccess.getAllRegisteredUsers().then(function (users) {
		logger.log('got all registered users');
		var gettingBusAccessForEachUser = users
			.map(function (user) {
				return user.id
			}).map(getEventBusListener);

		gettingBusAccessForEachUser.forEach(function (contextEventEmitterPromise) {
			contextEventEmitterPromise.then(function (contextEventEmitter) {
				contextEventEmitter.on('context event', processIncomingContextEvent);
			}).catch(function (err) {
				logger.error('Error getting context bus access for user', err);
			});
		});

		return Promise.all(gettingBusAccessForEachUser);
	});
}

module.exports = {
	start: start,
	getRecentEventsForUser: getRecentEventsForUser
}
