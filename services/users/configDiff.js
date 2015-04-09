var _ = require('lodash');

module.exports = function (currentConfig, newConfig) {
	console.log('diffing old', currentConfig.states, 'against new', newConfig.states);
	var delta = {};

	var getStatesInFirstArrayButNotSecond = function (array1, array2) {
		var makePredicateForStatesWithSha = function (desiredSha) {
			return function (state) {
				return state.sha === desiredSha
			}
		};
		return array1.filter(function (state) {
			return !_.find(array2, makePredicateForStatesWithSha(state.sha))
		});
	};
	delta.removed = getStatesInFirstArrayButNotSecond(currentConfig.states, newConfig.states);
	delta.added = getStatesInFirstArrayButNotSecond(newConfig.states, currentConfig.states);

	return delta;
}
