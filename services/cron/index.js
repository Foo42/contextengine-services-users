var Promise = require('bluebird');
var cron = require('cron');
var logger = require('../../core/logger');
var distexProvider = require('./distexProvider');
var connectToStatusNet = require('../../core/serviceStatus').connect();

function canHandle(request) {
	return Promise.resolve(request.expression.cron);
}

var bootstrap = distexProvider.create(canHandle).then(function (provider) {
	provider.on('contract accepted', function (contract) {
		logger.info('contract accepted', contract);

		var cronJob = new cron.CronJob(contract.expression.cron, function () {
			logger.info('Cron:', contract.expression.cron, 'firing. Sending event on contract with requestId', contract.requestId, ' and handlingToken', contract.handlingToken);
			contract.pushEvent({});
		});

		contract.on('watching', function () {
			cronJob.start()
		});
		contract.on('notWatching', function () {
			cronJob.stop()
		});
	});
});

bootstrap.then(function () {
	if (!process || !process.send) {
		return;
	}
	process.send(JSON.stringify({
		status: "ready"
	}));
	connectToStatusNet.then(function (statusNet) {
		statusNet.beaconStatus();
	});
}).catch(function (err) {
	logger.log('badness', err);
	process.exit(1);
})
