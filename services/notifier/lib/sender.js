var push = require('node-pushover-client');
var Promise = require('bluebird');

function sendViaPushover(user, config, message) {
  console.log('sending notifcation to',user,'via pushover');
	var pushoverMessage = {
		message: message
	};
	var p = new push({
		user: config.user,
		token: config.token
	});

	return p.send(pushoverMessage).catch(function (err) {
		console.warn('Error sending push message for user user', err, err.stack);
	});
}

module.exports = function (user, config, message) {
	if (config.sinks && config.sinks.pushover) {
		return sendViaPushover(user, config.sinks.pushover, message);
	}
  return Promise.reject(new Error('user not configured for sending notifications'));
}
