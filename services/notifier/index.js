var Promise = require('bluebird');
var cron = require('cron');
var logger = require('../../core/logger');

var bootstrap = require('./lib').start();

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
