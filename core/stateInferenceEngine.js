var objectMatches = require('./objectMatches');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');

module.exports = (function(){
	var module = {};

	module.attachListener = function(contextEngine){
		var stateConfigs = [{
				name:'Testing',
				enterOn:{eventMatching:{type:'text', text:'testing'}},
				exitOn:{eventMatching:{type:'text', text:'testing over'}}
			}];

		var taskScheduler = {setTimeout:setTimeout};
		var states = stateConfigs.map(function(stateConfig){new module.State(stateConfig, taskScheduler)});			

		var listener = new module.StateInferenceEngine(states);
		contextEngine.on('event created', listener.processEvent);

		listener.on('stateChange.activated', function(event){contextEngine.registerNewEvent(event,function(){})});
		listener.on('stateChange.deactivated', function(event){contextEngine.registerNewEvent(event,function(){})});

		contextEngine.states = listener;
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

	module.State = function(config, taskScheduler){
		var self = this;

		Object.defineProperty(this, "name", {
            get:function(){return config.name},            
        });

        (function(){
        	var setupAnyExitTimeouts = function(config){
        		var timeouts = getAllExitConditionsOfType(config, 'afterDelay');
        		timeouts.forEach(function(timeout){
        			taskScheduler.setTimeout(self.deactivate, 1000 * timeout.seconds);
        		});
        	}

        	self.on('activated', function(){
	        	setupAnyExitTimeouts(config);	        	
        	});
        })();	

		var matchesEntryConditions = function(event){
			if(!config.enterOn || !config.enterOn.eventMatching){return;}

			return objectMatches(event, config.enterOn.eventMatching);			
		}

		var getAllExitConditionsOfType = function(config, type){
			if(!config.exitOn){
				return [];
			}

			var exitConditionsOfType = [];
			if(config.exitOn[type]){
				exitConditionsOfType.push(config.exitOn[type]);
			}
			if(config.exitOn.anyOf){
				exitConditionsOfType = exitConditionsOfType.concat(
					config.exitOn.anyOf
						.filter(function(condition){return condition[type]})
						.map(function(matcher){return matcher[type]}));
			}

			return exitConditionsOfType;
		}

		var matchesExitConditions = function(event){
			var exitMatchers = getAllExitConditionsOfType(config, 'eventMatching');
			
			console.log('exitMatchers: ' + JSON.stringify(exitMatchers));
			return _.any(exitMatchers, function(matcher){return objectMatches(event, matcher)});

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