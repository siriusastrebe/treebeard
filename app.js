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
var Convoset = require('./public/js/Convoset.js');

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
// Datasets
// ****************************************************************
var Convos = new Convoset();
rootJson = {
    contents: "The best remedy for those who are afraid, lonely or unhappy is to go outside, somewhere where they can be quiet, alone with the heavens, nature and God. Because only then does one feel that all is as it should be."
  , author: "Anne Frank"
  , title: "Anne Frank the Belieber"
  , link: "http://www.funnyordie.com/videos/ca8e174a54/between-two-ferns-with-zach-galifianakis-justin-bieber"
  , timestamp: new Date()
}
Convos.JSONToRoot(rootJson);

// ****************************************************************
// Application Architecture
// ****************************************************************
// Routes
app.get('/home', function (req, res) { 
    res.render('home.ejs');
});
app.get('/', function (req, res) { 
    res.render('index.ejs'); 
});


// WebSocket
io.sockets.on('connection', function (socket) {
  socket.emit('introducing', Convos.nodesToJson());

  socket.on('convo', function (data) {
    branch = Convos.JSONToBranch(data.convo);
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
