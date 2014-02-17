module.exports = function(){
	var stateRoutes = {};
	
	stateRoutes.listActive = function(req,res){
		var contextEngine = req.user.contextEngine;
		var activeStates = contextEngine.states.getActiveStates();
		res.render('active-states', {title:'Active States', activeStates:activeStates});		
	}

	return stateRoutes;
}