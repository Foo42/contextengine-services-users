module.exports = function(){
	var eventsModule = {};
	
	eventsModule.capture = (function(){
		var capture = {};

		capture.text = (function(){
			var text = {};

			text.get = function(req,res){							
				res.render('text-event-capture-form', { title: 'Capture Event' });
			};

			text.post = function(req, res){
				var contextEngine = req.user.contextEngine;
				var event = {type:'text', text:req.body.eventText};

				contextEngine.registerNewEvent(event, function(){
					res.redirect('/events/recent');	
				});
			}

			return text;
		})();


		return capture;
	})();

	eventsModule.listRecent = function(req,res){
		req.user.contextEngine.getRecentEvents(function(err, recentEvents){
			res.render('events-list', {title:'Recent Events', events:recentEvents});
		});
	}

	return eventsModule;
}