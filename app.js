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
var Topics =   require('./public/js/Topics.js');

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

rootJson = {
    contents: "Click on this box and type something in. Once you've done that, click the icon in the top right for an example of what this app is capable of."
  , author: "Stroobles"
  , title: "Demo"
  , link: "www.google.com"
  , timestamp: new Date()
}

firstConvoset = new Convoset();
firstConvoset.JsonToRoot(rootJson);

var topics = new Topics();
topics.addTopic(firstConvoset);

// ****************************************************************
// Application Architecture
// ****************************************************************
// Routes
app.get('/', function (req, res) { 
    res.render('home.ejs', 
      { roots: topics.getRootsInJson()}
) });

app.get('/:topic/',  function (req, res) { 
    // TODO: Add in a view 404 topics
    // TODO: allow for multiple topics
    topic = topics.getTopic(req.params.topic);
    slug = topic.slug;
    res.render('index.ejs', 
      { topicSlug: slug }
    );
});



// WebSocket
io.sockets.on('connection', function (socket) {
  
  socket.on('introduceMe', function (data) { 
    // TODO: allow multiple topics in the same view
    // TODO: Add in a view 404 topics
    console.log(data.topics);
    topic = topics.getTopic(data.topics);
    json = topic.nodesToJson();
    socket.emit('introducing', json);
  });

  socket.on('addBranch', function (data) {
    topic = topics.getTopic(data.topic);
    console.log(data.topic);

    branch = topic.JsonToBranch(data.convo);

    if (!branch) { 
      console.log("Warning: Unable to link child node to a parent");
    }

    // TODO: this is broadcast to every view, when it should be sent
    // only to the views on the same topic. 
    socket.broadcast.emit('newBranch', data);
  });

  socket.on('buildTopic', function (data) {
    topic = new Convoset();
    topic.JsonToRoot(data.root);
    topics.addTopic(topic);
  });
});



// ****************************************************************
// Deploy
// ****************************************************************
app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
