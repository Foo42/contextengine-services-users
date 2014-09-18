var getContextEventBusWriter = require('../core/contextEventBusWriter');

module.exports = function () {
	var eventsModule = {};

	eventsModule.capture = (function () {
		var capture = {};

		capture.text = (function () {
			var text = {};

			text.get = function (req, res) {
				res.render('text-event-capture-form', {
					title: 'Capture Event'
				});
			};

			text.post = function (req, res) {
				var event = {
					type: 'text',
					text: req.body.eventText
				};
				getContextEventBusWriter(req.user.id).registerNewEvent(event);
				setTimeout(function () {
					res.redirect('/events/recent');
				}, 100);
			}

			return text;
		})();


		return capture;
	})();

	eventsModule.listRecent = function (req, res) {
		gettingEvents = require('../services/historicalEventService/client').getRecentEventsForUser(req.user.id);
		setTimeout(function () {
			console.log('getting events from recentEvents service');
			gettingEvents.then(function (recentEvents) {
				console.log('got events from recentEvents service');
				var eventsVm = recentEvents.map(function (event) {
					return {
						type: event.type,
						detail: (event.text || event.stateName)
					}
				});
				console.log('returning recent events: ' + JSON.stringify(eventsVm));
				res.render('events-list', {
					title: 'Recent Events',
					events: eventsVm
				});
			}).catch(function (err) {
				console.error('problem getting recent events ' + err);
				res.send(500);
			});
		}, 500);

	}

	return eventsModule;
}
