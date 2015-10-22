var request = require('request');
var Promise = require('promise');
var logger = require('../../core/logger');

var host = 'http://' + (process.env['HISTORICAL_EVENTS_SERVICE_HOST'] || 'historicalevents:9110')

module.exports = {
	getRecentEventsForUser: function (userId) {
		logger.log('processing request to getRecentEventsForUser', userId);
		var url = host + '/events/recent?userid=' + userId;
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
