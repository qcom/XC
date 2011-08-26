/* Module Dependencies */

var express = require('express');

var app = module.exports = express.createServer();

require('./environment.js')(app, express);
require('./messages.js')(app);
require('./middleware.js')(app);
require('./router.js')(app);

/* Run App */

app.listen(80);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);