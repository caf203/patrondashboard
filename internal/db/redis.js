const redis = require('../clients/redis')
const r = require('../clients/rethink')

function loadToRedis(guildID) {
  r.db('Logger').table('Guilds').get(guildID).run().then((doc) => {
    if (doc) {
      redis.set(`${guildID}:ignoredChannels`, doc.ignoredChannels.toString())
      redis.set(`${guildID}:disabledEvents`, doc.disabledEvents.toString())
      redis.del(`${guildID}:logchannel`)
      redis.set(`${guildID}:logchannel`, doc.logchannel.toString())
      redis.set(`${guildID}:feeds`, JSON.stringify(doc.feeds))
    }
  })
}

exports.loadToRedis = loadToRedis