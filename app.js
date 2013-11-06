
// Module dependencies.
var express = require('express')
  , routes = require('./routes')
  , fs = require('fs')
  , less = require('less')
  , mongo = require('mongojs');

var databaseUrl = "db"; // "username:password@example.com/mydb"
var collections = ["users", "reports"]
var db = mongo.connect(databaseUrl, collections);

var app = module.exports = express.createServer();

var lessfile = './public/stylesheets/less.less';
var cssfile = './public/stylesheets/css.css';

// App Configuration
app.configure(function(){
  app.set('views', __dirname + '/views');

  // ejs 
  app.set('view engine', 'ejs');

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
  if (e) throw err;
  fs.writeFile(cssfile, css, function (err) {
    console.log(lessfile + ' rendered into css at ' + cssfile);
  });
});


// Routes
app.get('/', routes.index);
app.get('/articles/', function (req, res) { console.log("article") });
app.get('/articles/:article', function (req, res) { console.log("article: " + req.params.article) }); 
app.get('/articles/:article/:rebuttal', function (req, res) { console.log("rebuttal: " + req.params.rebuttal + " article: " + req.params.article) });
app.get('/users', routes.register);
app.get('/:topic', function (req, res) { console.log("topic: " + req.params.topic) }); 


// Deploy
app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
