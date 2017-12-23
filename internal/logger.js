const Winston = require('winston')
const moment = require('moment')

module.exports = new (Winston.Logger)({
  transports: [
    new (Winston.transports.Console)({
      timestamp: () => {
        return moment().format('YYYY-MM-DD hh:mm:ss')
      },
      colorize: true,
      level: 'verbose',
      humanReadableUnhandledException: true,
      json: false
    })
  ],
  exitOnError: true
})
