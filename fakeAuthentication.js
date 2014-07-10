var initialise = function(getContextEngineForUser){
	return 	{
		insertMiddleware: function(app){
		},

		setupRoutes: function(app){
		},

		ensureAuthenticated: function(req, res, next){
			req.user = req.user || {id:'someone'};

			
			getContextEngineForUser(req.user).then(function(engine){
				req.user.getContextEngine = getContextEngineForUser.bind(getContextEngineForUser,req.user);
				next();
			}).catch(function(error){
				console.log('error getting context engine for user');
				next(error);
			});
			
		},
		ensureAdministrator: function(req, res, next){next()}
	};

};

module.exports.initialise = initialise;
