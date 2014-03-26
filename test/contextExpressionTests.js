var assert = require("assert");
var EventEmitter = require('events').EventEmitter;

var eventBus = new EventEmitter();



var stateQueryService = (function(){
	var states = {};
	var stateWatches = new EventEmitter();

	return {
		isStateActive: function(stateName, callback){
			return callback(null,states[stateName]);
		},		
		setState: function(name, isActive){
			states[name] = isActive;
			stateWatches.emit(name, isActive);
		},
		cleanUp: function(){
			stateWatches._events = {};
		},
		createQuery: function(stateName){
			var query = new EventEmitter();
			query.currentValue = function(callback){
				console.log('in query service query currentValue, state = ' + states[stateName]);
				return callback(null,states[stateName]);
			};
			query.startWatch = function(){				
				stateWatches.on(stateName, function(newValue){
					console.log('about to emit valueChanged to subs ' + Object.keys(query._events));					
					query.emit('valueChanged',newValue);
				});
				query.emit('watching');
			}
			return query;
		}
	};
})();

var setState = stateQueryService.setState;
delete stateQueryService.setState;


var ContextExpression = require('../core/ContextExpression')(eventBus, stateQueryService);

//TODO: 
	// * State expression stopWatch
	// * State expression polling / state subs


describe('Context expressions', function(){
	beforeEach(function(done){
		console.log('in before each');
		eventBus._events = {};
		states = {};
		stateQueryService.cleanUp();
		done();
	});

	

	describe('simple state expressions', function(){
		it('should raise true event when state defined in isActive clause becomes active', function(done){
			var specification = {
				whilst:{
					isActive:'Monday'
				}
			};

			setState('Monday', false);

			var expression = ContextExpression.createStateExpression(specification);
			expression.startWatch();

			expression.on('valueChanged', function(isActive){
				assert.equal(isActive, true);
				done();
			});

			setState('Monday', true);
		});

		it('should raise true event when state defined in isNotActive clause becomes not active', function(done){
			var specification = {
				whilst:{
					isNotActive:'Monday'
				}
			};

			setState('Monday', true);

			var expression = ContextExpression.createStateExpression(specification);
			expression.startWatch();

			expression.on('valueChanged', function(isActive){
				assert.equal(isActive, true);
				done();
			});			

			setState('Monday', false);
		});

		it('should raise events if expression becomes true', function(done){
			var specification = {
				whilst:{
					isActive:'Monday'
				}
			};

			setState('Monday', false);

			var expression = ContextExpression.createStateExpression(specification);			
			expression.startWatch();

			setTimeout(function(){
				setState('Monday', true);
			},300);
			

			expression.on('valueChanged', function(isActive){
				//We dont mind if this triggers with false first, only that it becomes true
				if(isActive){
					done();
				}
			});	
		});

		it('should not raise events when watch stopped', function(){
			
		});
	});

	describe('event expressions', function(){
		describe('simple event expressions', function(){
			it('should raise event when eventMatching condition described in expression fires', function(done){
				var specification = {
					on:{
						eventMatching:{
							text:'foo'
						}
					}
				};

				var expression = ContextExpression.createEventExpression(specification);
				expression.startWatch();

				expression.on('triggered', function(){
					done();
				});

				eventBus.emit('event', {text:'foo'});
			});

			it('should not raise events when stopWatch has been called', function(done){
				var shouldBeRaisingEvents = false;

				var specification = {
					on:{
						eventMatching:{
							text:'foo'
						}
					}
				};

				var expression = ContextExpression.createEventExpression(specification);

				expression.on('triggered', function(){
					if(!shouldBeRaisingEvents){
						assert.fail();
					}
				});

				eventBus.emit('event', {text:'foo'});

				expression.startWatch();			
				shouldBeRaisingEvents = true;

				eventBus.emit('event', {text:'foo'});

				expression.stopWatch();
				shouldBeRaisingEvents = false;

				eventBus.emit('event', {text:'foo'});


				done();			

			});

			describe('cron events', function(){

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

				setState('Monday', true);
				var expression = ContextExpression.createEventExpression(specification);
				expression.startWatch();

				expression.on('triggered',function(){
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

				setState('Monday', true);

				var expression = ContextExpression.createEventExpression(specification);
				expression.startWatch();

				expression.on('trigger', function(){
					assert.fail();
				});

				eventBus.emit('event', {text:'foo'});
			});
		});	
	});
	
});