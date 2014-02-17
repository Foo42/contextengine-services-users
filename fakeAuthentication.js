
var initialise = function(getContextEngineForUser){

	return 	{
		insertMiddleware: function(app){
		},

		setupRoutes: function(app){
		},

		ensureAuthenticated: function(req, res, next){
			req.user = req.user || {};
			
			getContextEngineForUser('someone', function(err, engine){
				req.user.contextEngine = engine;
			});

			next();
		},
		ensureAdministrator: function(req, res, next){next()}
	};

};

module.exports.initialise = initialise;
