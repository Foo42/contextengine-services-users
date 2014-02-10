module.exports = (function(){
	var module = {};

	module.attachListener = function(contextEngine){
		var listener = new module.FileAppendingEventListener();
		contextEngine.on('event created', listener.persistEvent);	
	}

	module.FileAppendingEventListener = function(){
		var self = this;
		var fs = require('fs');
		var path = require('path');
		var rootDir = path.dirname(require.main.filename);
		var fileName = path.join(rootDir, 'eventLog.txt');
		
		self.persistEvent = function(event){
			var lineToAppend = JSON.stringify(event);
			fs.appendFile(fileName, lineToAppend, function (err) {
				if(err){console.error(err)}
			});	
		}
	};

	return module;
})();