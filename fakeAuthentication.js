var initialise = function(getContextEngineForUser){
	return 	{
		insertMiddleware: function(app){
		},

		setupRoutes: function(app){
		},

		ensureAuthenticated: function(req, res, next){
			req.user = req.user || {};
			
			getContextEngineForUser({id:'someone'}, function(err, engine){
				if(err){
					console.log('error getting context engine for user');
					return;
				}
				req.user.contextEngine = engine;
				next();
			});

			
		},
		ensureAdministrator: function(req, res, next){next()}
	};

};

module.exports.initialise = initialise;
