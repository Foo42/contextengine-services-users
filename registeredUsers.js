var _ = require('lodash');

var fs = require('fs');
var file = __dirname + '/data/users.json';
var users;

var loadUsersFromFile = function loadUsersFromFile(done){
	if(users){
		return done(null, users);
	}

	fs.readFile(file, 'utf8', function(err, data){		
		if(!err){
			console.log('loading users from json file');			
			users = JSON.parse(data);
			console.info(users.length + ' users loaded from file');
		}
		return done(err, users);
	});	
};



var userHasEmailAddressOf = function(user, address){
	return user.emails.filter(function(email){return email.value.toLowerCase() == address.toLowerCase()}).length > 0;
}

module.exports = {
	findUser: function(user, done){
		var foundUser = _.any(users, function(registeredUser){
			return userHasEmailAddressOf(user, registeredUser.emailAddress);
		});

		if(!foundUser){
			done("ERROR: user not found");
		}else{
			done(null, user);
		}
	},

	getAllRegisteredUsers: loadUsersFromFile
}