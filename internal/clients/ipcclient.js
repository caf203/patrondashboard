const logger = require('../logger')

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

  getEditableGuilds(guilds, userID) {
    return new Promise((resolve, reject) => {
      process.send(JSON.stringify({
        'op': 'GET_EDITABLE_GUILDS',
        'c': guilds,
        'id': userID
      }))
      waitFor('GET_EDITABLE_GUILDS_RESPONSE', userID).then(resolve).catch(reject)
    })
  }

  getAccessableChannels(guildID, userID) {
    return new Promise((resolve, reject) => {
      process.send(JSON.stringify({
        'op': 'GET_ACCESSABLE_CHANNELS',
        'c': guildID,
        'id': userID
      }))
      waitFor('GET_ACCESSABLE_CHANNELS_RESPONSE', userID).then(resolve).catch(reject)
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

process.on('message', (m) => {
  try {
    m = JSON.parse(m)
  } catch (_) { }
  if (m.op === 'HEARTBEAT') {
    m.c.forEach((shard) => {
      if (shard.ready !== true) {
        console.log(`Shard ${shard.shardID} returned an unacceptable ready state, halting requests.`)
        global.SERVE_REQUESTS = false
      }
      if (!global.SERVE_REQUESTS) {
        if (m.c.filter(shard => !shard.ready).length === 0) {
          console.log('---------------------------------------------------------------------------------------Dashboard now resuming request serving.')
          global.SERVE_REQUESTS = true
        }
      }
    })
  }
})

const validOps = ['GUILD_FETCH_RESPONSE', 'CHANNEL_FETCH_RESPONSE', 'GET_LASTNAMES_RESPONSE', 'TEST_MESSAGE', 'GET_USER_RESPONSE', 'GET_LASTNAMES_RESPONSE', 'GET_EDITABLE_GUILDS_RESPONSE', 'GET_ACCESSABLE_CHANNELS_RESPONSE', 'RECACHE_REDIS_RESPONSE', 'GET_USER_PERMS_GUILD_RESPONSE']

function waitFor(op, id) {
  return new Promise((resolve, reject) => {
    process.on('message', function wait(m) {
      try {
        m = JSON.parse(m)
      } catch (e) {
        logger.error('Invalid packet received from shard manager!', e)
      }
      if (validOps.includes(m.op)) {
        let timeout = setTimeout(() => {
          reject('Timeout') // eslint-disable-line
          process.removeListener('message', wait)
        }, 10000)
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
