/**
 * Main application file
 */

'use strict';

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var express = require('express'),
    socket = require('./socket.js');

var config = require('./config/environment');
// Setup server
var app = express();

var server = require('http').createServer(app);
require('./config/express')(app);
require('./routes')(app);

// Hook Socket.io into Express
var io = require('socket.io').listen(server);

// Socket.io Communication

io.sockets.on('connection', socket);

// Start server
server.listen(config.port, config.ip, function () {
  console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
});

// Expose app
exports = module.exports = app;
