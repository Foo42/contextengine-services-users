var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');

module.exports = (function(){
	var module = {};

	module.attachListener = function(contextEngine){
		var listener = new module.FileAppendingEventListener(contextEngine);
		contextEngine.on('event created', listener.persistEvent);	
	}

	module.FileAppendingEventListener = function(contextEngine){
		var self = this;
		var rootDir = contextEngine.userDataPath;
		var fileName = path.join(rootDir, 'eventLog.txt');
		
		self.persistEvent = function(event){
			mkdirp(rootDir,function(err){
				if(err){throw err;}

				var lineToAppend = JSON.stringify(event);
				fs.appendFile(fileName, lineToAppend, function (err) {
					if(err){console.error(err)}
				});
			});				
		}
	};

	return module;
})();