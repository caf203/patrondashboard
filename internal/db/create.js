const pool = require('../clients/postgres')
const aes = require('../clients/aes')
let arr = []
arr[0] = 'placeholder'
arr = JSON.stringify(arr)
const placeholder = aes.encrypt(arr)

async function createUserDoc(userID) {
  console.log(`Creating a user document for ${userID}`)
  try {
    await pool.query('INSERT INTO users (id, names) VALUES ($1, $2)', [userID, placeholder])
    return true
  } catch (e) {
    return e
  }
}

exports.createUserDoc = createUserDoc
