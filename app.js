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
io.set('log level', 2);

var lessfile = './public/css/less.less';
var cssfile = './public/css/css.css';

// Supplementary JS
var Convoset = require('./public/js/Convoset.js');
var Topics =   require('./public/js/Topics.js');


// ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ 
// App Configuration
// ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ 
// Express Session settings
app.use(express.cookieParser());
app.use(express.session( { 
    secret: 'It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.',
    cookie: {httpOnly: false}   // Enables reading of the session cookie on the client side.
    }
));

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



// ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ = 
// Datasets
// ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ =
rootJson = {
    contents: "Click on this box and type something in. When you're satisfied, click the icon in the top right for an example of what this app is capable of."
  , author: "Stroobles"
  , title: "Demo"
  , link: "www.google.com"
  , timestamp: new Date()
}

firstConvoset = new Convoset();
firstConvoset.JsonToRoot(rootJson);

var topics = new Topics();
topics.addTopic(firstConvoset);

// ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ =
// Application Architecture
// ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ =
sessions = {};
// Routes
app.get('/', function (req, res) { 
    if (!(req.sessionID in sessions)) { 
      console.log('new session at home: ' + req.sessionID);;
      sessions[req.sessionID] = req.session;
    }
      
    res.render('home.ejs', 
      { roots: topics.getRootsInJson()}
) });

app.get('/:topic/',  function (req, res) { 
    if (!(req.sessionID in sessions)) { 
      sessions[req.sessionID] = req.session;
      console.log('new session in :topic: ' + req.sessionID);
    }

    // TODO: Add in a view 404 topics
    // TODO: allow for multiple topics
    topic = topics.findTopic(req.params.topic);
    slug = topic.slug;
    res.render('index.ejs', 
      { topicSlug: slug }
    );
});



// WebSocket
io.sockets.on('connection', function (socket) {

  // Every webpage should send an identifyMe to link every socket
  // with a sessionID.
  socket.on('identifyMe', function (data) { 
    console.log("socket identifyMe");

    id = data.sessionID;
    if (id in sessions) { 
      socket.set('sessionID', id);
      if ('username' in sessions[id])
        nameClient(socket, id);
    } else 
      console.log("Warning: Unable to link a sessionID sent through socket.io to an express sessionID");
  });

  // Associating a session with a username
  socket.on('nameMe', function (data) { 
    socket.get('sessionID', function (err, id) { 
      sessions[id].username = data.username;
      console.log('session ' + id + ' now has the name ' + sessions[id].username);
      nameClient(socket, id);
    });
  });

  // 
  socket.on('introduceMe', function (data) { 
    console.log('socket introduceMe');
    // TODO: allow multiple topics in the same view
    // TODO: Add in a view 404 topics
    topic = topics.findTopic(data.topics);
    json = topic.nodesToJson();
    socket.emit('introducing', json);
  });

  function nameClient(socket, id) { 
    socket.emit('namedYou', {username: sessions[id].username});      
  }

  socket.on('addBranch', function (data) {
    topic = topics.findTopic(data.topic);

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
    status = topics.addTopic(topic);
    if (status) 
      socket.emit('builtTopic', {status: 'success', url: topic.slug});
    else 
      socket.emit('builtTopic', {status: 'failure', error: 'topic by that name already exists.'});
  });
});



// ****************************************************************
// Deploy
// ****************************************************************
app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

