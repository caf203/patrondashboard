const pool = require('../clients/postgres')
const aes = require('../clients/aes')

async function getDoc (guildID) {
  const doc = await pool.query('SELECT * FROM guilds WHERE id=$1;', [guildID])
  if (doc.rows.length === 0) return null
  return doc.rows[0]
}

async function getUserDoc(userID) {
  const doc = await pool.query('SELECT * FROM users WHERE id=$1', [userID])
  if (doc.rows.length === 0) return null
  const decryptedDoc = await decryptUserDoc(doc.rows[0])
  return decryptedDoc
}

async function decryptUserDoc (userDoc) {
  userDoc.names = JSON.parse(aes.decrypt(userDoc.names))
  return userDoc
}
exports.getUserDoc = getUserDoc
exports.getDoc = getDoc
