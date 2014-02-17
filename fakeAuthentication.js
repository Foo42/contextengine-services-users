
var initialise = function(hostName){



	return 	{
		insertMiddleware: function(app){
		},

		setupRoutes: function(app){
		},

		ensureAuthenticated: function(req, res, next){next()},
		ensureAdministrator: function(req, res, next){next()}
	};

};

module.exports.initialise = initialise;
