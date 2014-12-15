var finiteStateDirectQueryService = require('../../finiteStateMachines/lib').finiteStateDirectQueryService;

module.exports = function () {
	var stateRoutes = {};

	stateRoutes.listActive = function (req, res) {
		finiteStateDirectQueryService.getStatesForUser(req.user.id, function (err, states) {
			if (err) {
				return res.send(500);
			}
			var activeStates = states.filter(function (state) {
				return state.isActive
			});
			res.render('active-states', {
				title: 'Active States',
				activeStates: activeStates
			});
		});
	}

	return stateRoutes;
}
