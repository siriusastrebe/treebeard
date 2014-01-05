// ****************************************************************
// Configs and Inits
// ****************************************************************
// Module dependencies.
var express = require('express')
  , routes =  require('./routes')
  , fs =      require('fs')
  , less =    require('less')
  , socket =  require('socket.io')
  , shibe =   require('dogerr');


var app = module.exports = express.createServer();



var io = socket.listen(app);
io.set('log level', 2);

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

thrones = new Convoset();
root = thrones.JsonToRoot(rootJson);

lan = root.newChild("House Lannister", 'sirius', new Date());
tywin = lan.newChild("Tywin Lannister", 'sirius', new Date());
kevan = lan.newChild("Kevan Lannister", 'sirius', new Date());

cercei = tywin.newChild("Cercei Lannister (crazy)", 'sirius', new Date());
jamie = tywin.newChild("Jamie Lannister", 'sirius', new Date());

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




function sew (topic) { 
  root = topic.root;

  dat = [];

  dfs(root, dat);

  return dat;
 
  function dfs (node, forwards) { 
    var LEAF = 500,
        CHILD_TAX = 50,
        INHERITANCE = .80;

    var parent = forwards[forwards.length-1];

    // Default values for the Root node
    if (forwards.length === 0) {
      parent = {depth: -1, priority: 0}
    }

    // Current node data update
    var data = {};
    forwards.push(data); // <---- Add this node's data to forwards

    data.token = node.token
    data.priority = parent.priority * INHERITANCE;
    data.depth = parent.depth + 1;
    data.distance = Number.MAX_VALUE;


    // Leaf Priority Rank
    if (node.children.length === 0) {
      data.priority += LEAF;
      data.distance = 0;
    }
    else {
      // DFS often has a 'mark vertex as visited' line. This DFS
      // can ommit this code if we start at the root.
      node.children.forEach( function (child) { 
          backwards = dfs(child, forwards);

          // Child tax
          data.priority -= CHILD_TAX;

          if (backwards.distance < data.distance)
            data.distance = backwards.distance + 1;
          
          // priority child->parent inheritance 
          data.priority += backwards.priority / node.children.length;
      });
    }

    return data;
  }
}

function anchor (flowStats) { 
  anchors = [];


  flowStats.sort(compare);

  flowStats.forEach( function (stats) { 
    if (stats.distance === 0) { 
      anchors.push(stats.token);
    }
  });

  return anchors;

  function compare (a, b) {
    if (a.priority < b.priority) 
      return -1;
    return 1;
  }
}


var topics = new Topics();
topics.addTopic(thrones);


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

app.get('/:topic',  function (req, res) { 
    if (!(req.sessionID in sessions)) { 
      sessions[req.sessionID] = req.session;
      console.log('new session in :topic: ' + req.sessionID);
    }

    topic = topics.findTopic(req.params.topic);
    if (topic) { 
      tree = topic.nodesToJson();
      slug = topic.slug;

      flowStats = sew(topic);
      anchors = anchor(flowStats)

      res.render('index.ejs', 
        { topicSlug: slug, tree: JSON.stringify(tree), flowStats: flowStats, anchors: anchors}
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

  // 
  socket.on('introduceMe', function (data) { 
    console.log('socket introduceMe');
    // TODO: allow multiple topics in the same view
    // TODO: Add in a view 404 topics
    topic = topics.findTopic(data.topics);
    if (topic) { 
//      json = topic.nodesToJson();
//      socket.emit('introducing', json);
    } else { 
      socket.emit('error', {msg: "You've entered into a black hole."});
    }
  });

  function nameClient(socket, id) { 
    socket.emit('namedYou', {username: sessions[id].username});      
  }

  socket.on('addBranch', function (data) {
    topic = topics.findTopic(data.topic);

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
    topic = new Convoset();
    topic.JsonToRoot(data.root);
    status = topics.addTopic(topic);
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

