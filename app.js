// ****************************************************************
// Configs and Inits
// ****************************************************************
// Module dependencies.
var express = require('express')
  , routes = require('./routes')
  , fs = require('fs')
  , less = require('less')
  , mongo = require('mongojs')
  , socket = require('socket.io');

var databaseUrl = "mongo"; // "username:password@example.com/mydb"
var collections = ["users", "reports"]
var db = mongo.connect(databaseUrl, collections);

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
// Application Architecture
// ****************************************************************
// Routes
text = "1 In the beginning God created the heaven and the earth.  2    And the earth was without form, and void; and darkness was upon the face of the deep. And the Spirit of God moved upon the face of the waters.  3     And God said, Let there be light: 2 Cor. 4.6 and there was light.  4    And God saw the light, that it was good: and God divided the light from the darkness.  5    And God called the light Day, and the darkness he called Night. And the evening and the morning were the first day.";
root = new convo.Root(text, "Bill Nye the Science Guy", "SCIENCE RULES", "http://www.google.com");
app.get('/', function (req, res) { 
    res.render('index.ejs', {rootConvo: root}); 
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
