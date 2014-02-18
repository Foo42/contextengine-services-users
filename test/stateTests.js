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

	  	// describe('on after seconds', function(){
	  	// 	it('should become inactive after delay in seconds specified', function(done){
	  	// 		var stateConfig = {enterOn:{eventMatching:{text:'enter'}}, exitOn:{delayElapsed:{seconds:5}}};
	  	// 		var mockTaskScheduler = 
	  	// 		var state = new StateInferenceEngine.State(stateConfig);
	  	// 		state.processEvent({text:'enter'});
	  	// 		assert.equal(state.active, true, 'did not start active');
	  							
	  	// 		//need way to mock out setTimeout one way or another
	  	// 	});
	  	// });

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