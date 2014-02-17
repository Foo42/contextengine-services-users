
/**
 * Module dependencies.
 */

var isOfflineMode = process.env['OFFLINE_MODE'] && process.env['OFFLINE_MODE'].toLowerCase() == 'true';

var express = require('express')
  , routes = require('./routes')
  , contextEngines = require('./core/contextEngine').createContextEnginesForRegisteredUsers()
  , user = require('./routes/user')
  , authentication = isOfflineMode ? require('./fakeAuthentication').initialise(contextEngines.getContextEngineForUser) : require('./authentication').initialise(contextEngines.getContextEngineForUser)
  , events = require('./routes/events')()
  , states = require('./routes/states')()
  , http = require('http')
  , path = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
authentication.insertMiddleware(app);
app.use(app.router);
  app.use(require('less-middleware')({ src: __dirname + '/public' }));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

authentication.setupRoutes(app);
app.get('/', function(req,res){res.redirect('/events/capture/text')});
app.get('/users', user.list);

app.get('/events/capture/text', authentication.ensureAuthenticated,  events.capture.text.get);
app.post('/events/text', authentication.ensureAuthenticated, events.capture.text.post);
app.get('/events/recent', authentication.ensureAuthenticated, events.listRecent);

app.get('/states/active', authentication.ensureAuthenticated, states.listActive);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
