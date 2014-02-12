var assert = require("assert")
var StateInferenceEngine = require('../core/stateInferenceEngine');

describe('StateInferenceEngine', function(){
 
  	describe('When event recieved', function(){  
  		it('should pass event to every state', function(done){
  			var eventCalledWith;
  			var states = [{processEvent:function(ev){eventCalledWith = ev}}];
  			var engine = new StateInferenceEngine.StateInferenceEngine(states);
			var testEvent = {type:'test event'};
  			engine.processEvent(testEvent);

  			assert.equal(testEvent, eventCalledWith);
  			done();
  		});
  	});
});