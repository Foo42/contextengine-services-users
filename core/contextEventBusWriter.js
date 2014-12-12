var rabbitPie = require('rabbit-pie');

///Need to store one per user n stuff
writers = {};

console.log('rabbit-pie writer about to connect');
var exchangeConnected = rabbitPie.connect().then(function (conn) {
	console.log('rabbit-pie writer connected');
	connection = conn;
	return connection.declareExchange('contextEvents');
}).then(function (exchange) {
	console.log('rabbit-pie writer exchange declared');
	return exchange;
});

exchangeConnected.catch(function (err) {
	console.error('badness connecting event bus reader', err);
});

module.exports = function (userId) {
	return {
		registerNewEvent: function registerNewEvent(contextEvent) {
			contextEvent.userId = userId;
			exchangeConnected.then(function (exchange) {
				console.log('writer ready to roll');
				console.log('writer publishing to bus:', contextEvent, 'of type', typeof contextEvent);
				exchange.publish('', contextEvent);
			}).catch(function (err) {
				console.error('error accessing contextEvent bus writer queue ' + err)
			});
		}
	};
};
