var util = require('util');
var EventEmitter = require('events').EventEmitter;
var Promise = require('bluebird');
var _ = require('lodash');
var async = require('async');
var binaryState = require('./binaryState');
var finiteStateDirectQueryService = require('./finiteStateDirectQueryService');
var logger = require('../../../core/logger');

var addStatesFromConfig = function (contextEventBusReader, listener, config, callback) {
	var stateQueryService = require('./stateQueryService')(listener);
	var expressionFactory = require('../../../core/ContextExpression')(contextEventBusReader, stateQueryService);
	
	Promise.map(config, function(stateConfig){
		return binaryState.createRule(stateConfig, expressionFactory);
	}).then(function(states){
		states.forEach(function(state){
			listener.add(state);
		});
		
		logger.log('added ' + states.length + ' states');
		callback(null, states.length);
	}).catch(function(err){
		logger.error('Error creating states',err);
		callback(err);
	});
}

module.exports = (function () {
	var module = {};

	module.subscribeToContextEvents = function (user, contextEventBusReader, contextEventBusWriter, userConfig, done) {
		logger.info('attatching state inference engine');

		var configAccessForUser = require('../../users/client').configAccessForUser(user);
		var activeConfig;
		async.waterfall(
			[
				function (done) {
					var taskScheduler = {
						setTimeout: setTimeout,
						clearTimeout: clearTimeout,
						createCronJob: function (spec, cb) {
							return new cron.CronJob(spec, cb);
						}
					};

					var listener = new module.StateInferenceEngine();

					configAccessForUser.watchStateConfig(function (change) {
						var delta = change.delta;

						logger.log('state config changed for user ' + user.id + ' ' + delta.added.length + ' states added ' + delta.removed.length + ' states removed');
						var stateHasSha = function (sha) {
							return function (state) {
								return state.sha === sha
							}
						};
						var isRemovedState = function (state) {
							return _.find(delta.removed, stateHasSha(state.sha));
						};

						listener.removeStatesWhere(isRemovedState, function (err) {
							if (err) {
								logger.error('error removing states', err);
								return
							};
							addStatesFromConfig(contextEventBusReader, listener, delta.added, function () {});
						});

					}).catch(function (err) {
						logger.error('error connecting finiteStateEngine for state changes for user', user.id, err);
					});

					configAccessForUser.getStateConfig().then(function (stateConfig) {
						activeConfig = stateConfig;
						addStatesFromConfig(contextEventBusReader, listener, stateConfig.states, function () {
							listener.on('stateChange.activated', function (event) {
								contextEventBusWriter.registerNewEvent(event, function () {})
							});
							listener.on('stateChange.deactivated', function (event) {
								contextEventBusWriter.registerNewEvent(event, function () {})
							});

							finiteStateDirectQueryService.registerStateAccessFunction(user.id, listener.getAllStates.bind(listener));

							done();
						});
					});
				}
			],
			done
		);
	}

	module.StateInferenceEngine = function (statesToAdd) {
		var self = this;
		var states = [];
		statesToAdd = statesToAdd || [];

		self.add = function (state) {
			states.push(state);

			state.on('activated', function () {
				var stateActivedEvent = {
					type: 'stateChange.activated',
					stateName: state.name
				};
				self.emit('stateChange.activated', stateActivedEvent);
			});

			state.on('deactivated', function () {
				var stateActivedEvent = {
					type: 'stateChange.deactivated',
					stateName: state.name
				};
				self.emit('stateChange.deactivated', stateActivedEvent);
			});
		};

		self.removeStatesWhere = function removeStatesWhere(predicate, callback) {
			var removed = _.remove(states, predicate);
			removed.forEach(function (state) {
				state.dispose()
			});
			callback(null, removed);
		}

		self.processEvent = function (event) {
			states.forEach(function (state) {
				state.processEvent(event)
			});
		};

		self.getActiveStates = function () {
			return states.filter(function (state) {
				return state.active
			}).map(function (state) {
				return state.name
			});
		};

		self.getAllStates = function () {
			return states.map(function (state) {
				return {
					name: state.name,
					isActive: state.active
				};
			});
		}

		self.forEachState = function forEachState(iterator, callback) {
			states.forEach(function (state) {
				iterator(state);
			});
			callback && callback(null);
		};

		self.isStateActive = function isStateActive(stateName, callback) {
			var state = _.find(states, function (state) {
				return state.name === stateName
			});
			var isActive = state && state.active;
			return callback(null, isActive);
		};

		statesToAdd.forEach(function (state) {
			self.add(state);
		});
	};

	util.inherits(module.StateInferenceEngine, EventEmitter);

	return module;
})();
