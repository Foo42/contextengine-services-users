var fs = require('fs');
var path = require('path');


module.exports = (function () {
	var module = {};

	module.subscribeToContextEvents = function (contextEventBusReader, userDataPath, done) {
		var listener = new module.FileAppendingEventListener(userDataPath);
		contextEventBusReader.on('context event', listener.persistEvent);
		return done(null);
	}

	module.FileAppendingEventListener = function (userDataPath) {
		var self = this;
		var fileName = path.join(userDataPath, 'eventLog.txt');

		self.persistEvent = function (event) {
			var lineToAppend = JSON.stringify(event);
			fs.appendFile(fileName, lineToAppend, function (err) {
				if (err) {
					console.error(err)
					throw err;
				}
			});
		}
	};

	return module;
})();
