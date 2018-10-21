const r = require('../clients/rethink')

function getDoc (guildID) {
  return new Promise((resolve, reject) => {
    r.db('Logger').table('Guilds').get(guildID).run().then((doc) => {
      resolve(doc) // doc or null
    }).catch(reject)
  })
}

function getUserDoc(userID) {
  return new Promise((resolve, reject) => {
    r.db('Logger').table('Users').get(userID).run().then((uDoc) => {
      resolve(uDoc)
    }).catch(reject)
  })
}

exports.getUserDoc = getUserDoc
exports.getDoc = getDoc
