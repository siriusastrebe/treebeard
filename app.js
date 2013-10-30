
// Module dependencies.
var express = require('express')
  , routes = require('./routes')
  , fs = require('fs')
  , less = require('less');

var app = module.exports = express.createServer();

var lessfile = './public/stylesheets/less.css';

// App Configuration
app.configure(function(){
  app.set('views', __dirname + '/views');

  // jade
  app.set('view engine', 'jade');

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
less.render('.class { width: (1 + 1) }', function (e, css) {
  if (e) throw err;
  fs.writeFile(lessfile, css, function (err) {
    if (err) throw err;
    console.log('Less stylesheet saved to ' + lessfile);
  });
});


// Routes
app.get('/', routes.index);


// Deploy
app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
