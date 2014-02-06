module.exports = function(contextEngine){
	var eventsModule = {};

	eventsModule.capture = (function(){
		var capture = {};

		capture.text = (function(){
			var text = {};

			text.get = function(req,res){			
				res.render('text-event-capture-form', { title: 'Capture Event' });
			};

			text.post = function(req, res){
				var event = {type:'text', text:req.body.eventText};
				
				contextEngine.processNewEvent(event);
				res.redirect('/events/recent');
			}

			return text;
		})();


		return capture;
	})();

	eventsModule.listRecent = function(req,res){
		var recentEvents = contextEngine.getRecentEvents();
		res.render('events-list', {title:'Recent Events', events:recentEvents});
	}

	return eventsModule;
}