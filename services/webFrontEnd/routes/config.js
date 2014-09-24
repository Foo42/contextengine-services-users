var userConfigurationAccess = require('../../../core/userConfigurationAccess');

var configRoutes = {};

configRoutes.getStateConfig = function (req, res) {
	var configAccess = userConfigurationAccess.forUser(req.user);
	configAccess.getStateConfig(function (err, stateConfig) {
		if (err) {
			console.log('could not retrieve config for user ' + req.user.id);
			return res.end(500);
		}
		res.render('edit-state-config', {
			title: 'Edit StateConfig',
			formattedConfig: JSON.stringify(stateConfig, null, 2),
			config: JSON.stringify(stateConfig)
		});
	});
}

configRoutes.setStateConfig = function (req, res) {
	var newConfig;
	try {
		console.log('recieved config post=====================');
		console.log('body: ' + JSON.stringify(req.body.data));
		console.dir(req.body);
		newConfig = JSON.parse(req.body.configJSON);
	} catch (e) {
		return res.send(400);
	}

	var configAccess = userConfigurationAccess.forUser(req.user);
	console.log(JSON.stringify(newConfig));
	configAccess.setStateConfig(newConfig, function (err) {
		if (err) {
			return res.send(400);
		}
		configRoutes.getStateConfig(req, res);
	});
}

module.exports = configRoutes;
