var initialise = function(getContextEngineForUser){
	return 	{
		insertMiddleware: function(app){
		},

		setupRoutes: function(app){
		},

		ensureAuthenticated: function(req, res, next){
			req.user = req.user || {id:'someone'};
			
			getContextEngineForUser(req.user, function(err, engine){
				if(err){
					console.log('error getting context engine for user');
					return;
				}

				req.user.getContextEngine = getContextEngineForUser.bind(getContextEngineForUser,req.user);
				next();
			});

			
		},
		ensureAdministrator: function(req, res, next){next()}
	};

};

module.exports.initialise = initialise;
