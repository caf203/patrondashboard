const updateUserDoc = require('../db/update').updateUserDoc

module.exports = function(userID) {
  return new Promise((resolve, reject) => {
    updateUserDoc(userID, {names: []}).then(() => {
      resolve()
    }).catch(reject)
  })
}