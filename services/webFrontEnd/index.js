var logger = require('../../core/logger');
var http = require('http');
var app = require('./app');

logger.log('starting http server...');
http.createServer(app).listen(app.get('port'), function () {
	logger.log('Express server listening on port ' + app.get('port'));

	process.send(JSON.stringify({
		status: "ready"
	}));
});
