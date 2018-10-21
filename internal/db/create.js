const r = require('../clients/rethink')

function createUserDoc(userID) {
  return new Promise((resolve, reject) => {
    r.db('Logger').table('Users').insert({'id': userID, 'names': []}).run().then((res) => {
      if (res.inserted) {
        resolve(true)
      } else {
        reject(res)
      }
    }).catch(reject)
  })
}

exports.createUserDoc = createUserDoc
