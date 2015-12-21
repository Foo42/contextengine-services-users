var Promise = require('bluebird');
var cron = require('cron');
var logger = require('../../core/logger');
var connectToStatusNet = require('../../core/serviceStatus').connect();

connectToStatusNet.then(function (statusNet) {
	return statusNet.awaitOnline('users', 'eventStamper', 'historicalEventService', 'cron');
}).then(function () {
  logger.info('dependencies online - starting')
	var bootstrap = require('./lib').start();

	bootstrap.then(function () {
		if (process && process.send) {
  		process.send(JSON.stringify({
  			status: "ready"
  		}));
		}
		return connectToStatusNet.then(function (statusNet) {
			statusNet.beaconStatus();
		});
	}).catch(function (err) {
		logger.log('badness', err);
		process.exit(1);
	});
});
