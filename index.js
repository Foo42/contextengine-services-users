var http = require('http');
var app = require('./app');

require('./services').bootstrapServices().then(function () {
    console.log('Express server listening on port ' + app.get('port'));

    process.send(JSON.stringify({
        status: "ready"
    }));
});
