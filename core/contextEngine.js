module.exports = (function(){
	var module = {};

	module.ContextEngine = function(){
		var self = this;
		var recentEvents = [];

		self.processNewEvent = function(event){
			recentEvents.push(event);
		}

		self.getRecentEvents = function(){
			return recentEvents;
		}
	};
	

	return module;
})();