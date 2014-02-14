var util = require('util');
var EventEmitter = require('events').EventEmitter;
var fileAppendingEventListener = require('./fileAppendingEventListener');
var eventInferenceEngine = require('./eventInferenceEngine');

module.exports = (function(){
	var module = {};

	module.createContextEngine = function(){
		var contextEngine = new module.ContextEngine();
		
		var listeners = [
			'fileAppendingEventListener',
			'eventInferenceEngine',
			'stateInferenceEngine'];
		
		listeners.forEach(function(listenerName){
			var module = require('./'+listenerName);
			module.attachListener(contextEngine);
		});

		return contextEngine;
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