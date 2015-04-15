var request = require('request');
var Promise = require('promise');
var logger = require('../../core/logger');

module.exports = {
	getRecentEventsForUser: function (userId) {
		logger.log('processing request to getRecentEventsForUser', userId);
		var url = 'http://localhost:9110/events/recent?userid=' + userId;
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
