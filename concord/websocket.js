const WebSocket = require('ws'); 
const wss = new WebSocket.Server({ port: 8080 });
let webSocket = undefined;

const send = data => {
	if (webSocket) {
		webSocket.send(JSON.stringify(data));
	}
};

wss.on('connection', ws => {
	webSocket = ws;sers
});	

exports.send = send;
