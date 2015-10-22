var Promise = require('bluebird');
var logger = require('../../core/logger');
var http = require('http');
var express = require('express');
var getStatesForUser = Promise.promisify(require('./lib/finiteStateDirectQueryService').getStatesForUser);

module.exports.start = function () {
	var app = express();
	app.set('port', 9111);
	app.use(express.logger('dev'));
	app.use(express.cookieParser());
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);

	app.get('/states/active', function (req, res) {
		var userId = req.param('userid');
		if (!userId) {
			return res.status(400).send('Missing userid');
		}
		getStatesForUser(userId).then(function (states) {
			var activeStates = states.filter(function (state) {
				return state.isActive
			});
			return res.json(activeStates)
		}).catch(function (error) {
			logger.error(error);
			return res.status(500).send('could not retrieve active states for user');
		});
	});

	var server = http.createServer(app);
	var listen = Promise.promisify(server.listen.bind(server));
	return listen(app.get('port'));
}
