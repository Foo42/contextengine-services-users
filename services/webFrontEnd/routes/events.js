var logger = require('../../../core/logger');
var getContextEventBusWriter = require('../../../core/contextEventBusWriter');
var historicalEventService = require('../../historicalEventService/client');

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
		gettingEvents = historicalEventService.getRecentEventsForUser(req.user.id);
		setTimeout(function () {
			gettingEvents.then(function (recentEvents) {
				logger.info('got events from recentEvents service');
				var eventsVm = recentEvents.map(function (event) {
					return {
						type: event.type,
						detail: (event.text || event.stateName)
					}
				});
				res.render('events-list', {
					title: 'Recent Events',
					events: eventsVm
				});
			}).catch(function (err) {
				logger.error('problem getting recent events ' + err);
				res.send(500);
			});
		}, 500);

	}

	return eventsModule;
}
