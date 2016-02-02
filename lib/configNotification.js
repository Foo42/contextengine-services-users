var logger = require('../core/logger');
var rabbitPie = require('rabbit-pie');
var EventEmitter = require('events').EventEmitter;

module.exports = {
	publisher: function () {
		return rabbitPie.connect()
			.then(function (conn) {
				return conn.declareExchange('contextEngineUsers');
			}).then(function (exchange) {
				return {
					publishConfigChangeForUser: function (userId, changeEvent) {
						logger.log('publishing config change event for', userId);
						var key = [userId, 'config.state.changed'].join('.');
						exchange.publish(key, changeEvent);
					}
				}
			});
	},
	listener: function () {
		return rabbitPie.connect()
			.then(function (conn) {
				return conn.declareExchange('contextEngineUsers');
			}).then(function (exchange) {
				return exchange.createQueue();
			}).then(function (queue) {
				return {
					subscribeToConfigChangesForUser: function (userId, callback) {
						queue.topicEmitter.on(userId + '.config.state.changed', function (msg) {
							logger.log('recieved config change event for', userId);
							callback(JSON.parse(msg));
						});
					}
				}
			});
	}
}
