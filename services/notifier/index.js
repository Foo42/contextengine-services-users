var Promise = require('bluebird');
var logger = require('../../core/logger');
var connectToStatusNet = require('../../core/serviceStatus').connect();
var lib = require('./lib');

connectToStatusNet.then(function (statusNet) {
	return statusNet.awaitOnline('users', 'eventStamper', 'historicalEventService', 'cron');
}).then(function () {
  logger.info('dependencies online - starting')
	var bootstrap = lib.start();

	bootstrap.then(function () {
    logger.info('bootstrap promise has resolved');
		if (process && process.send) {
  		process.send(JSON.stringify({
  			status: "ready"
  		}));
		}
		return connectToStatusNet.then(function (statusNet) {
			statusNet.beaconStatus();
		});
	}).catch(function (err) {
		logger.error('badness', err);
		process.exit(1);
	});
});
