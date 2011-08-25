// Module Dependencies

var express = require('express');
var redis = require('redis');
var client = redis.createClient();
var RedisStore = require('connect-redis')(express);
var crypto = require('crypto');
var stylus = require('stylus');
var nib = require('nib');
var mailer = require('mailer');

var app = module.exports = express.createServer();

// Stylus Compiler

function compile(str, path){
  return stylus(str)
    .set('filename', path)
    .set('compress', true)
    .use(nib());
}

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'lulIpwnn00bsalldayerrydayfalife$', store: new RedisStore }));
  app.use(require('stylus').middleware({ src: __dirname + '/public', compile: compile }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Message Helper

app.dynamicHelpers({
  success: function(req){
	  var success = req.session.success;
	  delete req.session.success;
    if (success) return '<div class="alert-message success"><a class="close">×</a><p>' + success + '</p></div>';
  },
  message: function(req){
	  var message = req.session.message;
    delete req.session.message;
    if (message) return '<div class="alert-message warning"><a class="close" href="#">×</a><p>' + message + '</p></div>'
  },
  error: function(req){
    var error = req.session.error;
    delete req.session.error;
    if (error) return '<div class="alert-message error"><a class="close">×</a><p>' + error + '</p></div>';
  },
  session: function(req, res){
    return req.session;
  }
});

// Salt Generator

function generateSalt(){
  var text = "";
  var possible= "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
  for(var i = 0; i < 40; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
}

// Generate Hash

function hash(msg, key){
  return crypto.createHmac('sha256', key).update(msg).digest('hex');
}

// Authenticate

function authenticate(username, pass, fn){
  client.get('username:' + username + ':uid', function(err, uid){
    if (uid !== null){
      client.hgetall('uid:' + uid, function(err, user){
        if (user.pass == hash(pass, user.salt)){
          return fn(null, user);
        }
        else{
          fn(new Error('invalid password'));
        }
      });
    }
    else{
      return fn(new Error('cannot find user'));
    }
  });
}

function restrict(req, res, next){
  if (req.session.user) {
    next();
  } else {
    req.session.error = 'Access denied!';
    res.redirect('/login');
  }
}

function accessLogger(req, res, next){
  console.log('/restricted accessed by %s', req.session.user.username);
  next();
}

function registerUser(req, res, next){
  var firstname = req.body.firstname;
  var lastname = req.body.lastname;
  var email = req.body.email;
  var school = req.body.school;
  var username = req.body.username;
  var password = req.body.password;
  var salt = generateSalt();
  var recoveryquestion = req.body.recoveryquestion;
  var recoveryquestionanswer = req.body.recoveryquestionanswer;
  
  if (firstname.length == 0 || lastname.length == 0 || email.length == 0 || school.length == 0 || username.length == 0 || password.length == 0 || recoveryquestion.length == 0 || recoveryquestionanswer.length == 0){
    req.session.error = 'Registration failed, please enter all of the required fields!';
    res.redirect('back');
  }
  else{
    client.get('username:' + username + ':uid', function(err, uid){
      if (uid !== null){
        req.session.error = 'Registration failed, ' + username + ' already taken.';
        res.redirect('back');
      }
      else{
        client.incr('global:nextUserId', function(err, uid){
          client.set('username:' + username + ':uid', uid);
          client.hmset('uid:' + uid, {
            firstname: firstname,
            lastname: lastname,
            email: email,
            school: school,
            username: username,
            salt: salt,
            pass: hash(password, salt),
            recoveryquestion: recoveryquestion,
            recoveryquestionanswer: recoveryquestionanswer
          }, function(){
            console.log(username + ' has registered!');
            next()
          });
        });
      }
    });
  }
}

// Routes

app.param('user', function(req, res, next, user){
	if (req.session.user.username == user){
  	client.get('username:' + user + ':uid', function(err, uid){
    	if (uid !== null){
	      next();
    	}
      else{
	      res.send(404);
      }
    });		
	}
  else{
	  res.send(404);
  }
});

app.get('/', function(req, res){
  res.render('index', {
  	title: 'XC'
  });
});

app.get('/restricted', restrict, accessLogger, function(req, res){
  res.render('restricted', {
    title: 'Restricted Section'
  });
});

app.get('/logout', function(req, res){
  var user = req.session.user;
  req.session.destroy(function(err){
    if (err){
      console.log('Error destroying session...');
    }
    else{
      console.log(user.username + ' has logged out.');
      res.redirect('home');
    }
  });
});

app.get('/login', function(req, res){
  res.render('login', {
    title: 'XC Login'
  });
});

app.post('/login', function(req, res){
  var usernameLength = req.body.username.length;
  var passwordLength = req.body.password.length;
  if (usernameLength == 0 || passwordLength == 0){
    req.session.error = 'Authentication failed, please enter both a username and password!';
    res.redirect('back');
  }
  else{
    authenticate(req.body.username, req.body.password, function(err, user){
      if (user) {
        req.session.regenerate(function(){
          req.session.user = user;
          req.session.success = 'Authenticated as ' + req.session.user.firstname + '.';
          console.log(req.session.user.username + ' logged in!');
          res.redirect('home');
        });
      } else {
        req.session.error = 'Authentication failed, please check your username and password.';
        res.redirect('back');
      }
    });
  }
});

app.get('/register', function(req, res){
  res.render('register', {
    title: 'XC Register'
  });
});

app.post('/register', registerUser, function(req, res){
  req.session.success = 'Thanks for registering!  Try <a href="/login">logging in</a>!';
  res.redirect('back');
});

app.get('/users/:user', function(req, res){
  res.render('user', {
	  title: req.session.user.username + '\'s profile',
    user: req.session.user
  });
});

app.get('/users/:user/edit', function(req, res){
  res.render('useredit', {
    title: 'Edit ' + req.session.user.username + '\'s profile',
    user: req.session.user
  });
});

app.get('/users/:user/log', function(req, res){
  res.render('userlog', {
    title: req.session.user.username + '\'s log',
    user: req.session.user
  });
});

app.listen(80);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);