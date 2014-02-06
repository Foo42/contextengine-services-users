module.exports = (function(){
	var module = {};

	module.ContextEngine = function(){
		var self = this;
		var recentEvents = [];

		self.processNewEvent = function(event, done){
			recentEvents.push(event);
			done();
		}

		self.getRecentEvents = function(done){
			done(null, recentEvents);
		}
	};
	

	return module;
})();