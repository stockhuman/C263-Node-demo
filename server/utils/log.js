// this little module adds some color to our console messages,
// find the documentation for this library here:
// https://github.com/chalk/chalk

const chalk = require('chalk')

const log = function (text, type) {

	if (type) { // if we've passed a type at all
		let decoration

		switch (type) {
			case 'system': // system messages
				decoration = chalk.keyword('orange'); break
			case 'user': // new user
				decoration = chalk.green; break
			case 'error': // new user
				decoration = chalk.red.bold; break
			default: // unrecognised but defined
				// try to see if it corresponds to a chalk method, else gray
				decoration = chalk[type] || chalk.gray; break
		}

		console.log(decoration(text))

	} else { // else just print out text
		console.log(text)
	}

}

module.exports = { log }
