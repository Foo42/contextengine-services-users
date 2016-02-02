var path = require('path');
module.exports = function (userId) {
	var baseUserDataPath = (process.env.USER_DATA_PATH || path.join(path.dirname(require.main.filename), 'data', 'userSpecific'));
	var userDataPath = path.join(baseUserDataPath, userId);
	return userDataPath;
}
