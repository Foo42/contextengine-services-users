var initialise = function () {
	return {
		insertMiddleware: function (app) {},

		setupRoutes: function (app) {},

		ensureAuthenticated: function (req, res, next) {
			req.user = req.user || {
				id: 'someone',
				emails: [{
					value: 'someone@example.com'
				}]
			};

			next();
		},
		ensureAdministrator: function (req, res, next) {
			next()
		}
	};

};

module.exports.initialise = initialise;
