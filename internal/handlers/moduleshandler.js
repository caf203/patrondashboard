const IPCClient = require('../clients/ipcclient')
const getDoc = require('../db/read').getDoc
const updateDoc = require('../db/update').updateDoc
const Eris = require('eris')
const allEvents = [
  'channelCreate',
  'channelUpdate',
  'channelDelete',
  'guildBanAdd',
  'guildBanRemove',
  'guildRoleCreate',
  'guildRoleDelete',
  'guildRoleUpdate',
  'guildUpdate',
  'messageDelete',
  'messageDeleteBulk',
  'messageReactionRemoveAll',
  'messageUpdate',
  'guildMemberAdd',
  'guildMemberKick',
  'guildMemberRemove',
  'guildMemberUpdate',
  'voiceChannelLeave',
  'voiceChannelJoin',
  'voiceStateUpdate',
  'voiceChannelSwitch',
  'guildEmojisUpdate']

module.exports = (req, res) => {
  if (!req.body || !req.body.guildID || isNaN(req.body.guildID)) {
    res.status(400).json({ 'message': 'Malformed Request' })
  } else {
    let valid = true
    let recKeys = Object.keys(req.body)
    recKeys.splice(recKeys.indexOf('guildID'), 1)
    if (!recKeys.length === ++allEvents.length) { // adds one before the if statement evaluates to cover missing guild ID from allEvents array
      res.status(400).json({ 'message': 'Malformed Request' })
    }
    for (let i = 0; i < recKeys.length; i++) {
      if (allEvents.includes(recKeys[i])) {
        continue
      } else {
        valid = false
        break
      }
    }
    if (!req.user.guilds.map(g => g.id).includes(req.body.guildID)) valid = false
    if (valid) {
      let perms = new Eris.Permission(req.user.guilds.find(g => g.id === req.body.guildID).permissions).json
      if (perms['administrator'] || perms['manageGuild'] || perms['manageChannels']) {
        getDoc(req.body.guildID).then((doc) => {
          let disabled = []
          allEvents.forEach((event) => {
            if (!recKeys.includes(event)) {
              disabled.push(event)
            }
          })
          doc.disabledEvents = disabled
          updateDoc(req.body.guildID, { 'disabledEvents': doc.disabledEvents }).then((updResponse) => {
            res.status(200).json({ 'message': 'Successfully saved modules!' })
            IPCClient.recacheBot(req.body.guildID)
          }).catch((e) => {
            console.error(e)
            res.status(500).json({ 'message': 'Uh oh! Something went wrong. Please try again.' })
          })
        })
      } else {
        res.status(403).json({ 'message': 'You don\'t have the required permissions to do that!' })
      }
    } else {
      res.status(400).json({ 'message': 'Unacceptable response body' })
    }
  }
}
