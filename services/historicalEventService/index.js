var logger = require('../../core/logger');
logger.log('HistorialEventService starting...');
var http = require('http');
var express = require('express');
var getEventBusListener = require('../../core/contextEventBusReader');
var registeredUsersAccess = require('../users/client');
var Promise = require('promise');
var path = require('path');
var fs = require('fs');
var persistEvent = require('./lib/eventPersistance').persistEvent;

process.once('exit', logger.log.bind(logger, 'recieved exit event'));

var app = express();

app.set('port', process.env.HISTORICAL_EVENT_SERVICE_PORT || 9110);
app.use(express.logger('dev'));
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);

var recentEvents = {};

app.get('/events/recent', function (request, response) {
	var userId = request.param('userid');
	if (!userId) {
		return response.status(400).end();
	}

	response.send(JSON.stringify(recentEvents[userId]));
});

function processIncomingContextEvent(event) {
	logger.log('recieved context event ' + JSON.stringify(event));
	recentEvents[event.userId] = recentEvents[event.userId] || [];
	recentEvents[event.userId].push(event);
	persistEvent(event);
}

var baseUserDataPath = (process.env.USER_DATA_PATH || path.join(path.dirname(require.main.filename), 'data', 'userSpecific'));

http.createServer(app).listen(app.get('port'), function () {
	logger.log('server listening on port ' + app.get('port'));
	logger.log('loading registered users');
	registeredUsersAccess.getAllRegisteredUsers().then(function (users) {
		var gettingBusAccessForEachUser = users
			.map(function (user) {
				return user.id
			}).map(getEventBusListener);

		gettingBusAccessForEachUser.forEach(function (contextEventEmitterPromise) {
			contextEventEmitterPromise.then(function (contextEventEmitter) {
				logger.log('subscribing to context events from ', contextEventEmitter.userId);
				recentEvents[contextEventEmitter.userId] = [];
				contextEventEmitter.on('context event', processIncomingContextEvent);
			}).catch(function (err) {
				logger.error('Error getting context bus access for user', err);
			});
		});

		Promise.all(gettingBusAccessForEachUser).then(function () {
			logger.log('announcing ready');
			process.send('{"status":"ready"}');
		})
	});
});
