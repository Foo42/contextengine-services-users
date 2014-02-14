var objectMatches = require('./objectMatches');
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
		states.forEach(function(state){
			state.on('activated', function(){
				var stateActivedEvent = {type:'stateChange.activated', stateName:state.name};
				self.emit('stateChange.activated', stateActivedEvent);
			});

			state.on('deactivated', function(){
				var stateActivedEvent = {type:'stateChange.deactivated', stateName:state.name};
				self.emit('stateChange.deactivated', stateActivedEvent);
			});
		});
		
		self.processEvent = function(event){
			states.forEach(function(state){state.processEvent(event)});
		}

		self.getActiveStates = function(){
			return states.filter(function(state){return state.active}).map(function(state){return state.name});
		}
	};

	module.State = function(config){
		var self = this;

		Object.defineProperty(this, "name", {
            get:function(){return config.name},            
        });		

		var matchesEntryConditions = function(event){
			if(!config.enterOn || !config.enterOn.eventMatching){return;}

			return objectMatches(event, config.enterOn.eventMatching);			
		}

		var matchesExitConditions = function(event){
			if(!config.exitOn || !config.exitOn.eventMatching){return;}

			return objectMatches(event, config.exitOn.eventMatching);
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
	util.inherits(module.StateInferenceEngine, EventEmitter);

	return module;
})();