var filtr = require('filtr');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

module.exports = (function(){
	var module = {};

	module.attachListener = function(contextEngine){
		var states = [];

		var listener = new module.StateInferenceEngine(states);
		contextEngine.on('event created', listener.processEvent);	
	}

	module.StateInferenceEngine = function(states){
		var self = this;
		
		self.processEvent = function(event){
			states.forEach(function(state){state.processEvent(event)});
		}
	};

	module.State = function(config){
		var self = this;		

		var eventMatchesConditions = function(event, conditions){
			var query = filtr(conditions);
			return query.test([event]).length > 0;			
		}

		var matchesEntryConditions = function(event){
			if(!config.enterOn || !config.enterOn.eventMatching){return;}

			return eventMatchesConditions(event, config.enterOn.eventMatching);			
		}

		var matchesExitConditions = function(event){
			if(!config.exitOn || !config.exitOn.eventMatching){return;}

			return eventMatchesConditions(event, config.exitOn.eventMatching);
		}

		self.activate = function(){
			self.active = true;
			self.emit('activated')
		}

		self.deactivate = function(){
			self.active = false;
			self.emit('deactivated')
		}

		self.processEvent = function(event){
			if(!self.active && matchesEntryConditions(event)){
				self.activate();
			}
			if(self.active && matchesExitConditions(event)){
				self.deactivate();
			}
		}

		self.active = false;
	}

	util.inherits(module.State, EventEmitter);

	return module;
})();