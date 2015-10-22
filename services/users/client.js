var logger = require('../../core/logger');
var request = require('request');
var Promise = require('promise');
var configNotificationListener = require('./configNotification').listener();

var userServiceHost = 'http://' + (process.env['USER_SERVICE_HOST'] || 'users:9120') 

var client = {
	getAllRegisteredUsers: function (userId) {
		var url = userServiceHost + '/users';
		return new Promise(function (resolve, reject) {
			request(url, function (err, response, body) {
				if (err) {
					return reject(err);
				}
				if (response.statusCode !== 200) {
					return reject(new Error('did not get 200 response from service. Got ' + response.statusCode));
				}
				resolve(JSON.parse(body));
			});
		});
	},
	isRegisteredUser: function (user) {
		return new Promise(function (resolve, reject) {
			var url = userServiceHost + '/emailAddresses/' + encodeURIComponent(user.emails[0].value);

			request(url, function (err, response, body) {
				if (err) {
					return reject(err);
				}
				if (response.statusCode === 404) {
					return resolve(false);
				}
				if (response.statusCode === 200) {
					return resolve(true);
				}
				return reject(new Error('did not get 200 response from service. Got ' + response.statusCode));
			});
		});
	},
	configAccessForUser: function (user) {
		var userId = user.id;
		return {
			getStateConfig: function () {
				var url = userServiceHost + '/config/' + encodeURIComponent(userId) + '/state';
				return new Promise(function (resolve, reject) {
					request(url, function (err, response, body) {
						if (err) {
							return reject(err);
						}
						if (response.statusCode !== 200) {
							return reject(new Error('did not get 200 response from service. Got ' + response.statusCode));
						}
						resolve(JSON.parse(body));
					});
				});
			},
			setStateConfig: function (newConfig) {
				return new Promise(function (resolve, reject) {
					var url = userServiceHost + '/config/' + encodeURIComponent(userId) + '/state';
					var options = {
						url: url,
						method: 'POST',
						form: {
							configJSON: newConfig
						}
					};
					request(options, function (err, response, body) {
						if (err) {
							return reject(err);
						}
						if (response.statusCode !== 201) {
							return reject(new Error('did not get 200 response from service. Got ' + response.statusCode));
						}
						resolve(true);
					});
				});
			},
			watchStateConfig: function (callback) {
				return configNotificationListener.then(function (listener) {
					listener.subscribeToConfigChangesForUser(userId, callback);
				});
			},
			getConfig: function (path) {
				var url = userServiceHost + '/config/' + encodeURIComponent(userId) + (path.replace(/^([^\/])(.*)/, '/$1$2') || '/');
				return new Promise(function (resolve, reject) {
					request(url, function (err, response, body) {
						if (err) {
							return reject(err);
						}
						if (response.statusCode !== 200) {
							return reject(new Error('did not get 200 response from service. Got ' + response.statusCode));
						}
						resolve(JSON.parse(body));
					});
				});
			}
		}
	}
}

module.exports = client;
