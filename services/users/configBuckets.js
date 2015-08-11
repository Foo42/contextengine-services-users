var path = require('path');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var getUserDataPath = require('./userDataPath');

module.exports.forUser = function (user) {
	var usersConfigRoot = path.join(getUserDataPath(user.id), 'config');

	return {
		get: function get(bucketName) {
			var sanitisedBucketName = bucketName.replace(/[^a-zA-Z0-9]+/g, '');
			var bucketFilePath = path.join(usersConfigRoot, bucketName) + '.json';
			console.log('getting', bucketFilePath, 'for', user);
			return fs.readFileAsync(bucketFilePath, 'utf8').then(function (fileContents) {
				console.log('got', bucketName, 'for', user, ':', fileContents);
				return JSON.parse(fileContents);
			});
		},
		set: function set(bucketName, contents) {
			var sanitisedBucketName = bucketName.replace(/[^a-zA-Z0-9]+/g, '');
			var bucketFilePath = path.join(usersConfigRoot, bucketName) + '.json';
			return fs.writeFileAsync(bucketFilePath, JSON.stringify(contents), 'utf8');
		}
	}
}
