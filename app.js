// ****************************************************************
// Configs and Inits
// ****************************************************************
// Module dependencies.
var express = require('express')
  , routes =  require('./routes')
  , fs =      require('fs')
  , less =    require('less')
  , syc =     require('syc')
  , socket =  require('socket.io');


var app = module.exports = express.createServer();



var io = socket.listen(app);
io.set('log level', 2);
io.set('transports', [
    'websocket'
  , 'flashsocket'
  , 'htmlfile'
  , 'xhr-polling'
  , 'jsonp-polling'
]);

var lessFile = './public/css/less.less';
var cssFile = './public/css/css.css';
var cssExternalPath = '/css/css.css';
var sycFile = './node_modules/syc/client/syc.js';
var sycExternalPath = '/syc.js';

// Supplementary JS
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
function preprocess (callback) {
  var lessdata = fs.readFileSync(lessFile, 'utf8');

  less.render(lessdata, function (e, css) {
    if (e) throw e;
    fs.writeFile(cssFile, css, function (err) {
      console.log(lessFile + ' rendered into css at ' + cssFile);
      callback.call(this);
    });
  });
}

app.get(cssExternalPath,  function (req, res) { 
 preprocess(function () { 
   res.sendfile(cssFile, {root: __dirname});
 });
})

// Syc routing
app.get(sycExternalPath, function (req, res) {
  res.sendfile(sycFile, {root: __dirname});
});


// ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ = 
// Datasets
// ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ =
gotJson = {
    contents: "Family Tree of Westeros"
  , author: "Stroobles"
  , children: []
}

var lannister = { contents: "House Lannister", author: 'sirius', children: [
  { contents: "Tywin Lannister", author: 'sirius', children: [
    { contents: "Cercei Lannister (crazy)", author: 'sirius', children: [
      { contents: "Joffery Baratheon", author: 'sirius' },
      { contents: "Myrcella Baratheon", author: 'sirius' },
      { contents: "Tommen Baratheon", author: 'sirius' },
    ]},
    { contents: "Jamie Lannister", author: 'sirius' },
    { contents: "Tyrion Lannister", author: 'sirius' },
  ]},
  { contents: "Kevan Lannister", author: 'sirius' },
]}

var stark = { contents: "House Stark", author: 'sirius', children: [
  { contents: "Rickard Stark", author: 'sirius', children: [ 
    { contents: "Eddard Stark", author: 'sirius', children: [
      { contents: "Rob Stark", author: 'sirius' },
      { contents: "Sansa Stark", author: 'sirius' },
      { contents: "Arya Stark", author: 'sirius' },
      { contents: "Bran Stark", author: 'sirius' },
      { contents: "Rickon Stark", author: 'sirius' },
      { contents: "Jon Snow (knows nothing)", author: 'sirius' },
    ]},
    { contents: "Benjen Stark", author: 'sirius' },
    { contents: "Brandon Stark", author: 'sirius' },
  ]},
]}


gotJson.children = [lannister, stark];



/*
binaryJson = {
    contents: 'Zero'
  , author: "Michael Sloan, Haskell God"
  , title: "Stress test, 512 element Binary Tree"
  , timestamp: new Date()
}

binary = new Convoset.Convoset();

binaryRoot = binary.JsonToRoot(binaryJson);

counter = 1;
queue = [];

function binMaker (node, depth, max) { 

  queue.push([node, depth, max]);
  queue.push([node, depth, max]);

}

function binBreadth (queue) { 
  while (queue.length > 0) {

    child = queue[0][0].newChild('#' + counter++ + ' level-' + queue[0][1], '', new Date ());

    if (queue[0][1] < queue[0][2])  
      binMaker(child, queue[0][1]+1, queue[0][2]);
    
    queue.splice(0, 1);
  }
}


binMaker(binaryRoot, 1, 8);
binBreadth(queue);
*/

var TOPICS = new Topics();
TOPICS.addTopic(gotJson);
//TOPICS.addTopic(binary);



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
      
    res.render('home.ejs');
});

app.get('/:topic',  function (req, res) { 
    if (!(req.sessionID in sessions)) { 
      sessions[req.sessionID] = req.session;
      console.log('new session in :topic: ' + req.sessionID);
    }

    res.render('posts.ejs');

    /*
    else { 
      res.render('404.ejs',
        { url: req.params.topic } 
      );
    }
    */
});


// Syc
var usernames = [];
syc.sync('usernames', usernames); 

var roots = {};
var got = [gotJson];
roots['got'] = got;
syc.sync('Tree', roots);
syc.sync('got', got);

syc.verify(usernames, function (changes, socket) { 
  if (typeof changes.change === 'string') {
    return true
  }
});

function postVerifier (change) { 
  if (syc.type(change) !== 'object') return false;
  if (typeof change.author !== 'string') return false;
  if (typeof change.contents !== 'string') return false;
  if (syc.type(change.children) !== 'array') return false;
  for (var property in change) { 
    if (property !== 'author' && property !== 'contents' && property !== 'children') {
      return false;
    }
  }

  return true;
}

syc.verify(roots, function (changes, socket) { 
  if (syc.type(changes.change) !== 'array') return false;
  return postVerifier(changes.change[0]);
});


syc.watch(roots, function (changes, socket) { 
  var topicName = changes.property,
      topicRoot = changes.change;
  
  Syc.sync(topicName, topicRoot) 
});



// WebSocket
io.sockets.on('connection', function (socket) {
  syc.connect(socket);
});



// ****************************************************************
// Deploy
// ****************************************************************
app.listen(process.env.PORT || 3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
