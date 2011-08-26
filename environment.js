module.exports = function(app, express){
  /* Configure */

  // Stylus Compiler
  function compile(str, path){
    return stylus(str)
      .set('filename', path)
      .set('compress', true)
      .use(nib());
  }

  // App Settings
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
}