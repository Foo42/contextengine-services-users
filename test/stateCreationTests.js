var assert = require("assert");
var StateInferenceEngine = require('../core/stateInferenceEngine');
var EventEmitter = require('events').EventEmitter;

describe('State creation', function(){
	describe('States with entry and exit conditions', function(){
		it('should activate when enter event condition fires', function(done){
			var specification = {
				enter:{
					on:{
						some:'event config'
					}
				}
			};

			var fakeEventExpression = new EventEmitter();
			fakeEventExpression.startWatch = function(){};
			fakeEventExpression.stopWatch = function(){};
			var mockExpressionFactory = {
				createEventExpression: function(spec){
					return fakeEventExpression;
				}
			};

			StateInferenceEngine.createStateRuleFromConfig(specification, mockExpressionFactory, function(err, state){
				if(err){
					assert.fail();
				}
				assert.ok(state);
				assert.equal(state.active, false);

				state.on('activated', function(){
					assert.equal(state.active, true);
					done();
				});

				fakeEventExpression.emit('triggered');
			});
		});

		it('should stop watching entry condition when active, and start watching exit', function(done){
			var specification = {
				enter:{
					on:{
						someEntryConfig:' '
					}
				},
				exit:{
					on:{
						someExitConfig:' '
					}
				}
			};

			var createFakeEventExpression = function(){
				var fakeEventExpression = new EventEmitter();
				fakeEventExpression.startWatch = function(){
					fakeEventExpression.startCalled = true;
				};
				fakeEventExpression.stopWatch = function(){
					fakeEventExpression.stopCalled = true;
				};
				fakeEventExpression.forceTrigger = function(){
					fakeEventExpression.emit('triggered');
				};
				return fakeEventExpression;
			}

			var entryCondition = createFakeEventExpression();
			var exitCondition = createFakeEventExpression();
			var mockExpressionFactory = {
				createEventExpression: function(spec){
					console.log(spec);
					if(spec.on.someEntryConfig){
						return entryCondition;
					}
					if(spec.on.someExitConfig){
						return exitCondition;
					}
					assert.fail();
				}
			};

			StateInferenceEngine.createStateRuleFromConfig(specification, mockExpressionFactory, function(err, state){
				if(err || !state){
					assert.fail();
				}

				assert.ok(entryCondition.startCalled);

				state.on('activated', function(){
					assert.ok(entryCondition.stopCalled);
					assert.ok(exitCondition.startCalled);	
					done();
				});

				entryCondition.forceTrigger();
			});
		});
	});

	describe('States with a an active condition', function(){
		var expressionValue = true;
		var fakeStateExpression;

		var mockExpressionFactory = {
			createStateExpression:function(config){
				return fakeStateExpression;
			}
		};

		it('should get its initial state from a stateExpression', function(done){
			var expressionValue = true;

			fakeStateExpression = {
				evaluate:function(callback){
					return callback(null, expressionValue);
				},
				startWatch:function(){

				},
				on:function(){}
			};

			var specification = {
				isActive:{
					whilst:{
						isActive:'Monday'
					}
				}
			};

			StateInferenceEngine.createStateRuleFromConfig(specification, mockExpressionFactory, function(err, state){
				if(err){
					assert.fail();
				}
				console.log(state);
				assert.ok(state);
				assert.equal(state.active, expressionValue);
				done();
			});
		});

		it('should update its active state when the stateExpression changes its value', function(done){
			var expressionValue = true;

			fakeStateExpression = new EventEmitter();

			fakeStateExpression.evaluate = function(callback){
					return callback(null, expressionValue);
			};
			fakeStateExpression.startWatch = function(){
				fakeStateExpression.emit('watching');				
			};

			var specification = {
				isActive:{
					whilst:{
						isActive:'Monday'
					}
				}
			};

			StateInferenceEngine.createStateRuleFromConfig(specification, mockExpressionFactory, function(err, state){
				if(err){
					assert.fail();
				}
				console.log(state);
				assert.ok(state);
				assert.equal(state.active, true);

				state.on('deactivated', function(){
					assert.equal(state.active, false);
					done();	
				});

				expressionValue = false;
				fakeStateExpression.emit('valueChanged', expressionValue);

				
			});
		});
	});
});