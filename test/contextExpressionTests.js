var assert = require("assert");
var EventEmitter = require('events').EventEmitter;

var eventBus = new EventEmitter();
var states = {};
var stateQueryService = {isStateActive:function(stateName, callback){
	return callback(null,states[stateName]);
}};

var ContextExpression = require('../core/ContextExpression')(eventBus, stateQueryService);

describe('Context expressions', function(){
	beforeEach(function(done){
		console.log('in before each');
		eventBus._events = {};
		states = {};
		done();
	});

	describe('simple event expressions', function(){
		it('should raise event when event described in expression fires', function(done){
			var specification = {
				on:{
					eventMatching:{
						text:'foo'
					}
				}
			};

			var expression = ContextExpression.createExpression(specification);
			expression.startWatch();

			expression.onTriggered(function(){
				done();
			});

			eventBus.emit('event', {text:'foo'});
		});
	});

	describe('simple state expressions', function(){
		it('should raise true event when state defined in isActive clause is active', function(done){
			var specification = {
				whilst:{
					isActive:'Monday'
				}
			};

			states.Monday = true;

			var expression = ContextExpression.createExpression(specification);
			expression.startWatch();

			expression.onTriggered(function(isActive){
				assert.equal(isActive, true);
				done();
			});			
		});

		it('should raise true event when state defined in isNotActive clause is not active', function(done){
			var specification = {
				whilst:{
					isNotActive:'Monday'
				}
			};

			states.Monday = false;

			var expression = ContextExpression.createExpression(specification);
			expression.startWatch();

			expression.onTriggered(function(isActive){
				assert.equal(isActive, true);
				done();
			});			
		});
	});

	describe('qualified event expressions', function(){
		it('should raise event when event described in expression fires and state clause is met', function(done){
			var specification = {
				on:{
					eventMatching:{
						text:'foo'
					}
				},
				whilst:{
					isActive:'Monday'
				}
			};

			states.Monday = true;
			var expression = ContextExpression.createExpression(specification);
			expression.startWatch();

			expression.onTriggered(function(){
				done();
			});

			eventBus.emit('event', {text:'foo'});
		});

		it('should not raise event when event described in expression fires and state clause is not met', function(done){
			this.timeout(500);
			setTimeout(done,300); //if fail callback not called, the test passes

			var specification = {
				on:{
					eventMatching:{
						text:'foo'
					}
				},
				whilst:{
					isNotActive:'Monday'
				}
			};

			states.Monday = true;
			var expression = ContextExpression.createExpression(specification);
			expression.startWatch();

			expression.onTriggered(function(){
				assert.fail();
			});

			eventBus.emit('event', {text:'foo'});
		});
	});
});