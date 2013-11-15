// ****************************************************************
// Configs and Inits
// ****************************************************************
// Module dependencies.
var express = require('express')
  , routes = require('./routes')
  , fs = require('fs')
  , less = require('less')
  , mongoose = require('mongoose')
  , socket = require('socket.io');

mongoose.connect('mongodb://localhost/test');

var app = module.exports = express.createServer();

var io = socket.listen(app);

var lessfile = './public/stylesheets/less.less';
var cssfile = './public/stylesheets/css.css';

// Supplementary JS
var convo = require('./public/js/convo.js');

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
var Roots = mongoose.model('Root', convo.rootSchema);
var text = "The happiness of your life depends upon the quality of your thoughts: therefore, guard accordingly, and take care that you entertain no notions unsuitable to virtue and reasonable nature.";
var root = new convo.Root(text, "Marcus Aurelius", "http://www.livius.org/a/1/emperors/marcus_aurelius.jpg", new Date());
var rootie = new Roots(root.toJson);
rootie.save(function (err) { 
  if (err) throw err;
  console.log("Meow");
});

// ****************************************************************
// Application Architecture
// ****************************************************************
// Routes
app.get('/', function (req, res) { 
    res.render('index.ejs', {rootConvo: a}); 
});

/* Commented out because it the functionality ain't there yet
app.get('/articles/', function (req, res) { console.log("article") });
app.get('/articles/:article', function (req, res) { console.log("article: " + req.params.article) }); 
app.get('/articles/:article/:rebuttal', function (req, res) { console.log("rebuttal: " + req.params.rebuttal + " article: " + req.params.article) });
app.get('/users', routes.register);
app.get('/:topic', function (req, res) { console.log("topic: " + req.params.topic) }); 
*/

// WebSocket
io.sockets.on('connection', function (socket) {
  socket.on('convo', function (data) {
    console.log(data.convo);
    socket.broadcast.emit('convo', data);
  });
});



// ****************************************************************
// Deploy
// ****************************************************************
app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
