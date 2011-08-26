var crypto = require('crypto');

/* Authentication */

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

exports.generateSalt = generateSalt;
exports.hash = hash;