var assert = require("assert");
var EventEmitter = require('events').EventEmitter;
var proxyquire = require('proxyquire');

var eventBus = new EventEmitter();



var stateQueryService = (function () {
	var states = {};
	var stateWatches = new EventEmitter();

	return {
		isStateActive: function (stateName, callback) {
			return callback(null, states[stateName]);
		},
		setState: function (name, isActive) {
			states[name] = isActive;
			stateWatches.emit(name, isActive);
		},
		cleanUp: function () {
			stateWatches._events = {};
		},
		createQuery: function (stateName) {
			var query = new EventEmitter();
			query.currentValue = function (callback) {
				return callback(null, states[stateName]);
			};
			query.startWatch = function () {
				query.watching = true;
				stateWatches.on(stateName, function (newValue) {
					if (query.watching) {
						query.emit('valueChanged', newValue);
					}
				});
				query.emit('watching');
			}
			query.stopWatch = function () {
				query.watching = false;
			}
			return query;
		}
	};
})();

var setState = stateQueryService.setState;
delete stateQueryService.setState;


var ContextExpression;

//TODO: 
// * State expression stopWatch
// * State expression polling / state subs


describe('Context expressions', function () {
	beforeEach(function (done) {
		eventBus._events = {};
		states = {};
		stateQueryService.cleanUp();
		done();
		ContextExpression = require('../../../core/ContextExpression')(eventBus, stateQueryService);
	});



	describe('simple state expressions', function () {
		it('should raise true event when state defined in isActive clause becomes active', function (done) {
			var specification = {
				whilst: {
					isActive: 'Monday'
				}
			};

			setState('Monday', false);

			var expression = ContextExpression.createStateExpression(specification);
			expression.startWatch();

			expression.on('valueChanged', function (isActive) {
				assert.equal(isActive, true);
				done();
			});

			setState('Monday', true);
		});

		it('should raise true event when state defined in isNotActive clause becomes not active', function (done) {
			var specification = {
				whilst: {
					isNotActive: 'Monday'
				}
			};

			setState('Monday', true);

			var expression = ContextExpression.createStateExpression(specification);
			expression.startWatch();

			expression.on('valueChanged', function (isActive) {
				assert.equal(isActive, true);
				done();
			});

			setState('Monday', false);
		});

		it('should raise events if expression becomes true', function (done) {
			var specification = {
				whilst: {
					isActive: 'Monday'
				}
			};

			setState('Monday', false);

			var expression = ContextExpression.createStateExpression(specification);
			expression.startWatch();

			setTimeout(function () {
				setState('Monday', true);
			}, 300);


			expression.on('valueChanged', function (isActive) {
				//We dont mind if this triggers with false first, only that it becomes true
				if (isActive) {
					done();
				}
			});
		});

		it('should not raise events when stop watch has been called', function (done) {
			var specification = {
				whilst: {
					isActive: 'Monday'
				}
			};

			setState('Monday', false);

			var expression = ContextExpression.createStateExpression(specification);
			expression.startWatch();
			expression.stopWatch();

			setTimeout(function () {
				setState('Monday', true);
				setTimeout(done, 100);
			}, 300);


			expression.on('valueChanged', function (isActive) {
				assert.fail();
			});
		});

		it('should not raise events when watch stopped', function () {

		});
	});

	describe('event expressions', function () {
		describe('simple event expressions', function () {
			it('should raise event when eventMatching condition described in expression fires', function (done) {
				var specification = {
					on: {
						eventMatching: {
							text: 'foo'
						}
					}
				};

				var expression = ContextExpression.createEventExpression(specification);
				expression.startWatch();

				expression.on('triggered', function () {
					done();
				});

				eventBus.emit('context event', {
					text: 'foo'
				});
			});

			it('should not raise events when stopWatch has been called', function (done) {
				var shouldBeRaisingEvents = false;

				var specification = {
					on: {
						eventMatching: {
							text: 'foo'
						}
					}
				};

				var expression = ContextExpression.createEventExpression(specification);

				expression.on('triggered', function () {
					if (!shouldBeRaisingEvents) {
						assert.fail();
					}
				});

				eventBus.emit('context event', {
					text: 'foo'
				});

				expression.startWatch();
				shouldBeRaisingEvents = true;

				eventBus.emit('context event', {
					text: 'foo'
				});

				expression.stopWatch();
				shouldBeRaisingEvents = false;

				eventBus.emit('context event', {
					text: 'foo'
				});


				done();

			});

			describe('cron events', function () {
				it('should create a cron job when expression spec has cron property', function (done) {
					var specification = {
						on: {
							cron: '00 26 12 * * *'
						}
					};

					var fakeCronJob;
					var fakes = {
						'cron': {
							CronJob: function (spec, cb) {
								assert.equal(spec, '00 26 12 * * *');
								fakeCronJob = {
									fire: cb,
									started: false,
									start: function () {
										fakeCronJob.started = true;
									},
									stop: function () {
										fakeCronJob.started = false;
									}
								};
								return fakeCronJob;
							}
						}
					};

					ContextExpression = proxyquire('../../../core/ContextExpression', fakes)(eventBus, stateQueryService);

					var expression = ContextExpression.createEventExpression(specification);

					expression.startWatch();
					assert.ok(fakeCronJob.started);

					expression.on('triggered', function () {
						expression.stopWatch();
						assert.equal(fakeCronJob.started, false);
						done();
					});

					fakeCronJob.fire();
				});
			});
		});

		describe('qualified event expressions', function () {
			it('should raise event when event described in expression fires and state clause is met', function (done) {
				var specification = {
					on: {
						eventMatching: {
							text: 'foo'
						}
					},
					whilst: {
						isActive: 'Monday'
					}
				};

				setState('Monday', true);
				var expression = ContextExpression.createEventExpression(specification);
				expression.startWatch();

				expression.on('triggered', function () {
					done();
				});

				eventBus.emit('context event', {
					text: 'foo'
				});
			});

			it('should not raise event when event described in expression fires and state clause is not met', function (done) {
				this.timeout(500);
				setTimeout(done, 300); //if fail callback not called, the test passes

				var specification = {
					on: {
						eventMatching: {
							text: 'foo'
						}
					},
					whilst: {
						isNotActive: 'Monday'
					}
				};

				setState('Monday', true);

				var expression = ContextExpression.createEventExpression(specification);
				expression.startWatch();

				expression.on('trigger', function () {
					assert.fail();
				});

				eventBus.emit('context event', {
					text: 'foo'
				});
			});
		});
	});

});
