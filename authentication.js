
var initialise = function(){
	 var passport = require('passport');
	 var registeredUsers = require('./registeredUsers');
	 var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
	 var hostName = process.env['HOST_NAME'];
	 var clientSecret = process.env['GOOGLE_CLIENT_SECRET'];
	 var clientID = process.env['GOOGLE_CLIENT_ID'];

	passport.serializeUser(function(user, done) {
	  done(null, user);
	});

	passport.deserializeUser(function(obj, done) {
	  done(null, obj);
	});

	passport.use(new GoogleStrategy({
	    clientID: clientID,
	    clientSecret: clientSecret,
	    callbackURL: "http://"+hostName+"/auth/google/callback"
	  },
	  function(accessToken, refreshToken, profile, done) {
	    return done(null, profile);	    
	  }
	));

	var ensureAuthenticated = function(req, res, next) {
			console.log("ensureAuthenticated: " + req.isAuthenticated)
			if (req.isAuthenticated()) 
				{ return next(); }
		  	res.redirect('/login');
		};

	var userHasEmailAddressOf = function(user, address){
		return user.emails.filter(function(email){return email.value.toLowerCase() == address.toLowerCase()}).length > 0;
	}

	var ensureRegisteredUser = function(req, res, next){
		if (req.isAuthenticated()){ 
			console.log("request authenticated");
			console.log("user object:" + JSON.stringify(req.user));

			if(registeredUsers.isRegisteredUser(req.user)){
				return next();	
			}
		}
	  	res.redirect('/login');
	};

	return 	{
		insertMiddleware: function(app){
			app.use(passport.initialize());
  			app.use(passport.session());
		},

		setupRoutes: function(app){
			

			app.get('/account', ensureAuthenticated, function(req, res){
			  res.render('account',{user:req.user});
			});

			app.get('/login', function(req, res){
			  res.render('login', { user: req.user });
			});

			app.get('/auth/google',
			  passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/userinfo.profile',
			                                            'https://www.googleapis.com/auth/userinfo.email'] }),
			  function(req, res){
			    // The request will be redirected to Google for authentication, so this
			    // function will not be called.
			});

			// GET /auth/google/callback
			//   Use passport.authenticate() as route middleware to authenticate the
			//   request.  If authentication fails, the user will be redirected back to the
			//   login page.  Otherwise, the primary route function function will be called,
			//   which, in this example, will redirect the user to the home page.
			app.get('/auth/google/callback', 
			  passport.authenticate('google', { failureRedirect: '/login' }),
			  function(req, res) {
			    res.redirect('/');
			  });

			app.get('/logout', function(req, res){
			  req.logout();
			  res.redirect('/');
			});
		},

		ensureAuthenticated: ensureAuthenticated,
		ensureRegisteredUser: ensureRegisteredUser
	};

};

module.exports.initialise = initialise;
