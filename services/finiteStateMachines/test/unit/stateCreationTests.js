var assert = require('assert');
var Promise = require('bluebird');
var binaryState = require('../../lib').binaryState;
var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');

describe('State creation', function () {
	var fakeStateExpression;

	var mockExpressionFactory = {
		createStateExpression_: function (config) {
			return Promise.resolve(fakeStateExpression);
		}
	};

	describe('Basic properties', function () {
		it('should have a name taken from specification if present', function (done) {
			var mockExpressionFactory = {};
			binaryState.createRule({
				name: 'bob'
			}, mockExpressionFactory).then(function (state) {
				assert.equal(state.name, 'bob');
				done();
			});
		});
		it('should have a sha taken from specification if present', function (done) {
			var mockExpressionFactory = {};
			binaryState.createRule({
				sha: '12345ABCDEF'
			}, mockExpressionFactory).then(function (state) {
				assert.equal(state.sha, '12345ABCDEF');
				done();
			});
		});
	});
	describe('States with entry and exit conditions', function () {
		it('should activate when enter event condition fires', function (done) {
			var specification = {
				enter: {
					on: {
						some: 'event config'
					}
				}
			};

			var fakeEventExpression = new EventEmitter();
			fakeEventExpression.startWatch = function () {};
			fakeEventExpression.stopWatch = function () {};
			var mockExpressionFactory = {
				createEventExpression_: function (spec) {
					return Promise.resolve(fakeEventExpression);
				}
			};

			binaryState.createRule(specification, mockExpressionFactory).then(function(state) {
				assert.ok(state);
				assert.equal(state.active, false);

				state.on('activated', function () {
					assert.equal(state.active, true);
					done();
				});

				fakeEventExpression.emit('triggered');
			}).catch(done);
		});

		it('should stop watching entry condition when active, and start watching exit', function (done) {
			var specification = {
				enter: {
					on: {
						someEntryConfig: ' '
					}
				},
				exit: {
					on: {
						someExitConfig: ' '
					}
				}
			};

			var createFakeEventExpression = function () {
				var fakeEventExpression = new EventEmitter();
				fakeEventExpression.startWatch = function () {
					fakeEventExpression.startCalled = true;
				};
				fakeEventExpression.stopWatch = function () {
					fakeEventExpression.stopCalled = true;
				};
				fakeEventExpression.forceTrigger = function () {
					fakeEventExpression.emit('triggered');
				};
				return fakeEventExpression;
			}

			var entryCondition = createFakeEventExpression();
			var exitCondition = createFakeEventExpression();
			var mockExpressionFactory = {
				createEventExpression_: function (spec) {
					if (spec.on.someEntryConfig) {
						return Promise.resolve(entryCondition);
					}
					if (spec.on.someExitConfig) {
						return Promise.resolve(exitCondition);
					}
					assert.fail();
				}
			};

			binaryState.createRule(specification, mockExpressionFactory).then(function (state) {
				assert.ok(entryCondition.startCalled);

				state.on('activated', function () {
					assert.ok(entryCondition.stopCalled);
					assert.ok(exitCondition.startCalled);
					done();
				});

				entryCondition.forceTrigger();
			}).catch(done);

			describe("disposing states with entry and exit conditions", function () {
				it('should ensure any event expressions have their watches stopped', function (done) {
					var specification = {
						enter: {
							on: {
								entryStuff: 'this doesnt matter'
							}
						},
						exit: {
							on: {
								exitStuff: 'stuff which doesnt matter for this test'
							}
						}
					};

					var createFakeEventExpression = function () {
						var fakeEventExpression = new EventEmitter();
						fakeEventExpression.watching = false;
						fakeEventExpression.startWatch = function () {
							fakeEventExpression.watching = true
						};
						fakeEventExpression.stopWatch = function () {
							fakeEventExpression.watching = false
						};
						return fakeEventExpression;
					}

					var eventExpressions = [];
					var mockExpressionFactory = {
						createEventExpression_: function (spec) {
							var fakeExpression = createFakeEventExpression();
							fakeExpression.spec = spec;
							eventExpressions.push(fakeExpression);
							return Promise.resolve(fakeExpression);
						}
					};

					binaryState.createRule(specification, mockExpressionFactory).then(function (state) {
						state.dispose();
						var expressionIsWatching = function expressionIsWatching(expression) {
							return expression.watching;
						}
						var someExpressionsStillWatching = _.any(eventExpressions, expressionIsWatching);

						assert.equal(someExpressionsStillWatching, false);
						done();
					}).catch(done);
				});
			});
		});
	});

	describe('States with a an active condition', function () {
		var expressionValue = true;

		it('should get its initial state from a stateExpression', function (done) {
			var expressionValue = true;

			fakeStateExpression = {
				evaluate: function (callback) {
					return callback(null, expressionValue);
				},
				startWatch: function () {

				},
				on: function () {}
			};

			var specification = {
				isActive: {
					whilst: {
						isActive: 'Monday'
					}
				}
			};

			binaryState.createRule(specification, mockExpressionFactory).then(function (state) {
				assert.ok(state);
				assert.equal(state.active, expressionValue);
				done();
			}).catch(done);
		});

		it('should update its active state when the stateExpression changes its value', function (done) {
			var expressionValue = true;

			fakeStateExpression = new EventEmitter();

			fakeStateExpression.evaluate = function (callback) {
				return callback(null, expressionValue);
			};
			fakeStateExpression.startWatch = function () {
				fakeStateExpression.isWatching = true;
				fakeStateExpression.emit('watching');
			};

			var specification = {
				isActive: {
					whilst: {
						isActive: 'Monday'
					}
				}
			};

			binaryState.createRule(specification, mockExpressionFactory).then(function (state) {
				assert.ok(state);
				assert.equal(state.active, true);

				state.on('deactivated', function () {
					assert.equal(state.active, false);
					done();
				});

				assert.ok(fakeStateExpression.isWatching);
				expressionValue = false;
				fakeStateExpression.emit('valueChanged', expressionValue);

			}).catch(done);
		});
	});

	describe("Disposing a state rule", function () {
		it('should stop watching isActive whilst expressions', function (done) {
			fakeStateExpression = new EventEmitter();

			fakeStateExpression.evaluate = function (callback) {
				return callback(null, true);
			};
			fakeStateExpression.startWatch = function () {
				fakeStateExpression.isWatching = true;
			};
			fakeStateExpression.stopWatch = function () {
				done();
			};

			var specification = {
				isActive: {
					whilst: {
						isActive: 'whatever'
					}
				}
			};

			binaryState.createRule(specification, mockExpressionFactory).then(function (state) {
				state.dispose();
			}).catch(done);
		});
	});
});
