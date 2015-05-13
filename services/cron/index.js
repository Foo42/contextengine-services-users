var Promise = require('bluebird');
var cron = require('cron');
var logger = require('../../core/logger');
var distexProvider = require('./distexProvider');

function canHandle(request) {
	logger.info('distex request:', request);
	return Promise.resolve(request.expression.cron);
}

var bootstrap = distexProvider.create(canHandle).then(function (provider) {
	provider.on('contract accepted', function (contract) {
		logger.info('contract accepted', contract);

		var cronJob = new cron.CronJob(contract.expression.cron, function () {
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
}).catch(function (err) {
	logger.log('badness', err);
	process.exit(1);
})
