var push = require('pushover-notifications');
var Promise = require('bluebird');

function sendViaPushover(user, config, message) {
	var pushoverMessage = {
		message: message
	};
	var p = Promise.promisifyAll(new push({
		user: config.user,
		token: config.token
	}));

	return p.send(pushoverMessage).catch(function (err) {
		console.warn('Error sending push message for user user', err)
	});
}

module.exports = function (user, config, message) {
	if (config.sinks && config.sinks.pushover) {
		sendViaPushover(user, config.sinks.pushover, message);
	}
}
