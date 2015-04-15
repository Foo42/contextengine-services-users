var logger = require('../../core/logger');
var _ = require('lodash');
var Promise = require('promise');
var fs = require('fs');
var file = __dirname + '/../../data/users.json';
var users;

var loadUsersFromFile = function loadUsersFromFile(done) {
	if (users) {
		return done(null, users);
	}

	//Todo: promisify this to protect against json parse errors apart from anything else
	fs.readFile(file, 'utf8', function (err, data) {
		if (!err) {
			users = JSON.parse(data);
			logger.info(users.length + ' users loaded from file');
		} else {
			logger.error('Error loading users file');
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
