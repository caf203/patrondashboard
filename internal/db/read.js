const r = require('../clients/rethink')

function getDoc (guildID) {
  return new Promise((resolve, reject) => {
    r.db('Logger').table('Guilds').get(guildID).run().then((doc) => {
      resolve(doc) // doc or null
    }).catch(reject)
  })
}

exports.getDoc = getDoc
