var util = require('util');
var EventEmitter = require('events').EventEmitter;
var fileAppendingEventListener = require('./fileAppendingEventListener');
var path = require('path');
var async = require('async');


module.exports = (function(){
	var module = {};

	module.createContextEngine = function(user, done){
		var contextEngine = new module.ContextEngine();
		contextEngine.userDataPath = path.join(path.dirname(require.main.filename),'data','userSpecific', user.id);
		
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

	module.createContextEnginesForRegisteredUsers = function(){
		var engines = {};
		return {
			getContextEngineForUser:function(user, done){
				//Create engines on demand for now. No persistance etc.
				if(!engines[user]){
					module.createContextEngine(user, function(err, engine){
						if(err){
							console.log('error creating context engine for user');
							done(err);
						}else{
							console.log('created engine for user');
							engines[user] = engine;
							done(null,engines[user]);	
						}
						
					});
				}else{
					done(null, engines[user]);
				}
			}
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