var finiteStateDirectQueryService = require('../../finiteStateMachines/lib').finiteStateDirectQueryService;

module.exports = function () {
	var stateRoutes = {};

	stateRoutes.listActive = function (req, res) {
		var stateClient = require('../../finiteStateMachines/lib/stateQueryService/client');
		stateClient.getStatesForUser(req.user.id).then(function(states){
			var activeStates = states.filter(function (state) {
				return state.isActive
			});
			return res.render('active-states', {
				title: 'Active States',
				activeStates: activeStates
			});
		}).catch(function(err){
			return res.status(500).end(err);
		});
	}

	return stateRoutes;
}
