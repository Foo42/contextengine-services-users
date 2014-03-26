var assert = require("assert")
var StateInferenceEngine = require('../core/stateInferenceEngine');

describe('StateInferenceEngine', function(){
 
  	describe('When event recieved', function(){  
  		it('should pass event to every state', function(done){
  			var eventCalledWith;
  			var state = new StateInferenceEngine.State({name:'test'});
  			state.processEvent = function(ev){eventCalledWith = ev};
  			var engine = new StateInferenceEngine.StateInferenceEngine([state]);
			var testEvent = {type:'test event'};
  			engine.processEvent(testEvent);

  			assert.equal(testEvent, eventCalledWith);
  			done();
  		});
  	});

  	describe('Querying active states', function(){
  		describe('getActiveStates', function(){
  			it('should list names of active states', function(done){
  				var states = [new StateInferenceEngine.State({name:'foo'}), new StateInferenceEngine.State({name:'bar'})];
  				states[0].activate();
  				var engine = new StateInferenceEngine.StateInferenceEngine(states);
  				assert.equal(JSON.stringify(engine.getActiveStates()), JSON.stringify(['foo']));

  				done();
  			});
  		});

  		describe('isStateActive', function(){
  			it('should return whether state is active', function(done){
  				var states = [new StateInferenceEngine.State({name:'foo'}), new StateInferenceEngine.State({name:'bar'})];
  				states[0].activate();
  				var engine = new StateInferenceEngine.StateInferenceEngine(states);
  				engine.isStateActive('foo', function(err, result){
  					assert.equal(result, true);

  					engine.isStateActive('bar', function(err, result){
	  					assert.equal(result, false);
	  					done();
	  				});
  				});
  			});
  		});
  	});

  	describe('Active states changes', function(){
		it('should raise a stateChange.actived event when a state becomes active', function(done){
			var eventRecieved;
			
			var states = [new StateInferenceEngine.State({name:'foo'}), new StateInferenceEngine.State({name:'bar'})];
			var engine = new StateInferenceEngine.StateInferenceEngine(states);
			engine.on('stateChange.activated', function(event){
				eventRecieved = event;
			});

			states[0].activate();

			var expectedEvent = {type:'stateChange.activated', stateName:'foo'};
			assert.equal(JSON.stringify(eventRecieved), JSON.stringify(expectedEvent));

			done();
		});

		it('should raise a stateChange.deactived event when a state becomes inactive', function(done){
			var eventRecieved;
			
			var states = [new StateInferenceEngine.State({name:'foo'}), new StateInferenceEngine.State({name:'bar'})];
			states[0].activate();
			states[1].activate();

			var engine = new StateInferenceEngine.StateInferenceEngine(states);
			engine.on('stateChange.deactivated', function(event){
				eventRecieved = event;
			});

			states[1].deactivate();

			var expectedEvent = {type:'stateChange.deactivated', stateName:'bar'};
			assert.equal(JSON.stringify(eventRecieved), JSON.stringify(expectedEvent));

			done();
		});
  	});
});