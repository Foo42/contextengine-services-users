var logger = require('../core/logger');
var _ = require('lodash');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var path = require('path');

if(!process.env.USER_DATA_PATH){
  console.error('USER_DATA_PATH unspecified');
  process.exit(1);
}

var file = path.join(process.env.USER_DATA_PATH, '../users.json');
console.log('users file:',path.resolve(file));

var users;

var loadUsersFromFile = function loadUsersFromFile() {
	if (users) {
		return Promise.resolve(users);
	}

	return fs.readFileAsync(file, 'utf8').then(function (data) {
		users = JSON.parse(data);
		logger.info(users.length + ' users loaded from file');
		return users;
	});
};

var userHasEmailAddressOf = function (user, address) {
	return user.emails.filter(function (email) {
		return email.value.toLowerCase() == address.toLowerCase()
	}).length > 0;
}

module.exports = {
	findUser: function (user, done) {
		loadUsersFromFile().then(function (users) {
			var foundUser = _.any(users, function (registeredUser) {
				return userHasEmailAddressOf(user, registeredUser.emailAddress);
			});

			if (!foundUser) {
				done("ERROR: user not found");
			} else {
				done(null, user);
			}
		}).catch(function (err) {
			logger.error('Promblem loading users from file', err);
		});
	},

	getAllRegisteredUsers: loadUsersFromFile
}
