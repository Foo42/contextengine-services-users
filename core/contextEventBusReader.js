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

	var connection;
	var recievingQueue;

	getConnectionToExchange = function () {
		return new Promise(function (resolve, reject) {
			if (connection) {
				return resolve(connection);
			}

			connection = amqp.createConnection(connectionSettings);

			connection.on('ready', connected);
			connection.on('error', function (e) {
				console.error('there was a problem with the rabbitmq connection for the context event bus reader: ' + JSON.stringify(e));
				reject(new Error('problem with rabbit connection for reader'));
			})

			function connected() {
				try {
					console.log('reader connected to rabbitmq host');
					connection.exchange('contextEvents', exchangeSettings, exchangeReady);
				} catch (e) {
					consle.error('problem with ready handler' + e);
				}
			}

			function exchangeReady(contextEventsExchange) {
				console.log('reader connected to contextEvents rabbitmq exchange');
				resolve(connection);
			};

		});
	}

	module.exports = function (userId) {
		//var amqp = require('amqp');

		var connection = amqp.createConnection(connectionSettings);
		connection.on('error', function (e) {
			console.error('problem with rabbit connection ' + JSON.stringify(e))
		});
		connection.on('ready', function () {
			console.log('connection ready');
			connection.exchange('contextEvents', {
				type: 'fanout',
				autoDelete: false
			}, function (exchange) {
				console.log('exchange declared');
				connection.queue('tmp-' + Math.random(), {
						exclusive: true
					},
					function (queue) {
						console.log('queue created');
						queue.on('queueBindOk', function () {
							console.log('queue bound');


							console.log('contextEventBusReader is listening')

							queue.subscribe(function (msg) {
								console.log(msg.data.toString('utf-8'));
							});
						});
						queue.bind('contextEvents', '');

					});
			});
		});

		// return getConnectionToExchange().then(function (connection) {



		// 	function createABoundQueue(messageCallback) {
		// 		console.log('about to create a boud queue ' + messageCallback);
		// 		connection.queue('contextEventReaderQueue' + Math.random(), {
		// 			exclusive: true
		// 		}, function (queue, nextArg) {
		// 			console.log('queue callback. queue = ' + JSON.stringify(queue) + ' next arg = ' + JSON.stringify(nextArg));
		// 			console.log('contextEvent reader is binding to queue...');
		// 			queue.bind('contextEvents', '', function (err) {
		// 				if (err) {
		// 					return console.error('error binding queue ' + JSON.stringify(err));
		// 				}
		// 				console.log('reader queue bound to contextEvents exchange');
		// 				queue.subscribe(function (msg) {
		// 					console.log('reader got context message ' + msg.data.toString('utf8'));
		// 					if (messageCallback) {
		// 						messageCallback(msg.data.toString('utf8'));
		// 					}
		// 				});
		// 			});
		// 		});
		// 	};

		// 	createABoundQueue();
		// 	connection.on('ready', createABoundQueue);

		// });
	};
