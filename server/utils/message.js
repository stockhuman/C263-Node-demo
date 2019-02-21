const moment = require('moment')

const message = function (from, text) {
	return {
		from,
		text,
		createdAt: moment.valueOf()
	}
}

// serve up a notice (so and so joined/left server)
const notice = function (text) {
	return {
		from: 'server',
		text,
		createdAt: moment.valueOf()
	}
}

// broadcast one's location
const location = function (from, lat, long) {
	return {
		from,
		url: `https://google.com/maps?q=${lat},${long}`,
		createdAt: moment.valueOf()
	}
}

module.exports = {
	message,
	notice,
	location
}
