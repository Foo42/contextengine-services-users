var logger = require('../../core/logger');
var http = require('http');
var app = require('./app');

http.createServer(app).listen(app.get('port'), function () {
	logger.log('Users Service listening on port ' + app.get('port'));

	process.send(JSON.stringify({
		status: 'ready'
	}));
});
