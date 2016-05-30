// Including libraries

var WebSocketServer = require("ws").Server;
var app = require('http').createServer(handler),
	http = require("http")
	static = require('node-static'); // for serving files

var port = process.env.PORT || 5000;

// This will make all the files in the current folder
// accessible from the web
var fileServer = new static.Server('./');

// This is the port for our web server.
// you will need to go to http://localhost:3000 to see it
app.listen(port);

console.log("http server listening on %d", port);

var wss = new WebSocketServer({server: app});
console.log("websocket server created");

// If the URL of the socket server is opened in a browser
function handler (request, response) {

	request.addListener('end', function () {
        fileServer.serve(request, response);
    });

    request.resume();
}

// Send the data to all other clients
wss.broadcast = function broadcast(data, senderId) {
  wss.clients.forEach(function each(client) {
		if (client._socket._handle.fd != senderId) {
			client.send(data);
		}
  });
};

// Listen for incoming connections from clients
wss.on('connection', function (client) {

	console.log('New client');

	// Start listening for mouse move events
	client.on('message', function (data) {

		// This line sends the event (broadcasts it)
		// to everyone except the originating client.
		wss.broadcast(data, client._socket._handle.fd);
	});
});
