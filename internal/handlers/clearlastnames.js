const updateUserDoc = require('../db/update').updateUserDoc

module.exports = function(userID) {
  return new Promise((resolve, reject) => {
    updateUserDoc(userID, null).then(() => {
      resolve()
    }).catch(reject)
  })
}