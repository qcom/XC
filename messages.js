module.exports = function(app){
  /* Message Helpers */

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
}