var _ = require('lodash');
var Promise = require('promise');
var fs = require('fs');
var file = __dirname + '/../../data/users.json';
console.log('users file is at', file);
var users;

var loadUsersFromFile = function loadUsersFromFile(done) {
	if (users) {
		return done(null, users);
	}

	fs.readFile(file, 'utf8', function (err, data) {
		if (!err) {
			console.log('loading users from json file');
			users = JSON.parse(data);
			console.info(users.length + ' users loaded from file');
		}
		return done(err, users);
	});
};
var loadUsersFromFile_ = Promise.denodeify(loadUsersFromFile);

var userHasEmailAddressOf = function (user, address) {
	return user.emails.filter(function (email) {
		return email.value.toLowerCase() == address.toLowerCase()
	}).length > 0;
}

module.exports = {
	findUser: function (user, done) {
		loadUsersFromFile_.then(function (users) {
			console.log('looking up user' + JSON.stringify(user));
			var foundUser = _.any(users, function (registeredUser) {
				return userHasEmailAddressOf(user, registeredUser.emailAddress);
			});

			if (!foundUser) {
				done("ERROR: user not found");
			} else {
				done(null, user);
			}
		});
	},

	getAllRegisteredUsers: loadUsersFromFile,
	getAllRegisteredUsers_: loadUsersFromFile_
}
