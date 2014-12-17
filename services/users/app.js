console.log('Users service starting...');
var http = require('http');
var express = require('express');
var registeredUsersAccess = require('../../registeredUsers');
var Promise = require('promise');

var log = console.log.bind(console, 'Users Service:');
process.once('exit', log.bind(null, 'recieved exit event'));

var app = express();

app.set('port', process.env.HISTORICAL_EVENT_SERVICE_PORT || 9120);
app.use(express.logger('dev'));
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);

app.get('/users', function (req, res) {
	registeredUsersAccess.getAllRegisteredUsers_().then(function (users) {
		log(JSON.stringify(users));
		res.json(users);
	});
});

module.exports = app;
