var logger = require('../../../core/logger');
var registeredStateAccessFunctions = {}

var temporaryImplementionBeforeWeHaveDiscreteServices = {
	registerStateAccessFunction: function (userId, f) {
		registeredStateAccessFunctions[userId] = f;
	},
	getStatesForUser: function (userId, callback) {
		f = registeredStateAccessFunctions[userId];
		if (f === undefined) {
			logger.error('Being asked for states for unknown user', userId);
			return callback(new Error('unknown user'));
		}
		return callback(null, f());
	}
}

module.exports = temporaryImplementionBeforeWeHaveDiscreteServices;
