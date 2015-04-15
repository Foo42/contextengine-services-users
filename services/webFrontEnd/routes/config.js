var logger = require('../../../core/logger');
var configRoutes = {};
var configAccessForUser = require('../../users/client').configAccessForUser;

configRoutes.getStateConfig = function (req, res) {
	configAccessForUser(req.user).getStateConfig().then(function (config) {
		res.json(config);
	}).catch(function (err) {
		logger.error('error getting config for user', req.user.id, 'with error', err);
		res.send(500).end();
	});
	return;
}

configRoutes.setStateConfig = function (req, res) {
	configAccessForUser(req.user).setStateConfig(req.body.data).then(function () {
		res.send(201).end();
	}).catch(function (err) {
		res.send(500).end();
	});
}

module.exports = configRoutes;
