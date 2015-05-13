var EventEmitter = require('events').EventEmitter;
var Promise = require('bluebird');
var objectMatches = require('../objectMatches');
var logger = require('../logger');
var distex = require('distex');

var distexClientConnecting = require('rabbit-pie').connect().then(function(connection){
	logger.info('distex client connected');
	return distex.client.create(connection);
});

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

	function createEventWatch(specification) {
		logger.log('creating event expression with spec ' + JSON.stringify(specification));
		var expression = new EventEmitter();
		var isWatching = false;

		var triggerEvent = function triggerEvent() {
			expression.emit('triggered');
		}

		var setupStages = [];

		if (specification.eventMatching) {
			var processEventMatching = function processEventMatching(e) {
				if (!isWatching) {
					return;
				}
				if (objectMatches(e, specification.eventMatching)) {
					logger.log('triggering ', specification);
					triggerEvent();
				}
			};

			expression.on('processing event', processEventMatching);
		}

		if (specification.cron) {
			var settingUpCron = distexClientConnecting.then(function(client){
				return new Promise(function(resolve, reject){
					var clientContract = client.requestHandler({cron:specification.cron});
					clientContract.on('status.handled', function () {
						clientContract.on('event.recieved',triggerEvent);
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

		return Promise.all(setupStages).then(function(){
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
			stopWatch: function(){
				eventWatcher.stopWatch();
			},
			on: eventPropegator.on.bind(eventPropegator),
		});
	}

	function createEventExpression(specification){
		var eventSpec = specification.on || specification;
		creatingEventWatcher = createEventWatch(eventSpec);

		if (!specification.whilst) {
			return creatingEventWatcher;
		}

		var stateCondition = createStateExpressionSync(specification.whilst);
		return creatingEventWatcher.then(function(eventWatcher){
			return createStateConditionalEventWatcher(eventWatcher, stateCondition);
		});
	}

	return {
		createEventExpression: createEventExpression,
		createStateExpression: function(specification){
			return Promise.resolve(createStateExpressionSync(specification))
		}
	}
}
