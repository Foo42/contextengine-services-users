var Promise = require('promise');
var getConnectedContextEventBusWriter = require('../../core/contextEventBusWriter');
var getContextEventBusReader = require('../../core/contextEventBusReader');
var state = require('./lib');
var registeredUsersAccess = require('../../registeredUsers');
var userConfigurationAccess = require('../../core/userConfigurationAccess');

function createContextEngineForUser(user) {
	var userId = user.id;
	var userConfig = userConfigurationAccess.forUser(user);

	var contextEventBusWriter = getConnectedContextEventBusWriter(userId);

	return new Promise(function (resolve, reject) {
		console.log('attempting registering state inferene engine for', userId);
		getContextEventBusReader(userId).then(function (contextEventBusReader) {
			state.StateInferenceEngine.subscribeToContextEvents(
				user,
				contextEventBusReader,
				contextEventBusWriter,
				userConfig,
				function (err) {
					if (err) {
						console.log('error registering state inference engine');
						return reject(err);
					}
					console.log('registered state inference engine');
					resolve(); //kinda weird we dont have anything to return here
				});
		});
	});

}

var enginePromisesByUser = {};

function start() {
	var beginCreationOfEnginesForAllUsers = registeredUsersAccess.getAllRegisteredUsers_().then(function (users) {
		return users.map(function (user) {
			var enginePromise = enginePromisesByUser[user.id] = createContextEngineForUser(user);
			return enginePromise;
		});
	});

	return beginCreationOfEnginesForAllUsers.then(Promise.all.bind(Promise));
}

start().then(function () {
	console.log('Created finite state machines for all users');
	process.send(JSON.stringify({
		status: "ready"
	}));
}).catch(function (err) {
	console.error('Failed to create all context engines with error ' + err);
	process.exit(1);
});
