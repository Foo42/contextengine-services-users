console.log('HistorialEventService starting...');
var http = require('http');
var express = require('express');
var getEventBusListener = require('../../core/contextEventBusReader');
var registeredUsersAccess = require('../users/client');
var Promise = require('promise');
var path = require('path');
var fs = require('fs');
var persistEvent = require('./lib/eventPersistance').persistEvent;

var log = console.log.bind(console, 'HistorialEventService:');
process.once('exit', log.bind(null, 'recieved exit event'));

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
	console.log(userId);
	if (!userId) {
		return response.status(400).end();
	}

	response.send(JSON.stringify(recentEvents[userId]));
});

function processIncomingContextEvent(event) {
	log('recieved context event ' + JSON.stringify(event));
	recentEvents[event.userId] = recentEvents[event.userId] || [];
	recentEvents[event.userId].push(event);
	log('stored event in memory');
	persistEvent(event);
	log('initiated persist to disk');
}

var baseUserDataPath = (process.env.USER_DATA_PATH || path.join(path.dirname(require.main.filename), 'data', 'userSpecific'));

http.createServer(app).listen(app.get('port'), function () {
	log('server listening on port ' + app.get('port'));
	log('loading registered users');
	registeredUsersAccess.getAllRegisteredUsers().then(function (users) {
		log('got registered users');
		var gettingBusAccessForEachUser = users
			.map(function (user) {
				return user.id
			}).map(getEventBusListener);

		gettingBusAccessForEachUser.forEach(function (contextEventEmitterPromise) {
			log('waiting for context event listener promise to resolve')
			contextEventEmitterPromise.then(function (contextEventEmitter) {
				log('subscribing to context events from ', contextEventEmitter.userId);
				recentEvents[contextEventEmitter.userId] = [];
				contextEventEmitter.on('context event', processIncomingContextEvent);
			}).catch(function (err) {
				console.error('Error getting context bus access for user', err);
			});
		});

		Promise.all(gettingBusAccessForEachUser).then(function () {
			log('announcing ready');
			process.send('{"status":"ready"}');
		})
	});
});
