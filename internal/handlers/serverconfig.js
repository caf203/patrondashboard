const IPCClient = require('../clients/ipcclient')
const getDoc = require('../db/read').getDoc
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
  'guildMemberRemove',
  'guildMemberUpdate',
  'voiceChannelLeave',
  'voiceChannelJoin',
  'voiceChannelSwitch',
  'guildEmojisUpdate' ]

module.exports = (req, res) => {
  let guilds = req.user.guilds.slice()
  if (isNaN(req.params.id)) {
    res.redirect('/')
  } else {
    IPCClient.getEditableGuilds(req.user.guilds, req.user.id).then((guilds) => {
      if (guilds.map(g => g.id).includes(req.params.id)) {
        getDoc(req.params.id).then((doc) => {
          let eventInfo = {}
          let expectedLength = Object.keys(doc.feeds)
          selectedChannels = {}
          if (doc.logchannel) {
            IPCClient.getChannel(doc.logchannel).then((channel) => {
              selectedChannels['all'] = {
                id: channel.id,
                name: channel.name
              }
            })
          } else {
            selectedChannels['all'] = {
              id: '',
              name: ''
            }
          }
          Object.keys(doc.feeds).forEach((key) => {
            if (doc.feeds[key].channelID) {
              IPCClient.getChannel(doc.feeds[key].channelID).then((channel) => {
                selectedChannels[key] = {
                  id: channel.id,
                  name: channel.name
                }
              }).catch((e) => {
                console.error(e)
                selectedChannels[key] = {
                  id: doc.feeds[key].channelID
                }
              })
            }
          })
          allEvents.forEach((event) => {
            if (doc.disabledEvents.includes(event)) {
              eventInfo[event] = {
                disabled: true,
                name: event
              }
            } else {
              eventInfo[event] = {
                disabled: false,
                name: event
              }
            }
          })
          IPCClient.getAccessableChannels(req.params.id, req.user.id).then((channels) => {
            IPCClient.getServer(req.params.id).then((guild) => {
              res.render('configure', { channels: channels, guildID: req.params.id, selectedChannels: selectedChannels, user: req.user, guildName: guild.name, allEvents: allEvents, toggledEvents: eventInfo })
            }).catch((e) => {
              console.error(e)
              res.render('error', { message: 'Error fetching that server!' })
            })
          }).catch((e) => {
            console.error(e)
            res.render('error', { message: 'Error fetching channels that I can log to!' })
          })
        })
      } else {
        res.render('unauthorized', { message: 'You don\'t have the required permissions to edit this server.' })
      }
    }).catch((e) => {
      res.render('error', { message: 'Something borked while checking backend edit stuff, sorry. Might want to let Piero#2048 know.' })
    })
  }
}
