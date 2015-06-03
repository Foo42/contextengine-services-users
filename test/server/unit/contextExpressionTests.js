var assert = require("assert");
var EventEmitter = require('events').EventEmitter;
var proxyquire = require('proxyquire');
var Promise = require('bluebird');
require('chai').should();

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
var fakeDistexClient;
var fakeContract;

//TODO: 
// * State expression stopWatch
// * State expression polling / state subs

describe('Context expressions', function () {
	beforeEach(function (done) {
		eventBus._events = {};
		states = {};
		stateQueryService.cleanUp();
		done();
		fakeDistexClient = {};

		fakeDistexClient.requestHandler = function (spec) {
			fakeContract = new EventEmitter();
			fakeContract.calls = []
			fakeContract.watch = function () {
				this.calls.push('watch');
			}
			fakeContract.stopWatching = function () {
				this.calls.push('stopWatching');
			}
			setImmediate(function () {
				fakeContract.emit('status.handled');
			});
			return fakeContract;
		}
		var substitutions = {
			'./connectDistexClient': Promise.resolve(fakeDistexClient)
		}
		ContextExpression = proxyquire('../../../core/ContextExpression', substitutions)(eventBus, stateQueryService);
		done();
	});

	describe('simple state expressions', function () {
		it('should raise true event when state defined in isActive clause becomes active', function (done) {
			var specification = {
				whilst: {
					isActive: 'Monday'
				}
			};

			setState('Monday', false);

			ContextExpression.createStateExpression(specification).then(function (expression) {
				expression.startWatch();

				expression.on('valueChanged', function (isActive) {
					assert.equal(isActive, true);
					done();
				});

				setState('Monday', true);
			}).catch(done);
		});

		it('should raise true event when state defined in isNotActive clause becomes not active', function (done) {
			var specification = {
				whilst: {
					isNotActive: 'Monday'
				}
			};

			setState('Monday', true);

			ContextExpression.createStateExpression(specification).then(function (expression) {
				expression.startWatch();

				expression.on('valueChanged', function (isActive) {
					assert.equal(isActive, true);
					done();
				});

				setState('Monday', false);
			}).catch(done);
		});

		it('should raise events if expression becomes true', function (done) {
			var specification = {
				whilst: {
					isActive: 'Monday'
				}
			};

			setState('Monday', false);

			ContextExpression.createStateExpression(specification).then(function (expression) {
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
			}).catch(done);
		});

		it('should not raise events when stop watch has been called', function (done) {
			var specification = {
				whilst: {
					isActive: 'Monday'
				}
			};

			setState('Monday', false);

			ContextExpression.createStateExpression(specification).then(function (expression) {
				expression.startWatch();
				expression.stopWatch();

				setTimeout(function () {
					setState('Monday', true);
					setTimeout(done, 100);
				}, 300);

				expression.on('valueChanged', function (isActive) {
					assert.fail();
				});
			}).catch(done);
		});

		it('should not raise events when watch stopped', function () {

		});
	});

	describe('event expressions', function () {
		describe('simple event expressions', function () {
			it('should raise event when distex contract for expression raises an event', function (done) {
				var specification = {
					on: {
						eventMatching: {
							text: 'foo'
						}
					}
				};

				ContextExpression.createEventExpression(specification).then(function (expression) {
					expression.startWatch();

					expression.on('triggered', function () {
						done();
					});
					fakeContract.emit('event.recieved', {});
				}).catch(done);
			});

			it('should call stopWatch on underlying distex contract when stopWatch has been called on expression', function (done) {
				var shouldBeRaisingEvents = false;

				var specification = {
					on: {
						eventMatching: {
							text: 'foo'
						}
					}
				};

				ContextExpression.createEventExpression(specification).then(function (expression) {
					expression.stopWatch();
					fakeContract.calls.pop().should.equal('stopWatching');
					done();

				}).catch(done);

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

				ContextExpression.createEventExpression(specification).then(function (expression) {
					expression.startWatch();
					expression.on('triggered', function () {
						done();
					});
					fakeContract.emit('event.recieved', {});
				}).catch(done);
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

				ContextExpression.createEventExpression(specification).then(function (expression) {
					expression.startWatch();

					expression.on('triggered', function () {
						assert.fail();
					});

					fakeContract.emit('event.recieved', {});
				}).catch(done);
			});

			it('should not raise events when stop watch has been called', function (done) {
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

				setState('Monday', false);

				ContextExpression.createEventExpression(specification).then(function (expression) {
					expression.startWatch();
					expression.stopWatch();

					expression.on('triggered', function () {
						assert.fail();
					});

					fakeContract.emit('event.recieved', {});
				}).catch(done);
			});
		});
	});

});
