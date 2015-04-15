var EventEmitter = require('events').EventEmitter;
var logger = require('../../../core/logger');

var createRule = function (config, expressionFactory, callback) {
	var state = new EventEmitter();
	state.active = false;

	state.name = config.name || 'anon';
	state.sha = config.sha;
	state.dispose = function () {
		state.emit('disposing');
	}

	var activate = function activate() {
		if (state.active) {
			return;
		}
		state.active = true;
		logger.info(state.name, 'activated');
		state.emit('activated');
	}

	var deactivate = function deactivate() {
		if (!state.active) {
			return;
		}
		state.active = false;
		logger.info(state.name, 'deactivated');
		state.emit('deactivated');
	}

	if (config.isActive) {
		var stateExpression = expressionFactory.createStateExpression(config.isActive);

		stateExpression.on('valueChanged', function (newValue) {
			newValue ? activate() : deactivate();
		});

		stateExpression.startWatch();

		stateExpression.evaluate(function (err, result) {
			if (err) {
				return callback(err);
			}

			result ? activate() : deactivate();
		});

		state.on('disposing', function () {
			stateExpression.stopWatch()
		});

	} else if (config.enter || config.exit) {
		if (config.enter) {

			var entryExpression = expressionFactory.createEventExpression(config.enter);

			state.on('activated', function () {
				entryExpression.stopWatch();
			});

			state.on('deactivated', function () {
				entryExpression.startWatch();
			});

			entryExpression.on('triggered', function () {
				activate();
			});

			state.on('disposing', function () {
				entryExpression.stopWatch()
			});
			entryExpression.startWatch();
		}

		if (config.exit) {
			var exitExpression = expressionFactory.createEventExpression(config.exit);
			state.on('deactivated', function () {
				exitExpression.stopWatch();
			});
			state.on('activated', function () {
				exitExpression.startWatch();
			});
			exitExpression.on('triggered', function () {
				deactivate();
			});
			state.on('disposing', function () {
				exitExpression.stopWatch()
			});
		}
	}
	callback(null, state);
};

module.exports = {
	createRule: createRule
};
