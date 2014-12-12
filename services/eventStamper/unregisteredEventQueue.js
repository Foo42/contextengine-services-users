var connection = require('./connection');

module.exports = connection.then(function (conn) {
	return conn.declareExchange('unregisteredContextEvents');
}).then(function (exchange) {
	console.log('unregisteredContextEvents exchange declared');
	distextExchange = exchange;
	return exchange.createQueue();
});
