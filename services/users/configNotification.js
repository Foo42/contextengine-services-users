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
						console.log('publishing config change event for', userId);
						var key = [userId, 'config.state.changed'].join('.');
						exchange.publish(key, changeEvent);
					}
				}
			})
	},
	listener: function () {
		return rabbitPie.connect()
			.then(function (conn) {
				return conn.declareExchange('contextEngineUsers');
			}).then(function (exchange) {
				return exchange.createQueue();
			}).then(function (queue) {
				console.log('config listener queue created')
				return {
					subscribeToConfigChangesForUser: function (userId, callback) {
						console.log('recieving config change event for', userId);
						queue.topicEmitter.on(userId + '.config.state.changed', function (msg) {
							callback(JSON.parse(msg));
						});
					}
				}
			});
	}
}
