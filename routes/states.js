module.exports = function(){
	var stateRoutes = {};
	
	stateRoutes.listActive = function(req,res){
		req.user.getContextEngine(function(err, contextEngine){
			if(err){
				return res.send(500);
			}
			
			var activeStates = contextEngine.states.getActiveStates();
			res.render('active-states', {title:'Active States', activeStates:activeStates});			
		});
	}

	return stateRoutes;
}