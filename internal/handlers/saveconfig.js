const IPCClient = require('../clients/ipcclient')
const getDoc = require('../db/read').getDoc
const updateDoc = require('../db/update').updateDoc
const clearAndSaveType = require('../db/update').clearAndSaveType

module.exports = (req, res) => {
  if (Object.keys(req.body).length !== 0) {
    IPCClient.getEditableGuilds(req.user.guilds, req.user.id).then((guilds) => {
      if (guilds.map(g => g.id).includes(req.body.guildID)) {
        getDoc(req.body.guildID).then((doc) => {
          clearAndSaveType(req.body, doc).then(() => {
            IPCClient.recacheBot(req.body.guildID).then(() => {
              res.status(200).json({'message': `Your response has been successfully submitted.`})
            }).catch((e) => {
              console.error(e)
              res.status(500).json({'message': `Timeout while waiting for a response, is the bot running?`})
            })
          }).catch((e) => {
            console.error(e)
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
    })
  } else {
    res.status(400).json({'message': 'Malformed request'})
  }
}
