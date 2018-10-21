const sa = require('superagent')
const config = require('../../config.json')

exports.getChannels = function(guildID) {
  return new Promise((resolve, reject) => {
    sa
    .get(`https://discordapp.com/api/v7/guilds/${guildID}/channels`)
    .set('Authorization', `Bot ${config.core.botToken}`)
    .then((r, e) => {
      if (e) {
        console.error(e)
        reject(e)
      } else resolve(r.body)
    })
  })
}

exports.getGuild = function(guildID) {
  return new Promise((resolve, reject) => {
    sa
    .get(`https://discordapp.com/api/v7/guilds/${guildID}`)
    .set('Authorization', `Bot ${config.core.botToken}`)
    .then((r, e) => {
      if (e) {
        console.error(e)
        reject(e)
      } else resolve(r.body)
    })
  })
}