console.log('Connecting to rabbitMQ');
var connection = require('./connection').then(function (conn) {
	console.log('Connected to rabbitMQ');
	return conn;
});

module.exports = connection.then(function (conn) {
	return conn.declareExchange('unregisteredContextEvents');
}).then(function (exchange) {
	console.log('unregisteredContextEvents exchange declared');
	distextExchange = exchange;
	return exchange.createQueue();
});
