var amqp = require('amqp');
var Promise = require('promise');

function getConnection(config) {
	var connection = amqp.createConnection({
		host: config.rabbitmqHost,
		login: config.rabbitmqUser || 'guest',
		password: config.rabbitmqPassword || 'guest'
	});
	return new Promise(function (resolve, reject) {
		connection.on('ready', resolve.bind(null, connection));
	});
}


var exchangeSettings = {
	type: 'fanout',
	autoDelete: false
};


function declareExchange() {
	var createExchange = Promise.denodify(connection.exchange.bind(connection));
	return createExchange('contextEvents', exchangeSettings);
}


module.exports = {
	//should we require config be supplied each time this is required in? mind you, if we are using di, then that should only be once!
	create: function (config) {
		return getConnection(config)
			.then(declareExchange)
			.then(function (contextEventExchange) {
				var contextEventBusWriter = {
					write: function (contextEvent) {
						contextEventExchange.publish('', contextEvent);
					}
				};
				return contextEventBusWriter;
			});
	}
}
