const pool = require('../clients/postgres')
const aes = require('../clients/aes')
const getDoc = require('./read').getDoc
const expectedKeys = ['guildID', 'all', 'mod', 'server', 'voice', 'messages', 'joinlog']
let feeds = ['joinlog', 'mod', 'server', 'voice', 'messages']

async function updateUserDoc (userID, toUpdate) {
  const doc = await getUser(userID)
  doc.names.push(toUpdate)
  if (toUpdate === null) doc.names = []
  doc.names = aes.encrypt(JSON.stringify(doc.names))
  return await pool.query('UPDATE users SET names=$1 WHERE id=$2', [doc.names, userID])
}

async function updateEventLogs (guildID, eventLogs) {
  const doc = await getDoc(guildID)
  doc.event_logs = eventLogs
  return await pool.query('UPDATE guilds SET event_logs=$1 WHERE id=$2', [eventLogs, guildID])
}

async function updateDisabledEvents (guildID, disabledEvents) {
  const doc = await getDoc(guildID)
  doc.disabled_events = disabledEvents
  return await pool.query('UPDATE guilds SET disabled_events=$1 WHERE id=$2', [disabledEvents, guildID])
}

exports.updateDisabledEvents = updateDisabledEvents
exports.updateEventLogs = updateEventLogs
exports.updateUserDoc = updateUserDoc
