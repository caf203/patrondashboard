const IPCClient = require('../clients/ipcclient')
const getDoc = require('../db/read').getDoc
const updateDoc = require('../db/update').updateDoc
const clearAndSaveType = require('../db/update').clearAndSaveType
const updateChannelConfig = require('../db/update').updateChannelConfig
const Eris = require('eris')

module.exports = (req, res) => {
  if (Object.keys(req.body).length !== 0) {
    let guilds = []
    req.user.guilds.forEach((guild) => {
      let perm = new Eris.Permission(guild.permissions).json
      if (guild.owner || perm['manageGuild'] || perm['manageChannels']) {
        guilds.push({
          name: guild.name,
          id: guild.id,
          owner: guild.owner && 'You',
          iconURL: guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=256` : 'https://s15.postimg.cc/nke6jbnyz/redcircle.png'
        })
      }
    })
      if (guilds.map(g => g.id).includes(req.body.guildID)) {
        getDoc(req.body.guildID).then((doc) => {
          updateChannelConfig(req.body, doc).then(() => {
            IPCClient.recacheBot(req.body.guildID).then(() => {
              res.status(200).json({'message': `Your response has been successfully submitted.`})
            }).catch((e) => {
              res.status(500).json({'message': `Timeout while waiting for a response, is the bot running?`})
            })
          }).catch(() => {
            if (e.message) {
              res.status(400).json({'message': e.message})
            } else {
              res.status(500).json({'message': `Something went wrong while saving the selected log channel.`})
            }
          })
        })
      } else {
        res.status(403).json({'message': 'You can\'t edit that server!'})
      }
  } else {
    res.status(400).json({'message': 'Malformed request'})
  }
}
