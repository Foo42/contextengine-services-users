var util = require('util');
var EventEmitter = require('events').EventEmitter;
var fileAppendingEventListener = require('./fileAppendingEventListener');

module.exports = (function(){
	var module = {};

	module.createContextEngine = function(){
		var contextEngine = new module.ContextEngine();
		fileAppendingEventListener.attachListener(contextEngine);

		return contextEngine;
	}

	module.ContextEngine = function(){
		var self = this;
		var recentEvents = [];


		self.registerNewEvent = function(event, done){
			event.metadata = event.metadata || {};
			event.metadata.time = event.metadata.time || new Date();

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