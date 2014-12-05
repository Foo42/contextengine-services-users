var util = require('util');
var EventEmitter = require('events').EventEmitter;
var fileAppendingEventListener = require('./fileAppendingEventListener');
var path = require('path');
var mkdirp = require('mkdirp');
var async = require('async');
var registeredUsersAccess = require('../registeredUsers');
var userConfigurationAccess = require('./userConfigurationAccess');
var Promise = require('promise');
var getConnectedContextEventBusWriter = require('./contextEventBusWriter');
var getContextEventBusReader = require('./contextEventBusReader');

var attachAllListeners = function attachAllListeners(contextEngine, done) {
	var listeners = [
		fileAppendingEventListener,
		require('./State').StateInferenceEngine
	];

	var userConfig = userConfigurationAccess.forUser(contextEngine.user);

	var contextEventBusWriter = getConnectedContextEventBusWriter(contextEngine.user.id);

	getContextEventBusReader(contextEngine.user.id).then(function (contextEventBusReader) {
		async.parallel(
			[

				function (done) {
					require('./State').StateInferenceEngine.subscribeToContextEvents(contextEngine.user, contextEventBusReader, contextEventBusWriter, userConfig, done);
				}
			], function (err) {
				done(err, contextEngine);
			});
	});
}

module.exports = (function () {
	var module = {};

	module.createContextEngine = function (user) {
		return new Promise(function (resolve, reject) {
			var contextEngine = new module.ContextEngine();
			contextEngine.user = user;

			async.waterfall(
				[

					function (callback) {
						callback(null, contextEngine);
					},
					attachAllListeners
				],
				function (err, engine) {
					if (err) {
						return reject(err)
					}
					return resolve(engine);
				}
			);
		});
	};

	module.createContextEnginesForRegisteredUsers = function () {
		var enginePromisesByUser = {};

		var beginCreationOfEnginesForAllUsers = registeredUsersAccess.getAllRegisteredUsers_().then(function (users) {
			return users.map(function (user) {
				var enginePromise = enginePromisesByUser[user.id] = module.createContextEngine(user);
				return enginePromise;
			});
		});

		var allContextEnginesCreated = beginCreationOfEnginesForAllUsers.then(Promise.all.bind(Promise));

		allContextEnginesCreated
			.then(console.log.bind(console, "Created all context engines"))
			.catch(function (err) {
				console.error('Failed to create all context engines with error ' + err);
				process.exit(1);
			});

		var getContextEngineForUser = function getContextEngineForUser(user) {
			return beginCreationOfEnginesForAllUsers.then(function () {
				return enginePromisesByUser[user.id];
			});
		};

		return {
			getContextEngineForUser: getContextEngineForUser
		}
	}

	module.ContextEngine = function () {
		var self = this;
		var recentEvents = [];

		var generateEventId = (function () {
			var counter = 0;
			return function () {
				return "" + counter+++(new Date().valueOf());
			};
		})();

		self.registerNewEvent = function (event, done) {
			event.metadata = event.metadata || {};
			event.metadata.time = event.metadata.time || new Date();
			event.metadata.id = event.metadata.id || generateEventId();

			recentEvents.push(event);

			self.emit('event created', event);
			done();
		}

		self.getRecentEvents = function (done) {
			done(null, recentEvents);
		}


	};

	util.inherits(module.ContextEngine, EventEmitter);


	return module;
})();
