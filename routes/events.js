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
				req.user.getContextEngine(function(err, contextEngine){
					if(err){
						return res.send(500);
					}
					var event = {type:'text', text:req.body.eventText};

					contextEngine.registerNewEvent(event, function(){
						res.redirect('/events/recent');	
					});	
				});
			}

			return text;
		})();


		return capture;
	})();

	eventsModule.listRecent = function(req,res){
		req.user.getContextEngine(function(err,contextEngine){
			if(err){
				return res.send(500);
			}
			
			contextEngine.getRecentEvents(function(err, recentEvents){
				var eventsVm = recentEvents.map(function(event){return {type:event.type, detail:(event.text || event.stateName)}})
				res.render('events-list', {title:'Recent Events', events:eventsVm});
			});
		});
	}

	return eventsModule;
}