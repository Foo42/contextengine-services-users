var assert = require("assert");
var StateInferenceEngine = require('../core/stateInferenceEngine');

var createMockScheduler = function createMockScheduler(){
	var mockScheduler = {};
	mockScheduler.requestedTimeout = {};
	mockScheduler.setTimeout = function(callback, timeout){
		mockScheduler.requestedTimeout.callback = callback;
		mockScheduler.requestedTimeout.milliseconds = timeout;
		return 42;//some timeout id
	};

	mockScheduler.clearTimeout = function(id){
		mockScheduler.requestedTimeout.wasCleared = true;
	};

	mockScheduler.createCronJob= function(cronSpec, callback){
		mockScheduler.requestedCronJob = {};
		mockScheduler.requestedCronJob.spec = cronSpec;
		mockScheduler.requestedCronJob.callback = callback;

		return {
			start:function(){
				mockScheduler.requestedCronJob.active = true;
			},
			stop:function(){
				mockScheduler.requestedCronJob.active = false;
			}
		}
	}

	return mockScheduler;
}

describe('State', function(){ 
	describe('Initial State', function(){
		it('should should start in inactive state if no "initialState" is specified in config',function(done){
			var stateConfig = {name:'some state', enterOn:{eventMatching:{text:'hammer time'}}};
			var state = new StateInferenceEngine.State(stateConfig);
			assert.equal(state.active, false);
			done();
		});

		it('should should start in state defined by "initialState" if specified in config',function(done){
			var defaultActiveConfig = {name:'some state which should be active', initialState:'active', enterOn:{eventMatching:{text:'hammer time'}}};
			var defaultInactiveConfig = {name:'some other state which should be inactive', initialState:'inactive', enterOn:{eventMatching:{text:'hammer time'}}};
			
			var shouldBeActiveState = new StateInferenceEngine.State(defaultActiveConfig);
			assert.equal(shouldBeActiveState.active, true, 'state should be active by default as specified in config');


			var shouldBeInactiveState = new StateInferenceEngine.State(defaultInactiveConfig);
			assert.equal(shouldBeInactiveState.active, false, 'state should be inactive by default as specified in config');

			done();
		});
	});

  	describe('State entry', function(){  
  		describe('on events matching', function(){
	  		it('should become active after processing an event matching the criteria', function(done){
	  			var eventMatchingSpec = {text:'hello'};
	  			var stateConfig = {enterOn:{eventMatching:eventMatchingSpec}};

	  			var eventCalledWith;
	  			var state = new StateInferenceEngine.State(stateConfig);
	  			assert.equal(state.active, false, 'did not start inactive');
	  			
				var testEvent = {text:'blarg'};
	  			state.processEvent(testEvent);
	  			assert.equal(state.active, false, 'became active on non-matching event');

				var testEvent = {text:'hello'};
	  			state.processEvent(testEvent);
	  			assert.equal(state.active, true, 'did not become active after matching event');

	  			done();
	  		});
	  	});

	  	it('should raise an event when becomes active', function(done){	  			
  			var stateConfig = {enterOn:{eventMatching:{}}};
  			var eventFired  = false;
  			var state = new StateInferenceEngine.State(stateConfig);
  			state.on('activated', function(){
  				eventFired = true;
  			});

  			state.processEvent({});

  			assert.ok(eventFired, 'event did not fire');
  			done()
  		});

  		describe('cron entry conditions', function(){
	  		it('should schedule cron task for entry with scheduler when created', function(done){
	  			
	  			var mockScheduler = createMockScheduler();

	  			var stateConfig = {
	  				enterOn:{cron:'00 26 12 * * *'}
	  			};

	  			var state = new StateInferenceEngine.State(stateConfig, mockScheduler);
	  			
	  			assert.ok(mockScheduler.requestedCronJob, 'no cron job was set');
	  			assert.equal(mockScheduler.requestedCronJob.spec, '00 26 12 * * *', 'did not set cron spec');
	  			assert.equal(mockScheduler.requestedCronJob.active, true, 'cron job was never activated')

	  			mockScheduler.requestedCronJob.callback();
	  			assert.equal(state.active, true, 'cron callback did not cause state to activate');
	  			done();
	  		});

	  		it('should stop cron task once state active', function(done){
	  			var mockScheduler = createMockScheduler();

	  			var stateConfig = {
	  				enterOn:{cron:'00 26 12 * * *'}
	  			};

	  			var state = new StateInferenceEngine.State(stateConfig, mockScheduler);	  		
	  			state.activate();

	  			assert.equal(mockScheduler.requestedCronJob.active, false);
	  			done();
	  		});

	  		it('should start cron task once state deactivated', function(done){
	  			var mockScheduler = createMockScheduler();

	  			var stateConfig = {
	  				enterOn:{cron:'00 26 12 * * *'}
	  			};

	  			var state = new StateInferenceEngine.State(stateConfig, mockScheduler);	  		
	  			state.activate();

	  			state.deactivate();

	  			assert.equal(mockScheduler.requestedCronJob.active, true);
	  			done();
	  		});
	  	});
  	});

  	describe('State exit', function(){  
  		describe('on events matching', function(){
	  		it('should become inactive after processing an event matching the criteria', function(done){
	  			var stateConfig = {enterOn:{eventMatching:{text:'enter'}}, exitOn:{eventMatching:{text:'exit'}}};

	  			var state = new StateInferenceEngine.State(stateConfig);
	  			state.processEvent({text:'enter'});
	  			assert.equal(state.active, true, 'did not start active');
	  			
				var eventToTriggerExit = {text:'exit'};
	  			state.processEvent(eventToTriggerExit);
	  			assert.equal(state.active, false, 'event did not become inactive');

	  			done();
	  		});
	  	});

	  	describe('time delay exit conditions', function(){
	  		it('should become inactive after delay in seconds specified', function(done){
	  			
	  			var mockScheduler = createMockScheduler();

	  			var stateConfig = {
	  				enterOn:{eventMatching:{text:'enter'}},
	  				exitOn:{afterDelay:{seconds:5}}
	  			};
	  			var state = new StateInferenceEngine.State(stateConfig, mockScheduler);
	  			
	  			state.processEvent({text:'enter'});
	  			assert.equal(mockScheduler.requestedTimeout.milliseconds, 5000, "state did not set timeout, or set it with incorrect time");

	  			mockScheduler.requestedTimeout.callback();
	  			assert.equal(state.active, false, "firing callback registered with timeout did not deactive state");
	  			done();
	  		});
	  	});

	  	describe('cron exit conditions', function(){
	  		it('should schedule cron task for exit with scheduler when created', function(done){
	  			
	  			var mockScheduler = createMockScheduler();

	  			var stateConfig = {
	  				enterOn:{eventMatching:{text:'enter'}},
	  				exitOn:{cron:'00 26 12 * * *'}
	  			};

	  			var state = new StateInferenceEngine.State(stateConfig, mockScheduler);
	  			
	  			state.processEvent({text:'enter'});

	  			assert.ok(mockScheduler.requestedCronJob, 'no cron job was set');
	  			assert.equal(mockScheduler.requestedCronJob.spec, '00 26 12 * * *', 'did not set cron spec');
	  			assert.equal(mockScheduler.requestedCronJob.active, true, 'cron job was never activated')

	  			mockScheduler.requestedCronJob.callback();
	  			assert.equal(state.active, false, 'cron callback did not cause state to deactivate');
	  			done();
	  		});

	  		it('should activate exit cron jobs immediately when initialState is active', function(){
	  			
	  			var mockScheduler = createMockScheduler();

	  			var stateConfig = {
	  				name:'foo',
	  				initialState:'active',
	  				exitOn:{cron:'00 26 12 * * *'}
	  			};

	  			var state = new StateInferenceEngine.State(stateConfig, mockScheduler);
	  			
	  			assert.equal(mockScheduler.requestedCronJob.active, true, 'cron job was never activated');
	  		});

	  		it('should stop any cron exit tasks when state becomes deactivated', function(done){
	  			
	  			var mockScheduler = createMockScheduler();

	  			var stateConfig = {
	  				enterOn:{eventMatching:{text:'enter'}},
	  				exitOn:{cron:'00 26 12 * * *'}
	  			};

	  			var state = new StateInferenceEngine.State(stateConfig, mockScheduler);
	  			
	  			state.processEvent({text:'enter'});

	  			state.deactivate();
	  			assert.equal(mockScheduler.requestedCronJob.active, false);
	  			done();
	  		});
	  	});

	  	describe('multiple exit conditions', function(){
	  		describe('anyOf', function(){
	  			it('should exit on any eventMatching condition being met', function(done){

	  				var config = {
			  			enterOn:{eventMatching:{text:'enter'}},
			  			exitOn:{
			  				anyOf:[
			  					{eventMatching:{text:'foo'}},
			  					{eventMatching:{text:'sandwhich'}},
			  					{eventMatching:{text:'bar'}}
			  				]
			  			}
			  		};

			  		var timeoutRequested, timeoutCallback;
		  			var mockSetTimeout = function(callback, timeout){
		  				timeoutCallback = callback;
		  				timeoutRequested = timeout;
		  			}

			  		var state = new StateInferenceEngine.State(config, {setTimeout:mockSetTimeout});
			  		state.activate();

			  		//Act
			  		state.processEvent({text:'sandwhich'});
			  		
			  		//Assert
			  		assert.equal(state.active, false, 'event did not deactivate');
			  		done();
	  			});

	  			it('should exit on any afterDelay timeout elapsing', function(done){
	  				var mockScheduler = createMockScheduler();

	  				var config = {
			  			enterOn:{eventMatching:{text:'enter'}},
			  			exitOn:{
			  				anyOf:[
			  					{eventMatching:{text:'foo'}},
			  					{eventMatching:{text:'sandwhich'}},
			  					{afterDelay:{seconds:5}},
			  					{eventMatching:{text:'bar'}}
			  				]
			  			}
			  		};

			  		var state = new StateInferenceEngine.State(config, mockScheduler);
			  		
			  		//Act
			  		state.activate();

			  		assert.equal(mockScheduler.requestedTimeout.milliseconds, 5000, "state did not set timeout, or set it with incorrect time");

		  			mockScheduler.requestedTimeout.callback();
		  			assert.equal(state.active, false, "firing callback registered with timeout did not deactive state");
		  			done();
	  			});

				it('should cancle any exit timeouts created with scheduler when exiting due to other condition', function(done){
	  				var timeoutRequested, timeoutCallback;
		  			var mockSetTimeout = function(callback, timeout){
		  				timeoutCallback = callback;
		  				timeoutRequested = timeout;
		  				return 42;//some timeout id
		  			}

		  			var mockScheduler = createMockScheduler();		  			

	  				var config = {
			  			enterOn:{eventMatching:{text:'enter'}},
			  			exitOn:{
			  				anyOf:[
			  					{eventMatching:{text:'exit'}},
			  					{afterDelay:{seconds:5}}
			  				]
			  			}
			  		};

			  		var state = new StateInferenceEngine.State(config, mockScheduler);
			  		
			  		//Act
			  		state.activate();			  		
			  		assert.equal(mockScheduler.requestedTimeout.milliseconds, 5000, 'callback not set in the first place');
			  		state.processEvent({text:'exit'});
			  		assert.equal(state.active, false, 'state did not exit when it should');
			  		assert.equal(mockScheduler.requestedTimeout.wasCleared, true, "timeout was not cleared when state exited");
		  			
		  			done();
	  			});
	  		});
	  		


	  	});

	  	it('should raise an event when becomes inactive', function(done){	  			
  			var stateConfig = {exitOn:{eventMatching:{}}};
  			var eventFired  = false;
  			var state = new StateInferenceEngine.State(stateConfig);
  			state.activate();


  			state.on('deactivated', function(){
  				eventFired = true;
  			});

  			state.processEvent({});

  			assert.ok(eventFired, 'event did not fire');
  			done();
  		});
  	});
});