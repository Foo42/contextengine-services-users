var rabbitPie = require('rabbit-pie');
var EventEmitter = require('events').EventEmitter;
var logger = require('./logger');

///Need to store one per user n stuff
readers = {};

var queueConnected = rabbitPie.connect().then(function (conn) {
	connection = conn;
	return connection.declareExchange('contextEvents');
}).then(function (exchange) {
	distextExchange = exchange;
	return exchange.createQueue();
}).then(function (queue) {
	queue.topicEmitter.on('#', function (msg) {
		try {
			msg = JSON.parse(msg);
		} catch (e) {
			logger.warn('failed to parse incoming context event as json. Ignoring')
			return;
		}

		if (!msg.userId) {
			logger.warn('recieved context event without userId');
			return;
		}

		var reader = readers[msg.userId];
		if (!reader) {
			logger.warn('recieved context event for user before they are listening', msg.userId);
			return;
		}

		reader.emit('context event', msg);
	});
});

queueConnected.catch(function (err) {
	logger.error('Error connecting event bus reader', err);
	process.exit(1);
});

module.exports = function (userId) {
	if (!readers[userId]) {
		readers[userId] = new EventEmitter();
	}
	return queueConnected.then(function () {
		return readers[userId]
	});
};
