var EventEmitter = require('events').EventEmitter;
var Promise = require('bluebird');
var objectMatches = require('../objectMatches');
var logger = require('../logger');

var distexClientConnecting = require('./connectDistexClient');

module.exports = function (contextEventBusReader, stateQueryService) {
	var createStateExpressionSync = function createStateExpressionSync(specification) {
		specification = specification.whilst || specification;
		var stateName = specification.isActive || specification.isNotActive;

		var isDesiredState = function (stateActiveState) {
			if (specification.isNotActive) {
				return !stateActiveState;
			}
			return stateActiveState;
		}

		var query = stateQueryService.createQuery(stateName);

		return {
			startWatch: function () {
				logger.log('startWatch with spec', specification);
				query.startWatch()
			},
			stopWatch: function () {
				logger.log('stopWatch with spec', specification);
				query.stopWatch()
			},
			on: function (event, callback) {
				query.on(event, function (newValue) {
					callback(isDesiredState(newValue));
				});
			},
			evaluate: function (callback) {
				query.currentValue(function (err, currentValue) {
					callback(err, isDesiredState(currentValue));
				});
			}
		};
	};

	function createEventWatch(specification, userId) {
		logger.log('creating event expression with spec ' + JSON.stringify(specification));
		var expression = new EventEmitter();
		var isWatching = false;

		var triggerEvent = function triggerEvent() {
			if (isWatching) {
				expression.emit('triggered');
			}
		}

		var setupStages = [];

		if (specification.eventMatching) {
			var settingUpEventsMatching = distexClientConnecting.then(function (client) {
				return new Promise(function (resolve, reject) {
					var clientContract = client.requestHandler(specification, userId);
					clientContract.on('status.handled', function () {
						clientContract.on('event.recieved', triggerEvent);
						clientContract.watch();

						expression.on('starting watch', clientContract.watch.bind(clientContract));
						expression.on('stopping watch', clientContract.stopWatching.bind(clientContract));
						resolve();
					});
				});
			});

			setupStages.push(settingUpEventsMatching);
		}

		if (specification.cron) {
			var settingUpCron = distexClientConnecting.then(function (client) {
				return new Promise(function (resolve, reject) {
					var clientContract = client.requestHandler(specification);
					clientContract.on('status.handled', function () {
						clientContract.on('event.recieved', triggerEvent);
						clientContract.watch();

						expression.on('starting watch', clientContract.watch.bind(clientContract));
						expression.on('stopping watch', clientContract.stopWatching.bind(clientContract));
						resolve();
					});
				});
			});

			setupStages.push(settingUpCron);
		}

		var handleEvent = function (e) {
			expression.emit('processing event', e);
		};

		return Promise.all(setupStages).then(function () {
			return Promise.resolve({
				startWatch: function () {
					isWatching = true;
					expression.emit('starting watch');
					contextEventBusReader.on('context event', handleEvent);
				},
				stopWatch: function () {
					isWatching = false;
					expression.emit('stopping watch');
					contextEventBusReader.removeListener('event', handleEvent);
				},
				on: expression.on.bind(expression)
			});
		});
	};

	function createStateConditionalEventWatcher(eventWatcher, stateCondition) {
		var eventPropegator = new EventEmitter();

		eventWatcher.on('triggered', function (e) {
			stateCondition.evaluate(function (err, result) {
				if (result) {
					return eventPropegator.emit('triggered', e);
				}
			})
		});

		return Promise.resolve({
			startWatch: function () {
				eventWatcher.startWatch();
			},
			stopWatch: function () {
				eventWatcher.stopWatch();
			},
			on: eventPropegator.on.bind(eventPropegator),
		});
	}

	function createEventExpression(specification, userId) {
		var eventSpec = specification.on || specification;
		creatingEventWatcher = createEventWatch(eventSpec, userId);

		if (!specification.whilst) {
			return creatingEventWatcher;
		}

		var stateCondition = createStateExpressionSync(specification.whilst);
		return creatingEventWatcher.then(function (eventWatcher) {
			return createStateConditionalEventWatcher(eventWatcher, stateCondition);
		});
	}

	return {
		createEventExpression: createEventExpression,
		createStateExpression: function (specification) {
			return Promise.resolve(createStateExpressionSync(specification))
		}
	}
}
