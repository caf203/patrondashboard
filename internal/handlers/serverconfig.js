const IPCClient = require('../clients/ipcclient')
const getDoc = require('../db/read').getDoc

let eventTooltips = {
  'channelCreate': 'When a channel is created.',
  'channelUpdate': 'When a channel property (name, overrides) is updated.',
  'channelDelete': 'When a channel is deleted.',
  'guildBanAdd': 'When a guild member gets banned.',
  'guildBanRemove': 'When a guild member gets unbanned.',
  'guildRoleCreate': 'When a role is created.',
  'guildRoleDelete': 'When a role is deleted.',
  'guildRoleUpdate': 'When a role is updated (permissions).',
  'guildUpdate': 'When a guild property is updated (name, afk channel, welcome channel, etc).',
  'messageDelete': 'When a text message in a non-ignored channel is deleted.',
  'messageDeleteBulk': 'When a message purge happens (on ban, some modbots).',
  'messageReactionRemoveAll': 'When someone removes all reactions from a cached message.',
  'messageUpdate': 'When a message is edited.',
  'guildMemberAdd': 'When a member joins the guild.',
  'guildMemberKick': 'When a member is kicked from the guild.',
  'guildMemberRemove': 'When a member leaves by their own choice.',
  'guildMemberUpdate': 'When a member is updated (roles, nickname).',
  'voiceChannelLeave': 'When a member leaves a voice channel.',
  'voiceChannelJoin': 'When a member joins a voice channel.',
  'voiceStateUpdate': 'When a member in a voice channel is muted or deafened by another guild member.',
  'voiceChannelSwitch': 'When a member moves from one voice channel to another.',
  'guildEmojisUpdate': 'When an emoji gets uploaded, deleted, or updated.' }

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
              }).catch(() => {
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
                name: event,
                tooltip: eventTooltips[event]
              }
            } else {
              eventInfo[event] = {
                disabled: false,
                name: event,
                tooltip: eventTooltips[event]
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
