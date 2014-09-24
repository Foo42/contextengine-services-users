var http = require('http');
var app = require('./app');

console.log('starting http server...');
http.createServer(app).listen(app.get('port'), function () {
	console.log('Express server listening on port ' + app.get('port'));

	process.send(JSON.stringify({
		status: "ready"
	}));
});
