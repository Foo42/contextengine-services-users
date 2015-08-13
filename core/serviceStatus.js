var logger = require('./logger');
var rabbitPie = require('rabbit-pie');
var Promise = require('bluebird');
var _ = require('lodash');

module.exports.connect = function () {
	var exchange;
	return rabbitPie.connect()
		.then(function (conn) {
			return conn.declareExchange('contextEngineSystem');
		}).then(function (ex) {
			exchange = ex;
			return exchange.createQueue();
		}).then(function (queue) {
			return {
				beaconStatus: function (serviceName) {
					serviceName = serviceName || process.env.SERVICE_NAME;
					var key = ['service', serviceName, 'status', 'heartbeat'].join('.');
					exchange.publish(key, {});
					setInterval(function () {
						logger.log('Sending beacon', key);
						exchange.publish(key, {});
					}, 5000).unref();
				},
				awaitOnline: function () {
					servicesToWaitFor = _.values(arguments);
					var promises = servicesToWaitFor.map(function (serviceName) {
						logger.log('Awaiting', serviceName, 'to come online...');
						return new Promise(function (resolve, reject) {
							var key = ['service', serviceName, 'status', 'heartbeat'].join('.');
							queue.topicEmitter.once(key, resolve.bind(null));
						});
					});
					return Promise.all(promises);
				}
			}
		});
}
