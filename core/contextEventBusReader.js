//////////////////////////////////////////////////////////////////////////////////////

var EventEmitter = require('events').EventEmitter;

var amqp = require('amqp');
var Promise = require('promise');

var connectionSettings = {
	host: process.env.RABBITMQ_HOST || '192.168.59.103',
	login: 'admin',
	password: 'aXo0o4BrUyUq'
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

var makingConnection = beginConnecting();
var setupExchange = makingConnection.then(declareExchange);
bindListenerQueue = setupExchange.then(function (exchange) {
	console.log('listener exchange connect');
	return new Promise(function (resolveListenerQueue) {
		makingConnection.then(function (connection) {
			console.log('got connection to rabbitMQ reader');
			connection.queue('tmp-' + Math.random(), {
					exclusive: true
				},
				function queueCreated(queue) {
					console.log('queue created');
					queue.on('queueBindOk', function queueBound() {
						resolveListenerQueue(queue);
					});
					queue.bind('contextEvents', '');
				});
		});
	});
});


///Need to store one per user n stuff
readers = {};

module.exports = function (userId) {
	console.log('in listener queue exports');
	return bindListenerQueue.then(function (queue) {
		if (readers[userId]) {
			console.log('reaturning previously created rabbitMQ conext event listener for ' + userId);
			return readers[userId];
		}
		console.log('creating rabbitMQ context event listener for ' + userId);
		var emitter = new EventEmitter();
		readers[userId] = emitter;
		queue.subscribe(function (msg) {
			var eventAsObj;
			try {
				var eventAsObj = JSON.parse(msg.data.toString('utf-8'));
			} catch (e) {
				console.error('error parsing contextEvent coming off queue ' + e);
			}
			if (!eventAsObj) {
				return;
			}
			emitter.emit('context event', eventAsObj);
			console.log(msg.data.toString('utf-8'));
		});
		return emitter;
	});
};
