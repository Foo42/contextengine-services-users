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
		var contextEngineCreationProgress = new EventEmitter();
		contextEngineCreationProgress.done = false;

		async.waterfall(
			[
				registeredUsersAccess.getAllRegisteredUsers,
				function(users, done){
					console.info('about to create engines for ' + users.length + ' users');
					
					async.forEach(
						users, 
						function(user, done){
							console.info('creating context engine for: ' + user.id);
							module.createContextEngine(user, function(err, engine){
								if(err){
									return done(err);
								}
								
								console.info('created context engine for user ' + user.id);
								engines[user.id] = engine;
								
								done(err,engine);
							});
						},
						done
					);
				}
			],
			function(err){
				if(err){
					console.log('error creating context engines: ' + err);
					contextEngineCreationProgress.emit('errorCreatingEngines', err);
					return process.exit();
				}
				
				console.info('done creating engines. err = ' + err);

				contextEngineCreationProgress.done = true;
				contextEngineCreationProgress.emit('createdAllEngines');
				contextEngineCreationProgress = {done:true};
			}
		);
		

		var getContextEngineForUser = function getContextEngineForUser(user, done){
			if(!user.id){
				console.trace('undefined user');
			}
			console.log('getting context engine for user ' + user.id + ' ' + contextEngineCreationProgress.done);
			if(contextEngineCreationProgress.done){
				console.log('got context engine for user ' + user.id);
				return done(null, engines[user.id]);
			}

			contextEngineCreationProgress.on('createdAllEngines',function(){
				console.log('subscribing for createdAllEngines event to access engine for user '+ user.id);
				done(errorCreatingEngines, engines[user.id]);
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