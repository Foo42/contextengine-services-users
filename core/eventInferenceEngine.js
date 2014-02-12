module.exports = (function(){
	var module = {};

	module.attachListener = function(contextEngine){
		var listener = new module.EventInferenceEngine();
		contextEngine.on('event created', listener.processEvent);	
	}

	module.EventInferenceEngine = function(){
		var self = this;
		
		self.processEvent = function(event){
		
		}
	};

	return module;
})();