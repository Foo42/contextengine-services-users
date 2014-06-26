var util = require('util');
var EventEmitter = require('events').EventEmitter;
var fileAppendingEventListener = require('./fileAppendingEventListener');
var path = require('path');
var mkdirp = require('mkdirp');
var async = require('async');
var registeredUsersAccess = require('../registeredUsers');
var Promise = require('promise');

var getValidDataPathForUser = function getValidDataPathForUser(user, done){
	console.log('user.id ' + user.id);
	var userDataPath = path.join(path.dirname(require.main.filename),'data','userSpecific', user.id);
	mkdirp(userDataPath,function(err){
		done(err, userDataPath);
	});
}

var attachAllListeners = function attachAllListeners(contextEngine, done){
	var listeners = [
		fileAppendingEventListener,
		require('./State').StateInferenceEngine];
	
	async.eachSeries(
		listeners, 
		function(listener, done){
			var module = listener;
			module.attachListener(contextEngine, done);
		},
		function(err){
			done(err, contextEngine);
		}
	);
}

module.exports = (function(){
	var module = {};

	module.createContextEngine = function(user, done){
		var contextEngine = new module.ContextEngine();
		contextEngine.user = user;

		async.waterfall(
			[
				function(callback){getValidDataPathForUser(user, callback);},
				function(userDataPath, callback){
					contextEngine.userDataPath = userDataPath;
					callback(null,contextEngine);							
				},
				attachAllListeners
			],
			done
		);
	};



	module.createContextEnginesForRegisteredUsers = function(){
		var engines = {};
		
		var createContextEnginePromise = Promise.denodeify(module.createContextEngine.bind(module));		
		
		var enginePromisesByUser = {};
		
		
		var createAllEngines = registeredUsersAccess.getAllRegisteredUsers_().then(function(users){
			console.info('about to create engines for ' + users.length + ' users');	
			
			var enginePromisesList = [];

			users.forEach(function(user){
				var enginePromise = enginePromisesByUser[user.id] = createContextEnginePromise(user);
				enginePromisesList.push(enginePromise);
			});

			return Promise.all(enginePromisesList);
		})
		.then(console.log.bind(console, "Created all context engines"))
		.catch(function(err){
			console.error('Failed to create all context engines with error ' + err);
			process.exit(1);
		});

		var getContextEngineForUser = function getContextEngineForUser(user, done){
			console.log('getting context engine for user ' + user.id);
			if(!user.id){
				return console.trace('undefined user');
			}
			createAllEngines.then(function(){
				console.log('all engines created......');
				console.log('status of user engine promise: ');
				console.dir(enginePromisesByUser);
				enginePromisesByUser[user.id].then(done.bind(done,null)).catch(done);
			});
		};

		var getContextEngineForUserPromise = function getContextEngineForUserPromise(user){
			return new Proj

			if(!user.id){
				return console.trace('undefined user');
			}
			return enginePromisesByUser[user.id].then(done.bind(done,null)).catch(done);			
		};

		return {
			getContextEngineForUser:getContextEngineForUser,
			getContextEngineForUserPromise: getContextEngineForUserPromise
		}
	}

	module.ContextEngine = function(){
		var self = this;
		var recentEvents = [];

		var generateEventId = (function(){
			var counter = 0;
			return function(){
				return "" + counter++ + (new Date().valueOf());
			};
		})();

		self.registerNewEvent = function(event, done){
			event.metadata = event.metadata || {};
			event.metadata.time = event.metadata.time || new Date();
			event.metadata.id = event.metadata.id || generateEventId();

			recentEvents.push(event);
			
			self.emit('event created', event);
			done();
		}

		self.getRecentEvents = function(done){
			done(null, recentEvents);
		}


	};

	util.inherits(module.ContextEngine, EventEmitter);
	

	return module;
})();