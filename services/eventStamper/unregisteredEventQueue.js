var logger = require('../../core/logger');
logger.log('Unregistered event queue is connecting to rabbitMQ');
var connection = require('./connection').then(function (conn) {
	logger.log('Unregistered event queue has connected to rabbitMQ');
	return conn;
});

module.exports = connection.then(function (conn) {
	return conn.declareExchange('unregisteredContextEvents');
}).then(function (exchange) {
	logger.log('unregisteredContextEvents exchange declared');
	distextExchange = exchange;
	return exchange.createQueue();
});
