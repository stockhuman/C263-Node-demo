// load Node modules
// remeber to install dependencies with 'npm i [dependencies]'
const path = require('path')
const http = require('http')
const publicPath = path.join(__dirname, '../public')
const express = require('express')
const socketIO = require('socket.io')

// Determine the real local IP of this machine to let others connect to it
const os = require('os') // Access operating system resources

// Begin setting up our server
const app = express()
const server = http.createServer(app)
const io = socketIO(server)

// load utility functions from our /utils folder
const {
	message,
	notice,
	location
} = require('./utils/message.js')
const { isRealString } = require('./utils/validation.js')
const { Users } = require('./utils/users.js')
const { log } = require('./utils/log.js')

// Create our users class
const users = new Users()

// Boilerplate linking things up
app.use(express.static(publicPath))


// When we get a new connection...
io.on('connection', function (socket) {
	log('New user connected', 'user')

	// when a user joins...
	socket.on('join', function (params, callback) {

		// have they given us a real (and valid) name and room?
		if (
			!isRealString(params.name)
			&& !isRealString(params.room)
		) {
			// if they have not, don't bother exceuting the rest of this fn.
			log('Joining failed', 'error')
			return callback('Name and Room name are required')
		}

		socket.join(params.room)
		users.removeUser(socket.id) // remove the temporary user created with just an ID
		users.addUser(socket.id, params.name, params.room) // and replace them with a named one!

		// Update list of active users on the side
		io.to(params.room).emit('updateUserList', users.getUserList(params.room))

		socket.emit('newMessage',
			message('Server', 'Welcome to the chat App')
		)

		socket.broadcast.to(params.room).emit('newNotice',
			notice(`${params.name} has joined the chat`)
		)

		callback()
	})

	// When a user sends a new message
	socket.on('createMessage', function (msg, callback) {
		let user = users.getUser(socket.id)

		if (user && isRealString(msg.text)) {
			io.to(user.room).emit('newMessage', message(user.name, msg.text))
		}

		log(`${user.name} sent a message`, 'message')
		callback()
	})

	// When a user shares their location
	socket.on('createLocationMessage', function (coords) {
		let user = users.getUser(socket.id)
		log(user)
		if (user) {
			io.to(user.room).emit('newLocationMessage', location(user.name, coords.latitude, coords.longitude))
		}
	})

	// When a user leaves
	socket.on('disconnect', function () {
		let user = users.removeUser(socket.id)
		if (user) {
			io.to(user.room).emit('updateUserList', users.getUserList(user.room))
			io.to(user.room).emit('newMessage', notice(`${user.name} has left the chat.`))
			log(`${user.name} Disconnected`, 'orange')
		}
	})
})

server.listen(3000, function () {
	const interfaces = os.networkInterfaces()
	const addresses = []
	for (let k in interfaces) {
		for (let k2 in interfaces[k]) {
			let address = interfaces[k][k2]
			if (address.family === 'IPv4' && !address.internal) {
				addresses.push(address.address)
			}
		}
	}

	log('Hello, CART!', 'blue')
	log(`Connect to => http://${addresses[0]}:3000 <=`, 'yellow')
})
