var fs = require('fs');
var path = require('path');


module.exports = (function(){
	var module = {};

	module.attachListener = function(contextEngine, done){
		var listener = new module.FileAppendingEventListener(contextEngine);
		contextEngine.on('event created', listener.persistEvent);
		return done(null);	
	}

	module.FileAppendingEventListener = function(contextEngine){
		var self = this;
		var fileName = path.join(contextEngine.userDataPath, 'eventLog.txt');
		
		self.persistEvent = function(event){
			var lineToAppend = JSON.stringify(event);
			fs.appendFile(fileName, lineToAppend, function (err) {
				if(err){
					console.error(err)
					throw err;
				}
			});
		}
	};

	return module;
})();