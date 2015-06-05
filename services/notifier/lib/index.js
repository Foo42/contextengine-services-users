var debuglog = require('debugLog')('notifications_service');
var registeredUsersAccess = require('../../users/client');
var connectingDistexClient = require('./connectDistexClient');

var Promise = require('bluebird');

var config = {
	'someone': {
		notifictionTriggers: [{
			message: 'test',
			trigger: {
				eventMatching: {
					text: 'testing'
				}
			}
		}]
	}
}

function getNotificationConfigForUser(user) {
	return Promise.resolve(config[user.id] || {});
}

function pushNotification(user, message) {
	console.log('NOTIFICATION!!!!!!!!!!!!!!!!', user.id, message);
}

function setupNotification(user, notificationSpec) {
	debuglog('setting up notification for', notificationSpec.message, 'for user', user.id);
	return connectingDistexClient.then(function (distexClient) {
		return new Promise(function (resolve) {
			var clientContract = distexClient.requestHandler({
				expression: notificationSpec.trigger,
				userId: user.id
			});
			clientContract.on('status.handled', function () {
				debuglog('Distex handler established for notification', notificationSpec.message, 'for user', user.id);
				clientContract.on('event.recieved', pushNotification.bind(null, user, notificationSpec.message));
				clientContract.watch();
				resolve({
					contract: clientContract
				});
			});
		});

	});
}

module.exports.start = function start() {
	return registeredUsersAccess.getAllRegisteredUsers().then(function (users) {
		return Promise.map(users, function setupNotificationsForUser(user) {
			debuglog('setting up notifications for user', user.id);
			return getNotificationConfigForUser(user).then(function (config) {
				return Promise.map(config.notifictionTriggers || [], setupNotification.bind(null, user))
			});
		});
	});
}
