var logger = require('../../core/logger');
logger.log('Users service starting...');
var http = require('http');
var express = require('express');
var registeredUsersAccess = require('./registeredUsers');
var userConfigurationAccess = require('../../core/userConfigurationAccess');
var Promise = require('promise');
var configDiff = require('./configDiff');

process.once('exit', logger.log.bind(logger, 'recieved exit event'));

var configChangePublisher = require('./configNotification').publisher();

var app = express();

app.set('port', process.env.HISTORICAL_EVENT_SERVICE_PORT || 9120);
app.use(express.logger('dev'));
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);

app.get('/users', function (req, res) {
	registeredUsersAccess.getAllRegisteredUsers().then(function (users) {
		res.json(users);
	});
});

app.get('/emailAddresses/:userEmail', function (req, res) {
	registeredUsersAccess.findUser({
		emails: [{
			value: req.params.userEmail
		}]
	}, function (err, user) {
		if (err) {
			return res.send(404).end();
		}
		return res.json(user);
	});
});

app.get('/config/:userId/state', function (req, res) {
	userConfigurationAccess.forUser({
		id: req.params.userId
	}).getStateConfig(function (err, config) {
		if (err) {
			res.send(500).end();
			return logger.error(err);
		}
		res.json(config);
	});
});

app.post('/config/:userId/state', function (req, res, next) {
	var newConfig;
	try {
		newConfig = JSON.parse(req.body.configJSON);
	} catch (e) {
		return res.send(400);
	}

	var configAccess = userConfigurationAccess.forUser({
		id: req.params.userId
	});
	configAccess.getStateConfig(function (err, oldConfig) {
		if (err) {
			logger.error('Error reading user', req.params.userId, 'existing config', err);
			return next(err);
		}
		var diff = configDiff(oldConfig, newConfig);
		configAccess.setStateConfig(newConfig, function (err) {
			if (err) {
				logger.error('Error writing user state config file for user', req.params.userId);
				return res.send(400).end();
			}
			logger.log('user state config file written for user', req.params.userId);
			res.send(201).end();
			configChangePublisher.then(function (publisher) {
				publisher.publishConfigChangeForUser(req.params.userId, {
					delta: diff
				});
			});
		});
	});

});

module.exports = app;
