var logger = require('../../core/logger');
var http = require('http');
var app = require('./app');
var connectToStatusNet = require('../../core/serviceStatus').connect();

connectToStatusNet.then(function (statusNet) {
	return statusNet.awaitOnline('users', 'eventStamper', 'historicalEventService', 'cron');
}).then(function () {
	logger.log('starting http server...');
	http.createServer(app).listen(app.get('port'), function () {
		logger.log('Express server listening on port ' + app.get('port'));
    if(process && process.send){
  		process.send(JSON.stringify({
  			status: "ready"
  		}));
    }
		return connectToStatusNet.then(function (statusNet) {
			statusNet.beaconStatus();
		});
	});
}).catch(function(err){
  logger.error('Error starting web frontend',err);
  process.exit(1);
});
