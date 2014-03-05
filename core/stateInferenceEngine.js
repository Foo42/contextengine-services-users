var objectMatches = require('./objectMatches');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');
var userConfigurationAccess = require('./userConfigurationAccess');
var async = require('async');

module.exports = (function(){
	var module = {};

	module.attachListener = function(contextEngine, done){
		console.info('attatching state inference engine');
		var userConfig = userConfigurationAccess.forUser(contextEngine.user);
		async.waterfall(
			[
				userConfig.getStateConfig,
				function(stateConfigs, done){
					var taskScheduler = {setTimeout:setTimeout, clearTimeout:clearTimeout};
					var states = stateConfigs.states.map(function(stateConfig){return new module.State(stateConfig, taskScheduler)});			

					var listener = new module.StateInferenceEngine(states);
					contextEngine.on('event created', listener.processEvent);

					listener.on('stateChange.activated', function(event){contextEngine.registerNewEvent(event,function(){})});
					listener.on('stateChange.deactivated', function(event){contextEngine.registerNewEvent(event,function(){})});

					contextEngine.states = listener;
					done(null)			
				}
			],
			done
		);
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
		console.info('creating state');
		var self = this;

		Object.defineProperty(this, "name", {
            get:function(){return config.name},            
        });

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

		var matchesEntryConditions = function(event){
			if(!config.enterOn || !config.enterOn.eventMatching){return;}

			return objectMatches(event, config.enterOn.eventMatching);			
		}

		var matchesExitConditions = function(event){
			var exitMatchers = getAllExitConditionsOfType(config, 'eventMatching');
			
			return _.any(exitMatchers, function(matcher){return objectMatches(event, matcher)});

		}

		self.activate = function(){
			self.active = true;
			console.info('activating state ' + (self.name || 'unnamed'));
			self.emit('activated')
		}

		self.deactivate = function(){
			self.active = false;
			console.info('deactivating state ' + (self.name || 'unnamed'));
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

		    var setup = function setup(){
        	var timeouts = [];
        	var exitCrons = [];
        	var setupAnyExitTimeouts = function setupAnyExitTimeouts(config){
        		var timeoutConditions = getAllExitConditionsOfType(config, 'afterDelay');
        		timeoutConditions.forEach(function(timeout){
        			timeouts.push(taskScheduler.setTimeout(self.deactivate, 1000 * timeout.seconds));
        		});
        	}

        	var setupAnyExitCronJobs = function setupAnyExitCronJobs(config){
        		var cronConditions = getAllExitConditionsOfType(config, 'cron');
        		cronConditions.forEach(function(cron){
        			exitCrons.push(taskScheduler.createCronJob(cron, self.deactivate));
        		})
        	}
        	setupAnyExitCronJobs(config);

        	self.on('activated', function(){
	        	setupAnyExitTimeouts(config);	        	
	        	exitCrons.forEach(function(cronJob){cronJob.start()});
        	});

        	self.on('deactivated', function(){
        		timeouts.forEach(function(timeout){taskScheduler.clearTimeout(timeout)});
        		timeouts = [];
        	})
        };
        setup();
	}

	util.inherits(module.State, EventEmitter);
	util.inherits(module.StateInferenceEngine, EventEmitter);

	return module;
})();