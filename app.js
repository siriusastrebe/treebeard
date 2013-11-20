// ****************************************************************
// Configs and Inits
// ****************************************************************
// Module dependencies.
var express = require('express')
  , routes = require('./routes')
  , fs = require('fs')
  , less = require('less')
  , socket = require('socket.io');


var app = module.exports = express.createServer();

var io = socket.listen(app);

var lessfile = './public/css/less.less';
var cssfile = './public/css/css.css';

// Supplementary JS
var Convo = require('./public/js/convo.js');

// App Configuration
app.configure(function(){
  // ejs 
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.set('view options', {layout: 'layout.ejs'});

  // express
  app.use(express.bodyParser());
  app.use(express.methodOverride());
 
  // router
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

io.set('log level', 2);

// Deployment configuration
app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});


// Less css preprocessor
var lessdata = fs.readFileSync(lessfile, 'utf8');

less.render(lessdata, function (e, css) {
  if (e) throw e;
  fs.writeFile(cssfile, css, function (err) {
    console.log(lessfile + ' rendered into css at ' + cssfile);
  });
});


// ****************************************************************
// Database Architecture TODO: refactor this outa app.js
// ****************************************************************
var text = "The happiness of your life depends upon the quality of your thoughts: therefore, guard accordingly, and take care that you entertain no notions unsuitable to virtue and reasonable nature.";
var root = new Convo.Root(text, 'Marcus', "Aurelius' Wise Words", "http://www.livius.org/a/1/emperors/marcus_aurelius.jpg", new Date());

// ****************************************************************
// Application Architecture
// ****************************************************************
// Routes
app.get('/', function (req, res) { 
    res.render('index.ejs'); 
});


// WebSocket
io.sockets.on('connection', function (socket) {
  socket.emit('introducing', Convo.nodesToJson());

  socket.on('convo', function (data) {
    branch = Convo.JSONToBranch(data.convo);
    if (!branch) { 
      console.log("Warning: Unable to link child node to a parent");
    }
    socket.broadcast.emit('convo', data);
  });
});



// ****************************************************************
// Deploy
// ****************************************************************
app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
