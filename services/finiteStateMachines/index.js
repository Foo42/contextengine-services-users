var Promise = require('promise');
var getConnectedContextEventBusWriter = require('../../core/contextEventBusWriter');
var getContextEventBusReader = require('../../core/contextEventBusReader');
var state = require('./lib');
var registeredUsersAccess = require('../users/client');
var userConfigurationAccess = require('../../core/userConfigurationAccess');
var logger = require('../../core/logger');
var httpInterface = require('./httpInterface');
var connectToStatusNet = require('../../core/serviceStatus').connect();

function createContextEngineForUser(user) {
	var userId = user.id;
	var userConfig = userConfigurationAccess.forUser(user);

	var contextEventBusWriter = getConnectedContextEventBusWriter(userId);

	return new Promise(function (resolve, reject) {
		getContextEventBusReader(userId).then(function (contextEventBusReader) {
			state.StateInferenceEngine.subscribeToContextEvents(
				user,
				contextEventBusReader,
				contextEventBusWriter,
				userConfig,
				function (err) {
					if (err) {
						logger.log('error registering state inference engine');
						return reject(err);
					}
					logger.log('registered state inference engine');
					resolve(); //kinda weird we dont have anything to return here
				});
		});
	});

}

var enginePromisesByUser = {};

function start() {
	var beginCreationOfEnginesForAllUsers = registeredUsersAccess.getAllRegisteredUsers().then(function (users) {
		return users.map(function (user) {
			var enginePromise = enginePromisesByUser[user.id] = createContextEngineForUser(user);
			return enginePromise;
		});
	});

	return beginCreationOfEnginesForAllUsers.then(Promise.all.bind(Promise));
}

start().then(function () {
	logger.log('Created finite state machines for all users');
	process.send(JSON.stringify({
		status: "ready"
	}));
	connectToStatusNet.then(function (statusNet) {
		statusNet.beaconStatus();
	})
}).then(httpInterface.start()).catch(function (err) {
	logger.error('Failed to create all finite state machines with error ' + err);
	process.exit(1);
});
