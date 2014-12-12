var rabbitPie = require('rabbit-pie');
var EventEmitter = require('events').EventEmitter;
var Promise = require('promise');

var generateEventId = (function () {
	var counter = 0;
	var pid = process.pid;
	return function () {
		return "" + pid + counter++ +(new Date().valueOf());
	};
})();

addEventMetadata = function (event) {
	event.metadata = event.metadata || {};
	event.metadata.time = event.metadata.time || new Date();
	event.metadata.id = event.metadata.id || generateEventId();
}

console.log('Event stamper starting...');

var connecting = rabbitPie.connect();
var contextEventExchangePreparing = connecting.then(function (conn) {
	return conn.declareExchange('contextEvents');
});

contextEventExchangePreparing.then(function (contextEventExchange) {
	console.log('event stamper connected to contextEvent exchange');
});

contextEventExchangePreparing.catch(function (err) {
	console.err('Event stamper had error connecting to contextEvent exchange', err);
});

function publishAsConextEvent(event) {
	contextEventExchangePreparing.then(function (contextEventExchange) {
		console.log('republishing unregistered context event on contextEvent exchange');
		contextEventExchange.publish('', event);
	});
}

var unregisteredContextEventsQueuePreparing = connecting.then(function (conn) {
	connection = conn;
	console.log('event stamper connecting to unregisteredContextEvents exchange')
	return connection.declareExchange('unregisteredContextEvents');
}).then(function (exchange) {
	console.log('unregisteredContextEvents exchange declared');
	distextExchange = exchange;
	return exchange.createQueue();
}).then(function (queue) {
	console.log('unregisteredContextEvents queue created');
	queue.topicEmitter.on('#', function (msg) {
		try {
			msg = JSON.parse(msg);
		} catch (e) {
			console.warn('failed to parse incoming context event as json. Ignoring')
			return;
		}

		addEventMetadata(msg);

		return publishAsConextEvent(msg);
	});
});

Promise.all([unregisteredContextEventsQueuePreparing, contextEventExchangePreparing]).then(function () {
	process.send(JSON.stringify({
		status: "ready"
	}));
}).catch(function (err) {
	console.log('badness', err);
	process.exit(1);
})
