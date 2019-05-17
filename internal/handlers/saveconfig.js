const Bezerk = require('../clients/bezerk')
const updateEventLogs = require('../db/update').updateEventLogs
const getDoc = require('../db/read').getDoc
const Eris = require('eris')

module.exports = (req, res) => {
  if (Object.keys(req.body).length !== 0) {
    let guilds = []
    req.user.guilds.forEach(async (guild) => {
      let perm = new Eris.Permission(guild.permissions).json
      if (guild.owner || perm['manageGuild'] || perm['manageChannels']) {
        const responses = await Bezerk.send({
          op: '2005',
          c: `bot.guilds.get('${guild.id}').name`
        })
        if (responses && responses.length !== 0) {
        guilds.push({
          name: guild.name,
          id: guild.id,
          owner: guild.owner && 'You',
          iconURL: guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=256` : 'https://s15.postimg.cc/nke6jbnyz/redcircle.png'
        })
      }
      }
    })
    setTimeout(() => {
      if (guilds.map(g => g.id).includes(req.body.guildID)) {
        getDoc(req.body.guildID).then((doc) => {
          delete req.body.guildID
          updateEventLogs(doc.id, req.body).then(() => {
            res.status(200).json({'message': `Your response has been successfully submitted.`})
            Bezerk.send({
              op: '2005',
              c: `recache ${doc.id}`
            })
            // loadToRedis(req.body.guildID)
          }).catch((e) => {
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
    }, 1000)
  } else {
    res.status(400).json({'message': 'Malformed request'})
  }
}
