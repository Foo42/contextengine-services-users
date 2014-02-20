var assert = require("assert");
var StateInferenceEngine = require('../core/stateInferenceEngine');

describe('State', function(){ 

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
  			done();
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
	  			
	  			var timeoutRequested, timeoutCallback;
	  			var mockSetTimeout = function(callback, timeout){
	  				timeoutCallback = callback;
	  				timeoutRequested = timeout;
	  			}

	  			var stateConfig = {
	  				enterOn:{eventMatching:{text:'enter'}},
	  				exitOn:{afterDelay:{seconds:5}}
	  			};
	  			var state = new StateInferenceEngine.State(stateConfig, {setTimeout:mockSetTimeout});
	  			
	  			state.processEvent({text:'enter'});
	  			assert.equal(timeoutRequested, 5000, "state did not set timeout, or set it with incorrect time");

	  			timeoutCallback();
	  			assert.equal(state.active, false, "firing callback registered with timeout did not deactive state");
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
	  				var timeoutRequested, timeoutCallback;
		  			var mockSetTimeout = function(callback, timeout){
		  				timeoutCallback = callback;
		  				timeoutRequested = timeout;
		  			}

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

			  		var timeoutRequested, timeoutCallback;
		  			var mockSetTimeout = function(callback, timeout){
		  				timeoutCallback = callback;
		  				timeoutRequested = timeout;
		  			}

			  		var state = new StateInferenceEngine.State(config, {setTimeout:mockSetTimeout});
			  		
			  		//Act
			  		state.activate();

			  		assert.equal(timeoutRequested, 5000, "state did not set timeout, or set it with incorrect time");

		  			timeoutCallback();
		  			assert.equal(state.active, false, "firing callback registered with timeout did not deactive state");
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