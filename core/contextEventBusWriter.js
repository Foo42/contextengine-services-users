var amqp = require('amqp');
var Promise = require('promise');

var connectionSettings = {
	host: process.env.RABBITMQ_HOST || '192.168.59.103',
	login: 'admin',
	password: 'admin'
};

var exchangeSettings = {
	type: 'fanout',
	autoDelete: false
};

var exchange;

function beginConnecting() {
	return new Promise(function (resolve, reject) {
		var connection = amqp.createConnection(connectionSettings);
		connection.once('ready', resolve.bind(null, connection));
	});
}

function declareExchange(connection) {
	return new Promise(function (resolve, reject) {
		connection.exchange('contextEvents', {
			type: 'fanout',
			autoDelete: false
		}, resolve.bind(null))
	});
}

var setupExchange = beginConnecting().then(declareExchange).catch(function (err) {
	console.error('Problem connecting to event bus writer...');
});

module.exports = function (userId) {
	return {
		registerNewEvent: function registerNewEvent(contextEvent) {
			contextEvent.userId = userId;
			setupExchange.then(function (exchange) {
				console.log('writer ready to roll');
				console.log('writer publishing to bus');
				exchange.publish('', JSON.stringify(contextEvent));
			}).catch(function (err) {
				console.error('error accessing contextEvent bus writer queue ' + err)
			});
		}
	};
};
