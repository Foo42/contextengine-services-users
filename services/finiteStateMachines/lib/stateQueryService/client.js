var Promise = require('bluebird');
var request = require('request');

module.exports = {
	getStatesForUser:function(userId){
		var url = 'http://localhost:9111/states/active?userid=' + userId;
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
