module.exports = function(contextEngine){
	var stateRoutes = {};
	
	stateRoutes.listActive = function(req,res){
		var activeStates = contextEngine.states.getActiveStates();
		res.render('active-states', {title:'Active States', activeStates:activeStates});		
	}

	return stateRoutes;
}