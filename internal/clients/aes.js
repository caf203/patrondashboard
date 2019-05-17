const Config = require('../../config.json')

const AES = require('aes256')
const cipher = AES.createCipher(Config.database.aesKey)

module.exports = cipher
