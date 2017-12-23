const r = require('../clients/rethink')
const getDoc = require('./read').getDoc
const expectedKeys = ['guildID', 'all', 'mod', 'server', 'voice', 'messages', 'joinlog']
let feeds = ['joinlog', 'mod', 'server', 'voice', 'messages']

function updateDoc (guildID, toUpdate) {
  return new Promise((resolve, reject) => {
    r.db('Logger').table('Guilds').get(guildID).update(toUpdate).run().then((doc) => {
      resolve(doc) // changes
    }).catch(reject)
  })
}

function clearAndSaveType (body, doc) {
  return new Promise((resolve, reject) => {
    let recKeys = Object.keys(body)
    let valid = true
    for (let i = 0; i < expectedKeys.length; i++) {
      if (expectedKeys[i] === recKeys[i]) {
        continue
      } else {
        console.log('IT ALL WENT WRONG WITH', expectedKeys[i], recKeys[i]) // yes this is on purpose
        valid = false
        break
      }
    }
    if (valid) {
      let feedCopy = feeds.slice()
      if (doc.logchannel && feedCopy.map(k => body[k]).join('')) {
        reject({
          message: 'You cannot log to any other channel when you\'re already logging all events to one.'
        })
      } else if (body.all && Object.keys(doc.feeds).map(k => doc.feeds[k].channelID).join('')) {
        reject({
          message: 'You cannot log all events to a channel when you\'re already logging to a different channel!'
        })
      } else {
        feedCopy.push('all')
        feedCopy.forEach((key) => {
          setByType(body.guildID, key, body[key], doc).then(resolve).catch(reject)
        })
      }
    } else {
      reject({
        message: 'Malformed request'
      })
    }
  })
}

function setByType (guildID, type, value, doc) {
  return new Promise((resolve, reject) => {
    if (type === 'all') {
      updateDoc(guildID, { 'logchannel': value }).then((resp) => {
        resolve()
      }).catch((e) => {
        console.error(e)
        reject(e)
      })
    } else {
      doc.feeds[type] = {
        channelID: value
      }
      updateDoc(guildID, { 'feeds': doc.feeds }).then((resp) => {
        resolve()
      }).catch((e) => {
        console.error(e)
        reject(e)
      })
    }
  })
}

exports.clearAndSaveType = clearAndSaveType
exports.updateDoc = updateDoc
