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
						exchange.publish(key, {});
					}, 5000).unref();
				},
				awaitOnline: function () {
					servicesToWaitFor = _.values(arguments);
          var remaining = servicesToWaitFor.reduce(function(acc, serviceName){
            acc[serviceName] = true;
            return acc;
          },{});
					var promises = servicesToWaitFor.map(function (serviceName) {
						logger.log('Awaiting', serviceName, 'to come online...');
						return new Promise(function (resolve, reject) {
							var key = ['service', serviceName, 'status', 'heartbeat'].join('.');
							queue.topicEmitter.once(key, resolve.bind(null));
						}).then(function(){
              delete remaining[serviceName];
              logger.info('Detected',serviceName,'online. Still waiting for',Object.keys(remaining).join(', '));
            });
					});
					return Promise.all(promises);
				}
			}
		});
}
