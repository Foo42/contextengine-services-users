
/**
 * Module dependencies.
 */

var viewsDir = __dirname + '/views'

var express = require('express')
  , routes = require('./routes')
  , contextEngines = require('./core/contextEngine').createContextEnginesForRegisteredUsers()
  , user = require('./routes/user')
  , authentication = require('./authentication').initialise(contextEngines.getContextEngineForUser)
  , events = require('./routes/events')()
  , states = require('./routes/states')()
  , config = require('./routes/config')
  , http = require('http')
  , cons = require('consolidate')
  , swig = require('swig').init({cache:false, root:viewsDir})
  , path = require('path');

var app = express();
app.engine('html', cons.swig);

// all environments
app.set('port', process.env.PORT || 9005);
app.set('views', viewsDir);
app.set('view engine', 'html');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.session({secret:(process.env['SESSION_KEY'] || '12345')}));
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

app.get('/config/states', authentication.ensureAuthenticated, config.getStateConfig);
app.post('/config/states', authentication.ensureAuthenticated, config.setStateConfig);

module.exports = app;
