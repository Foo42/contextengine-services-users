module.exports = function(){
	var stateRoutes = {};
	
	stateRoutes.listActive = function(req,res){
		req.user.getContextEngine().then(function(contextEngine){
			var activeStates = contextEngine.states.getActiveStates();
			res.render('active-states', {title:'Active States', activeStates:activeStates});			
		}).catch(res.send.bind(res,500));
	}

	return stateRoutes;
}