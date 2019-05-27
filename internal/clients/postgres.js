const Config = require('../../config.json')
const { Client, Pool } = require('pg') // PREREQUISITE: Have postgres installed and your user can connect

const pool = new Pool({
  user: Config.database.user,
  host: Config.database.host,
  database: 'loggerpatreon',
  password: Config.database.password,
  port: 5432
})

pool.on('error', (e) => {
  console.error('Postgres error', e)
})

module.exports = pool
