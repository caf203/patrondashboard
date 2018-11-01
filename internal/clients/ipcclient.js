const logger = require('../logger')
const REST = require('./restclient')

class IPCClient {
  getServer(id) {
    return new Promise((resolve, reject) => {
      process.send(JSON.stringify({
        'op': 'GUILD_FETCH',
        'id': id
      }))
      waitFor('GUILD_FETCH_RESPONSE', id).then(resolve).catch(reject)
    })
  }

  getChannel(id) {
    return new Promise((resolve, reject) => {
      process.send(JSON.stringify({
        'op': 'CHANNEL_FETCH',
        'id': id
      }))
      waitFor('CHANNEL_FETCH_RESPONSE', id).then(resolve).catch(reject)
    })
  }

  getLastNames(id) {
    return new Promise((resolve, reject) => {
      process.send(JSON.stringify({
        'op': 'GET_LASTNAMES',
        'id': id
      }))
      waitFor('GET_LASTNAMES_RESPONSE', id).then(resolve).catch(reject)
    })
  }

  getUser(id) {
    return new Promise((resolve, reject) => {
      process.send(JSON.stringify({
        'op': 'GET_USER',
        'id': id
      }))
      waitFor('GET_USER_RESPONSE').then(resolve).catch(reject)
    })
  }

  getUserPerms(guildID, userID) {
    return new Promise((resolve, reject) => {
      process.send(JSON.stringify({
        'op': 'GET_USER_PERMS_GUILD',
        'id': guildID,
        'userID': userID
      }))
      waitFor('GET_USER_PERMS_GUILD_RESPONSE', guildID).then(resolve).catch(reject)
    })
  }

  getAccessableChannels(guildID, userID) { // EDIT: This will not query the bot asking for accessable channels. Instead, it will send a GET request to the guild/channels endpoint.
    return new Promise((resolve, reject) => {
      REST.getChannels(guildID).then(resolve).catch(reject)
    })
  }

  recacheBot(guildID) {
    return new Promise((resolve, reject) => {
      process.send(JSON.stringify({
        'op': 'RECACHE_REDIS',
        'id': guildID
      }))
      waitFor('RECACHE_REDIS_RESPONSE', guildID).then(resolve).catch(reject)
    })
  }
}

const validOps = ['GUILD_FETCH_RESPONSE', 'CHANNEL_FETCH_RESPONSE', 'GET_LASTNAMES_RESPONSE', 'TEST_MESSAGE', 'GET_USER_RESPONSE', 'GET_LASTNAMES_RESPONSE', 'GET_EDITABLE_GUILDS_RESPONSE', 'GET_ACCESSABLE_CHANNELS_RESPONSE', 'RECACHE_REDIS_RESPONSE', 'GET_USER_PERMS_GUILD_RESPONSE']

function waitFor(op, id) {
  return new Promise((resolve, reject) => {
    process.on('message', function wait(m) {
      try {
        m = JSON.parse(m)
      } catch (e) {
        logger.error('Invalid packet received from shard manager!', e)
      }
      console.log(m)
      let timeout = setTimeout(() => {
        reject('Timeout') // eslint-disable-line
        console.error('timed out on ', op, id)
        process.removeListener('message', wait)
      }, 10000)
      if (validOps.includes(m.op) && m.op === op) {
        console.log(`Hey, the dashboard returned ${m.c ? m.c.name : 'nothing'} from the requested ID of ${m.requestedID}`)
        if (m.requestedID === id) {
          resolve(m.c) // resolve the parsed message content
          process.removeListener('message', wait)
          clearTimeout(timeout)
        }
      }
    })
  })
}

module.exports = new IPCClient()
