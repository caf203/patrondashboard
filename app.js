const express = require('express')
const session = require('express-session')
const cookieParser = require('cookie-parser')
const passport = require('passport')
const app = express()
const path = require('path')
const bodyParser = require('body-parser')
const fs = require('fs')
const Config = require('./config.json')
const redis = require('redis')
const RedisStore = require('connect-redis')(session)
const client = redis.createClient()
const favicon = require('serve-favicon')
const superagent = require('superagent')
const helmet = require('helmet')
const https = require('https')
const serverConfig = require('./internal/handlers/serverconfig')
const saveConfigHandler = require('./internal/handlers/saveconfig')
const saveModulesHandler = require('./internal/handlers/moduleshandler')
const clearLastNames = require('./internal/handlers/clearlastnames')
const IPC = require('./internal/clients/ipcclient')
const Read = require('./internal/db/read')
const Create = require('./internal/db/create')
const Eris = require('eris')

process.title = 'Logger Dashboard'

global.SERVE_REQUESTS = false

if (process.send) {
  console.log('Connected to bot process via IPC.')
} else {
  console.log('Process started without IPC! The dashboard will not function unless it is spawned from the bot')
  process.exit()
}

passport.serializeUser(function (user, done) {
  done(null, user)
})
passport.deserializeUser(function (obj, done) {
  done(null, obj)
})

var Strategy = require('passport-discord').Strategy

passport.use(new Strategy({
  clientID: Config.oauth.clientID,
  clientSecret: Config.oauth.secret,
  callbackURL: Config.callbackURL,
  scope: ['identify', 'guilds']
}, function (accessToken, refreshToken, profile, done) {
  process.nextTick(function () {
    return done(null, profile)
  })
}))

app.use(helmet())
app.use(express.static('static'))
app.use(favicon('./static/images/favicon.ico'))
app.use(cookieParser())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(session({
  secret: Config.session.secret,
    // create new redis store.
  store: new RedisStore({ host: Config.session.host, port: Config.session.port, client: client, ttl: Config.session.ttl }),
  saveUninitialized: false,
  resave: false
}))
app.use(passport.initialize())
app.use(passport.session())
if (Config.core.useSSL) {
  app.use(function (req, res, next) {
    if (!req.secure) {
      return res.redirect(['https://', req.get('Host'), req.url].join(''))
    }
    next()
  }) 
}
app.set('view engine', 'jade')
app.locals.basedir = path.join(__dirname, 'views')

app.use(function (req, res, next) {
  if (!global.SERVE_REQUESTS && req.path !== '/') {
    res.render('booting')
  } else {
    next()
  }
}) 

app.get('/', checkAuth, (req, res) => {
  res.render('authenticated', { user: req.user })
})

app.get('/oauth/login', passport.authenticate('discord', {
  scope: ['identify', 'guilds']
}))

app.get('/oauthfail', (req, res) => {
  if (req.user) {
    res.redirect('/')
  } else {
    res.render('unauthorized', { message: 'Something went wrong while fetching information with OAuth. Did you exclude a scope?' })
  }
})

app.get('/oauth/callback', passport.authenticate('discord', { failureRedirect: '/oauthfail' }),
    function (req, res) {
      superagent
      .post(Config.webhookURL)
      .send({embeds: [{
        title: 'User Logged In',
        description: `${req.user.username}#${req.user.discriminator} (${req.user.id}) logged in.`,
        timestamp: new Date(),
        color: 6918075,
        image: {
          url: req.user.avatar ? `https://cdn.discordapp.com/avatars/${req.user.id}/${req.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${req.user.discriminator % 5}.png`
        }
      }]}).catch(console.error)
      if (!req.user.avatar) {
        req.user.avatarURL = `https://cdn.discordapp.com/embed/avatars/${req.user.discriminator % 5}.png`
      } else if (req.user.avatar.startsWith('a_')) {
        req.user.avatarURL = `https://cdn.discordapp.com/avatars/${req.user.id}/${req.user.avatar}.gif`
      } else {
        req.user.avatarURL = `https://cdn.discordapp.com/avatars/${req.user.id}/${req.user.avatar}.png`
      }
      res.redirect('/')
    })

app.get('/lastnames', checkAuth, (req, res) => {
  Read.getUserDoc(req.user.id).then((doc) => {
    doc.names = doc.names.filter((name, pos) => doc.names.indexOf(name) === pos).reverse().map((n, pos) => `${++pos}: ${n}`)
    res.render('lastnames', { user: req.user, names: doc.names })
  }).catch(() => {
    Create.createUserDoc(req.user.id).then(() => {
      res.render('lastnames', { user: req.user, names: [] })
    }).catch((e) => {
      console.error(e)
      res.render('error', { 'message': 'Something happened while fetching your last names! Please let James Bond#0007 know.' })
    })
  })
})

app.get('/serverselector', checkAuth, (req, res) => {
  let guilds = []
  req.user.guilds.forEach((guild) => {
    if (guild.owner || new Eris.Permission(guild.permissions).json['manageGuild']) {
      guilds.push({
        name: guild.name,
        id: guild.id,
        owner: guild.owner && 'You',
        iconURL: guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=256` : 'https://s15.postimg.cc/nke6jbnyz/redcircle.png'
      })
    }
  })
  res.render('serverselector', { user: req.user, guilds: guilds.length !== 0 ? guilds : ['None'] })
})

app.get('/logout', (req, res) => {
  req.logout()
  res.render('logout')
})

app.get('/configure/:id', checkAuth, (req, res) => {
  if (!req.params.id) {
    res.render('error', { message: 'That server doesn\'t exist!' })
  } else {
    serverConfig(req, res)
  }
})

app.post('/savechannels', checkAuth, (req, res) => {
  saveConfigHandler(req, res)
})

app.post('/savemodules', checkAuth, (req, res) => {
  saveModulesHandler(req, res)
})

app.post('/clearlastnames', checkAuth, (req, res) => {
  clearLastNames(req.user.id).then(() => {
    res.status(200).json({'message': 'Successfully cleared saved names.'})
  }).catch((e) => {
    console.error(e)
    res.status(500).json({'message': 'Something went wrong while clearing saved names.'})
  })
})

app.get('*', function (req, res) {
  res.render('error', {message: 'Page not found.'})
})

function checkAuth (req, res, next) {
  if (req.isAuthenticated()) return next()
  res.redirect('/oauth/login')
}

if (Config.core.useSSL) {
  https.createServer({
    key: fs.readFileSync('ssl/key.pem'),
    cert: fs.readFileSync('ssl/cert.pem')
  }, app).listen(Config.core.port, function (err) {
    if (err) return console.log(err)
    console.log('Logger Dashboard listening at https://whatezlife.com/', Config.core.port)
  })
} else {
  app.listen(Config.core.port, function (err) {
    if (err) return console.error(err)
    console.log('Dashboard running without ssl')
  })
}
