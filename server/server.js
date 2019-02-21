// load Node modules
// remeber to install dependencies with 'npm i [dependencies]'
const path = require('path');
const http = require('http');
const publicPath = path.join(__dirname, '../public');
const express = require('express');
const socketIO = require('socket.io');

// Determine the real local IP of this machine to let others connect to it
const os = require('os'); // Access operating system resources

const interfaces = os.networkInterfaces();
const addresses = [];
for (let k in interfaces) {
	for (let k2 in interfaces[k]) {
		let address = interfaces[k][k2];
		if (address.family === 'IPv4' && !address.internal) {
			addresses.push(address.address);
		}
	}
}

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const { generateMessage, generateLocationMessage } = require('./utils/message.js');
const { isRealString } = require('./utils/validation.js');
const { Users } = require('./utils/users.js');
const { log } = require('./utils/log.js')

const users = new Users();

app.use(express.static(publicPath));

io.on('connection', function (socket) {

	console.log('New user connected');

	socket.on('join', (params, callback) => {

		if (!isRealString(params.name) && !isRealString(params.room)) {

			return callback('Name and Room name are required');
		}


		socket.join(params.room)
		users.removeUser(socket.id);
		users.addUser(socket.id, params.name, params.room);

		io.to(params.room).emit('updateUserList', users.getUserList(params.room));

		socket.emit('newMessage', generateMessage('Admin', 'Welcome to the chat App'));

		socket.broadcast.to(params.room).emit('newMessage', generateMessage('Admin', `${params.name} has joined.`));

		callback();
	});

	socket.on('createMessage', (message, callback) =>  {

		var user = users.getUser(socket.id);

		if (user && isRealString(message.text)) {

			io.to(user.room).emit('newMessage', generateMessage(user.name, message.text));
		}

		console.log('New Message', message);
		callback();
	});

	socket.on('createLocationMessage', (coords) => {
		var user = users.getUser(socket.id);
		console.log(user);
		if (user) {
			io.to(user.room).emit('newLocationMessage', generateLocationMessage(user.name, coords.latitude, coords.longitude));
		}

	});

	socket.on('disconnect', () => {

		var user = users.removeUser(socket.id);
		if (user) {

			io.to(user.room).emit('updateUserList', users.getUserList(user.room));
			io.to(user.room).emit('newMessage', generateMessage('Admin', `${user.name} has left the chat room.`));
		}
		console.log('User Disconnected');
	});
});

server.listen(3000, function () {
	log('Hello, CART!', 'blue');
	log(`Connect to http://${addresses[0]}:3000`, 'yellow')
});
