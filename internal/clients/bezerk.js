const Config = require('../../config.json')
const uri = Config.bezerk.uri
const secret = Config.bezerk.secret
const WS = require('ws')

let socket

const responses = {}

function start() {
  console.log(`Bezerk connection started to ${uri}`)
  socket = new WS(uri)
  socket.on('error', e => {
    console.error(`Bezerk socket error, ${e.message}`)
  })
  socket.on('close', () => {
    console.warn('Bezerk socket got destroyed, reconnecting...')
    setTimeout(start, 500)
  })
  socket.on('message', m => {
    let msg
    try {
      msg = JSON.parse(m)
    } catch (e) {
      return console.error('Failed to decrypt Bezerk payload, ' + e.message)
    }
    if (!msg.uuid && msg.op !== '1001' && msg.op !== '1002') {
      console.error('Message did not have an unique identifier!', msg)
      return
    }
    switch (msg.op) {
      case '1001': { // IDENTIFY
        return send({
          op: '1003', // IDENTIFY_SUPPLY
          c: {
            secret: secret
          }
        })
      }
      case '1002': { // IDENTIFY_REPLY
        if (msg.c.success === true) {
          console.log(`Bezerk connection fully open.`)
          console.log('Successfully connected to Bezerk.')
        } else {
          console.warn('Bezerk rejected authentication! Not reconnecting.')
        }
        break
      }
      case '2002': {
        if (!responses[msg.uuid]) responses[msg.uuid] = [msg]
        else responses[msg.uuid].push(msg)
        break
      }
      case '2001': { // REQUEST
        // const bot = global.bot // eslint-disable-line
        // try {
        //   const resp = eval(msg.c) // eslint-disable-line no-eval
        //   global.logger.trace(resp)
        //   send({
        //     op: '2002', // REQUEST_REPLY
        //     c: resp
        //   })
        // } catch (e) {
        //   global.logger.debug(e)
        //   send({
        //     op: '5000', // CANNOT_COMPLY
        //     c: e.message
        //   })
        // }
      }
    }
  })
}

async function send(payload) {
  return new Promise((resolve, reject) => {
    const id = uuidv4()
    payload.uuid = id
    if (typeof payload === 'object') payload = JSON.stringify(payload)
    socket.send(payload)
    setTimeout(() => {
      resolve(responses[id])
    }, 1000)
  })
}

if (uri && secret) start()

exports.send = send

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}
