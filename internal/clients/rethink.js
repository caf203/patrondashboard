const Dash = require('rethinkdbdash')
const Logger = require('../logger')
let Config
try {
  Config = require('../../config.json')
} catch (e) {
  Logger.error('An error has occurred while requiring the configuration file, make sure it exists!', e)
}
module.exports = new Dash({
  user: Config.database.user,
  password: Config.database.pass,
  silent: true,
  servers: [{
    host: Config.database.host,
    port: Config.database.port
  }]
})
