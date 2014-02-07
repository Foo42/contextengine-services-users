
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , ContextEngine = require('./core/contextEngine').ContextEngine
  , user = require('./routes/user')
  , contextEngine = new ContextEngine()
  , events = require('./routes/events')(contextEngine)
  , http = require('http')
  , path = require('path');

var app = express();

(function(){
	var fs = require('fs');
	var fileName = __dirname + "/eventLog.txt";
	var persistEvent = function(event){
		var lineToAppend = JSON.stringify(event);
		fs.appendFile(fileName, lineToAppend, function (err) {
			console.log("wrote to file with err: " + err);
		});	
	}

	contextEngine.on('event created', persistEvent);

})();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
  app.use(require('less-middleware')({ src: __dirname + '/public' }));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);

app.get('/events/capture/text', events.capture.text.get);
app.post('/events/text', events.capture.text.post);
app.get('/events/recent', events.listRecent);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
