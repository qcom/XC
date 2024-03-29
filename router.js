module.exports = function(app){

  var redis = require('redis');
  var client = redis.createClient();
  var auth = require('./authenticate');

  /* Route Param Pre-Conditions */

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

  /* Middleware */

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

  function logout(req, res, next){
    var user = req.session.user;
    req.session.destroy(function(err){
      if (err){
        console.log('Error destroying session...');
      }
      else{
        console.log(user.username + ' has logged out.');
        next();
      }
    });
  }

  function login(req, res, next){
    if (req.body.username.length == 0 || req.body.password.length == 0){
      req.session.error = 'Authentication failed, please enter both a username and password!';
      res.redirect('back');
    }
    else{
      client.get('username:' + username + ':uid', function(err, uid){
        if (uid !== null){
          client.hgetall('uid:' + uid, function(err, user){
            if (user.pass == hash(pass, user.salt)){
              req.session.regenerate(function(){
                req.session.user = user;
                req.session.success = 'Authenticated as ' + req.session.uer.firstname + '.';
                console.log(req.session.user.username + ' logged in!');
                next();
              });
            }
            else{
              new Error('invalid password');
              req.session.error = 'Authentication failed, please check your username and password.';
              res.redirect('back');
            }
          });
        }
        else{
          new Error('cannot find user');
          req.session.error = 'Authentication failed, please check your username and password.';
          res.redirect('back');
        }
      });
    }
  }

  function register(req, res, next){
    var firstname = req.body.firstname;
    var lastname = req.body.lastname;
    var email = req.body.email;
    var school = req.body.school;
    var username = req.body.username;
    var password = req.body.password;
    var salt = auth.generateSalt();
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
              pass: auth.hash(password, salt),
              recoveryquestion: recoveryquestion,
              recoveryquestionanswer: recoveryquestionanswer
            }, function(){
              console.log(username + ' has registered!');
              req.session.success = 'Thanks for registering!  Try <a href="/login">logging in</a>!';
              next()
            });
          });
        }
      });
    }
  }

  /* Routes */

  app.get('/', function(req, res){
    res.render('index', {
  	  title: 'XC'
    });
  });

  app.get('/restricted', [restrict, accessLogger], function(req, res){
    res.render('restricted', {
      title: 'Restricted Section'
    });
  });

  app.get('/logout', logout, function(req, res){
    res.redirect('home');
  });

  app.get('/login', function(req, res){
    res.render('login', {
      title: 'XC Login'
    });
  });

  app.post('/login', login, function(req, res){
    res.redirect('home');
  });

  app.get('/registration', function(req, res){
    res.render('registration', {
      title: 'XC Registration'
    });
  });

  app.post('/registration', register, function(req, res){
    res.redirect('back');
  });

  app.get('/users/:user', function(req, res){
    res.render('users', {
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
}