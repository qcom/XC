module.exports = function(app){
  var handlers = require('handlers.js');

  /* Routes */

  app.get('/', function(req, res){
    res.render('index', {
  	  title: 'XC'
    });
  });

  app.get('/restricted', [handlers.restrict, accessLogger], function(req, res){
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