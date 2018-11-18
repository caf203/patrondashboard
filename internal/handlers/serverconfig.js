const IPCClient = require('../clients/ipcclient')
const getDoc = require('../db/read').getDoc
const REST = require('../clients/restclient')
const Eris = require('eris')

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
  'guildEmojisUpdate': 'When an emoji gets uploaded, deleted, or updated.'
}

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
  let guilds = []
  req.user.guilds.forEach((guild) => {
    let perms = new Eris.Permission(guild.permissions).json
    if (guild.owner || perms['manageGuild'] || perms['manageChannels']) {
      guilds.push({
        name: guild.name,
        id: guild.id,
        owner: guild.owner && 'You',
        iconURL: guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=256` : 'https://s15.postimg.cc/nke6jbnyz/redcircle.png'
      })
    }
  })
  if (guilds.map(g => g.id).includes(req.params.id)) {
    getDoc(req.params.id).then((doc) => {
      REST.getChannels(req.params.id).then((channels) => {
        channels = channels.filter(c => c.type === 0)
        let eventInfo = {}
        let expectedLength = Object.keys(doc.feeds)
        selectedChannels = {}
        if (doc.logchannel) {
          let channel = channels.find(c => c.id === doc.logchannel)
          selectedChannels['all'] = {
            id: channel.id,
            name: channel.name
          }
        } else {
          selectedChannels['all'] = {
            id: '',
            name: ''
          }
        }
        Object.keys(doc.feeds).forEach((key) => {
          if (doc.feeds[key].channelID) {
            let channel = channels.find(c => c.id === doc.feeds[key].channelID)
            selectedChannels[key] = {
              id: channel.id,
              name: channel.name
            }
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
        res.render('configure', { channels: channels, guildID: req.params.id, selectedChannels: selectedChannels, user: req.user, guildName: guilds.find(g => g.id === req.params.id).name, allEvents: allEvents, toggledEvents: eventInfo })
      }).catch(() => {
        console.log('FORBIDDEN WHY IS THIS SHOWING')
        res.render('unauthorized', { message: 'I cannot see this server!' })
      })
    })
  } else {
    res.render('unauthorized', { message: 'You don\'t have the required permissions to edit this server.' })
  }
}
