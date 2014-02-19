// ****************************************************************
// Configs and Inits
// ****************************************************************
// Module dependencies.
var express = require('express')
  , routes =  require('./routes')
  , fs =      require('fs')
  , less =    require('less')
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

var lessfile = './public/css/less.less';
var cssfile = './public/css/css.css';
var csspath = '/css/css.css';

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

function preprocess (callback) {
  var lessdata = fs.readFileSync(lessfile, 'utf8');

  less.render(lessdata, function (e, css) {
    if (e) throw e;
    fs.writeFile(cssfile, css, function (err) {
      console.log(lessfile + ' rendered into css at ' + cssfile);
      callback.call(this);
    });
  });
}

app.get(csspath,  function (req, res) { 
 preprocess(function () { 
   res.sendfile(cssfile, {root: __dirname});
 });
})


// ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ = 
// Datasets
// ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ =
rootJson = {
    contents: "Family Tree of Westeros"
  , author: "Stroobles"
  , title: "GoT family tree"
  , link: "http://img.timeinc.net/time/2012/t100poll/t100poll_martin_george_rr.jpg"
  , timestamp: new Date()
}

thrones = new Convoset.Convoset();
root = thrones.JsonToRoot(rootJson);

lan = root.newChild("House Lannister", 'sirius', new Date());
tywin = lan.newChild("Tywin Lannister", 'sirius', new Date());
kevan = lan.newChild("Kevan Lannister", 'sirius', new Date());

cercei = tywin.newChild("Cercei Lannister (crazy)", 'sirius', new Date());
jamie = tywin.newChild("Jamie Lannister", 'sirius', new Date());
tyrion = tywin.newChild("Tyrion Lannister", 'sirius', new Date());

joff = cercei.newChild("Joffery Baratheon", 'sirius', new Date());
myrcella = cercei.newChild("Myrcella Baratheon", 'sirius', new Date());
tommen = cercei.newChild("Tommen Baratheon", 'sirius', new Date());



stark = root.newChild("House Stark", 'sirius', new Date());

rick = stark.newChild("Rickard Stark", 'sirius', new Date());

edd = rick.newChild("Eddard Stark", 'sirius', new Date());
ben = rick.newChild("Benjen Stark", 'sirius', new Date());
brandon = rick.newChild("Brandon Stark", 'sirius', new Date());

robb = edd.newChild("Rob Stark", 'sirius', new Date());
sansa = edd.newChild("Sansa Stark", 'sirius', new Date());
arya = edd.newChild("Arya Stark", 'sirius', new Date());
bran  = edd.newChild("Bran Stark", 'sirius', new Date());
rickon = edd.newChild("Rickon Stark", 'sirius', new Date());
jon = edd.newChild("Jon Snow (knows nothing)", 'sirius', new Date());


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

    console.log(counter);

    child = queue[0][0].newChild('#' + counter++ + ' level-' + queue[0][1], '', new Date ());

    if (queue[0][1] < queue[0][2])  
      binMaker(child, queue[0][1]+1, queue[0][2]);
    
    queue.splice(0, 1);
  }
}


binMaker(binaryRoot, 1, 8);
binBreadth(queue);


var TOPICS = new Topics();
TOPICS.addTopic(thrones);
TOPICS.addTopic(binary);



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
      { roots: TOPICS.getRootsInJson()}
) });

app.get('/:topic',  function (req, res) { 
    if (!(req.sessionID in sessions)) { 
      sessions[req.sessionID] = req.session;
      console.log('new session in :topic: ' + req.sessionID);
    }

    topic = TOPICS.findTopic(req.params.topic);
    if (topic) { 
      slug = topic.slug;
      tree = JSON.stringify(topic.nodesToJson());

      res.render('posts.ejs', 
        { topicSlug: slug, tree: tree}
      );
    }
    else { 
      res.render('404.ejs',
        { url: req.params.topic } 
      );
    }
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

  // Creating a new connection
  socket.on('introduceMe', function (data) { 
  });

  function nameClient(socket, id) { 
    socket.emit('namedYou', {username: sessions[id].username});      
  }

  socket.on('addBranch', function (data) {
    topic = TOPICS.findTopic(data.topic);

    json = data.convo;
    json.timestamp = new Date();
    if (topic.findNode(json.parentToken)) { 
      branch = topic.JsonToBranch(data.convo);
      branchJson = branch.toJson();

      // TODO: this is broadcast to every view, when it should be sent
      // only to the views on the same topic. 
      socket.broadcast.emit('newBranch', {convo: branchJson});
      socket.emit('newBranch', {convo: branchJson});

    }
    else 
      console.log("Warning: Unable to link child node to a parent");
  });

  socket.on('buildTopic', function (data) {
    topic = new Convoset.Convoset();
    topic.JsonToRoot(data.root);
    status = TOPICS.addTopic(topic);
    if (status) 
      socket.emit('builtTopic', {status: 'success', url: topic.slug});
    else 
      socket.emit('error', {msg: 'Topic name has been taken. Try something else.'});
  });
});



// ****************************************************************
// Deploy
// ****************************************************************
app.listen(process.env.PORT || 3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
