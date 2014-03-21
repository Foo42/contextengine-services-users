var util = require('util');
var EventEmitter = require('events').EventEmitter;
var fileAppendingEventListener = require('./fileAppendingEventListener');
var path = require('path');
var mkdirp = require('mkdirp');
var async = require('async');
var registeredUsersAccess = require('../registeredUsers');

var getValidDataPathForUser = function getValidDataPathForUser(user, done){
	console.log('user.id ' + user.id);
	var userDataPath = path.join(path.dirname(require.main.filename),'data','userSpecific', user.id);
	mkdirp(userDataPath,function(err){
		done(err, userDataPath);
	});
}

var attachAllListeners = function attachAllListeners(contextEngine, done){
	var listeners = [
		'fileAppendingEventListener',
		'stateInferenceEngine'];
	
	async.eachSeries(
		listeners, 
		function(listenerName, done){
			var module = require('./'+listenerName);
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
	}

	module.createContextEnginesForRegisteredUsers = function(){
		var engines = {};
		var waitingForEngines = [];
		var enginesCreated = false;
		var errorCreatingEngines = false;
		
		async.waterfall(
			[
				registeredUsersAccess.getAllRegisteredUsers,
				function(users, done){
					console.info('about to create engines for ' + users.length + ' users');
					
					async.forEach(
						users, 
						function(user, done){
							console.info('creating context engine for: ' + user);
							module.createContextEngine(user, function(err, engine){
								if(!err && engine){
									console.info('created context engine for user ' + user);
									engines[user] = engine;
								} else {
									consoel.info('error '+ err +' creating context engine for user ' + user);
									errorCreatingEngines = err;
								}
								done(err,engine);
							});
						},
						function(err){
							console.info('done creating engines. err = ' + err + ' number of waiters = ' + waitingForEngines.length);
							enginesCreated = true;
							waitingForEngines.forEach(function(awaiter){awaiter()});
							waitingForEngines = [];
						}
					);
				}
			]
		);
		

		var getContextEngineForUser = function getContextEngineForUser(user, done){
			if(enginesCreated){
				return done(errorCreatingEngines, engines[user]);
			}

			waitingForEngines.push(function(){
				done(errorCreatingEngines, engines[user]);
			});
		};

		return {
			getContextEngineForUser:getContextEngineForUser
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