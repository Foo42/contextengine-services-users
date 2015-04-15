var rabbitPie = require('rabbit-pie');
var logger = require('./logger');

///Need to store one per user n stuff
writers = {};

var exchangeConnected = rabbitPie.connect().then(function (conn) {
	connection = conn;
	return connection.declareExchange('unregisteredContextEvents');
}).then(function (exchange) {
	return exchange;
});

exchangeConnected.catch(function (err) {
	logger.error('badness connecting event bus reader', err);
	process.exit(1);
});

exchangeConnected.then(function () {
	logger.log('context event bus writer connected');
})

module.exports = function (userId) {
	return {
		registerNewEvent: function registerNewEvent(contextEvent) {
			contextEvent.userId = userId;
			exchangeConnected.then(function (exchange) {
				logger.info('writer publishing to bus:', contextEvent);
				exchange.publish('', contextEvent);
			}).catch(function (err) {
				logger.error('error accessing contextEvent bus writer queue ' + err)
			});
		}
	};
};
