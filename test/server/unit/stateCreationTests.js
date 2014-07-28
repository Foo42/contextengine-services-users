var assert = require("assert");
var binaryState = require('../../../core/State').binaryState;
var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');

describe('State creation', function () {
	var fakeStateExpression;

	var mockExpressionFactory = {
		createStateExpression: function (config) {
			return fakeStateExpression;
		}
	};

	describe('Basic properties', function () {
		it('should have a name taken from specification if present', function (done) {
			var mockExpressionFactory = {};
			binaryState.createRule({
				name: 'bob'
			}, mockExpressionFactory, function (err, state) {
				assert.equal(state.name, 'bob');
				done();
			});
		});
		it('should have a sha taken from specification if present', function (done) {
			var mockExpressionFactory = {};
			binaryState.createRule({
				sha: '12345ABCDEF'
			}, mockExpressionFactory, function (err, state) {
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
				createEventExpression: function (spec) {
					return fakeEventExpression;
				}
			};

			binaryState.createRule(specification, mockExpressionFactory, function (err, state) {
				if (err) {
					assert.fail();
				}
				assert.ok(state);
				assert.equal(state.active, false);

				state.on('activated', function () {
					assert.equal(state.active, true);
					done();
				});

				fakeEventExpression.emit('triggered');
			});
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
				createEventExpression: function (spec) {
					console.log(spec);
					if (spec.on.someEntryConfig) {
						return entryCondition;
					}
					if (spec.on.someExitConfig) {
						return exitCondition;
					}
					assert.fail();
				}
			};

			binaryState.createRule(specification, mockExpressionFactory, function (err, state) {
				if (err || !state) {
					assert.fail();
				}

				assert.ok(entryCondition.startCalled);

				state.on('activated', function () {
					assert.ok(entryCondition.stopCalled);
					assert.ok(exitCondition.startCalled);
					done();
				});

				entryCondition.forceTrigger();
			});

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
						createEventExpression: function (spec) {
							var fakeExpression = createFakeEventExpression();
							fakeExpression.spec = spec;
							eventExpressions.push(fakeExpression);
							return fakeExpression;
						}
					};

					binaryState.createRule(specification, mockExpressionFactory, function (err, state) {
						state.dispose();
						var expressionIsWatching = function expressionIsWatching(expression) {
							return expression.watching;
						}
						var someExpressionsStillWatching = _.any(eventExpressions, expressionIsWatching);
						eventExpressions.filter(expressionIsWatching).forEach(function (expression) {
							console.log(JSON.stringify(expression.spec) + ' still watching')
						});
						assert.equal(someExpressionsStillWatching, false);
						done();
					});
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

			binaryState.createRule(specification, mockExpressionFactory, function (err, state) {
				if (err) {
					assert.fail();
				}
				console.log(state);
				assert.ok(state);
				assert.equal(state.active, expressionValue);
				done();
			});
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

			binaryState.createRule(specification, mockExpressionFactory, function (err, state) {
				if (err) {
					assert.fail();
				}
				console.log(state);
				assert.ok(state);
				assert.equal(state.active, true);

				state.on('deactivated', function () {
					assert.equal(state.active, false);
					done();
				});

				assert.ok(fakeStateExpression.isWatching);
				expressionValue = false;
				fakeStateExpression.emit('valueChanged', expressionValue);


			});
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

			binaryState.createRule(specification, mockExpressionFactory, function (err, state) {
				if (err) {
					assert.fail();
				}
				state.dispose();
			});
		});
	});
});
