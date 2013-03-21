///////////////////////////////////////////
// MODULE IMPORTS
///////////////////////////////////////////

var express = require('express');
var https = require('https');
var fs = require('fs');
var passport = require('passport');
var OAuth2Strategy = require('passport-oauth').OAuth2Strategy;
var request = require('request');
// local module
var appConfig = require('./appConfig');

///////////////////////////////////////////
//  COMMON FUNCTIONS
///////////////////////////////////////////

// simplified request handling
function handleRequest(user, options, callback) {
  var headers =  { 'Authorization': 'Bearer ' + user.accessToken, 
                   'Content-Type': 'application/json'};
  var method = options.method.toUpperCase(); 
  if(method=='PUT' || method=='POST') {
    options.body = JSON.stringify(options.body);
    headers['Content-Length'] = options.body.length; // Setting up content length in the request header
  }

  request({ 
        'uri' : appConfig.requestUrl + options.uri,
        'body' : options.body,
        'method' : options.method,
        'headers' : headers 
  }, 
  function(error, response, body) {
    if(error) {
      callback(user,null);
      return;
    }

    if (response.statusCode === 200) {
      callback(user,JSON.parse(body));
    } else {
      callback(user,response.statusCode);
    }
  });
};

// require token for session enabled request
// thanks slc sdk...
function requireToken() {
  return function(req, res, next) {
     if (req.session.passport.user &&
         findUser(req)) {
       next();
     }
     else {
       res.redirect('/login');
     }
   }
}

///////////////////////////////////////////
// PERSISTENT SESSION SETUP 
// Note : Use a real store
///////////////////////////////////////////

var users = [];

// retrieve user for request
function findUser(request) { 
  return users[request.session.passport.user]; 
};

// store user in persistent storage for passport
passport.serializeUser(function(user, done) {
  users[user.user_id] = user;
  done(null, user.user_id);
});

// retrieve user from persistent store for passport 
passport.deserializeUser(function(id, done) {
  var user = users[id];
  done(null, user);
});

///////////////////////////////////////////
// APP AND MODULE CONFIG 
///////////////////////////////////////////

// setup oauth through passport
passport.use('slc', new OAuth2Strategy({
    authorizationURL: appConfig.oauth.authorizationUrl,
    tokenURL: appConfig.oauth.tokenUrl,
    clientID: appConfig.oauth.clientId,
    clientSecret: appConfig.oauth.clientSecret,
    callbackURL: appConfig.oauth.callbackUrl 
  },
  function(accessToken, refreshToken, profile, done) {
    var fakeUser = { 'accessToken' : accessToken }; 
    var options =  { 'method' : 'GET', 
                     'uri' : '/system/session/check' };
    var callback = function(user, data) {
      var fullUser = null;
      if(data  && data.user_id) { 
        fullUser = data;
        fullUser.accessToken = user.accessToken;
      } 
      done(null, fullUser);
    };
    handleRequest(fakeUser,options,callback);  
  }
));

// setup express server
var app = express();
app.configure(function() {
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  // session initialization
  app.use(express.session({ secret: appConfig.sessionSecret }));
  // passpport initialization
  app.use(passport.initialize());
  app.use(passport.session());
  // set location for css, javasript, images
  app.use(express.static(__dirname + '/public'));
  // setup jade
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
});

///////////////////////////////////////////
// SESSION HANDLING REQUEST HANDLERS 
///////////////////////////////////////////

// entry point for slc auth
app.get('/auth/slc', passport.authenticate('slc'));

// callback for slc auth
app.get('/auth/slc/callback', 
  passport.authenticate('slc', { successRedirect: '/',
                                 failureRedirect: '/login' }));

// login setup
app.get('/login', function(req, res){
  res.render('login.jade',{ 'title' : 'My App - Login' });
});


// logout handler
app.get('/logout', requireToken(), function(req, res) {
  handleRequest(findUser(req),
                { 'method' : 'GET', 'uri' : '/system/session/logout' },
		function(user, data) {
                  res.redirect('/login');
		});
});

///////////////////////////////////////////
// APP SPECIFIC REQUEST HANDLERS 
///////////////////////////////////////////

app.get('/', requireToken(), function(req, res) {
  res.redirect('/dashboard'); 
});

app.get('/dashboard', requireToken(), function(req, res) {
  res.render('index.jade',{ 'title' : 'My App' }); 
});

app.get('/schools', requireToken(), function(req, res) {
  handleRequest(findUser(req),
                { 'method' : 'GET', 'uri' : '/schools' },
		function(user, data) {
                  res.render('schools.jade',{ 'title' : 'My App - Schools', 'schools' : data });
		});
});

app.get('/students', requireToken(), function(req, res) {
  handleRequest(findUser(req),
                { 'method' : 'GET', 'uri' : '/students' },
		function(user, data) {
                  res.render('students.jade',{ 'title' : 'My App - Students', 'students' : data });
		});
});


///////////////////////////////////////////
// APP STARTUP
///////////////////////////////////////////

if(appConfig.port>0) {
  app.listen(appConfig.port);
  console.log('HTTP listening on port ' + appConfig.port);
}

if(appConfig.portSSL>0) {
  var privateKey = fs.readFileSync('ssl/privateKey.pem');
  var certificate = fs.readFileSync('ssl/certificate.pem');
  var sslOptions = { key : privateKey, cert : certificate };
  https.createServer(sslOptions,app).listen(appConfig.portSSL);
  console.log('HTTPS listening on port ' + appConfig.portSSL);
}
