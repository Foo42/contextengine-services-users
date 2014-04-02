var assert = require("assert");
var StateInferenceEngine = require('../core/stateInferenceEngine');
var EventEmitter = require('events').EventEmitter;

describe('State creation', function(){
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