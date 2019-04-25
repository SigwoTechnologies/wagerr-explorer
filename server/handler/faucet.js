var redis = require('redis')
const {promisify} = require('util')
const config = require('../../config')
const RpcClient = require('wagerrd-rpc')
const rpc = new RpcClient({
  user: config.rpc.user,
  pass: config.rpc.pass,
  host: config.rpc.host,
  port: config.rpc.port
})
// set constants
var waitTime = config.faucet.wait_time // time in seconds until app refreshes ip limits
var percent = config.faucet.percent
// config redis
var redisClient = redis.createClient({
  host: `${config.redis.host}`
})
redisClient.on('error', function (err) {
  console.log('Error: ' + err)
})
const getAsync = promisify(redisClient.get).bind(redisClient)
const setAsync = promisify(redisClient.set).bind(redisClient)
const expireAsync = promisify(redisClient.expire).bind(redisClient)
const decrbyAsync = promisify(redisClient.decrby).bind(redisClient)

// 2% of current balance
async function getMaxWithdrawal () {
  var PERCENTAGE_OF_BAL = percent
  const balance = (await rpc.getbalance('*', 1)).result
  console.log(balance)
  return (Math.min(config.faucet.limit, Math.floor(balance * PERCENTAGE_OF_BAL)))
}

// returns limit for IP from redis
async function getSavedLimit (ip) {
  const result = await getAsync(ip)
  if (result) {
    console.log('limit in redis', result)
    return result
  } else {
    // we could connect to redis and make the query
    // set the limit and return it
    const max = await getMaxWithdrawal()
    console.log('default limit', max)
    const result = await setAsync(ip, max)
    await expireAsync(ip, waitTime)
    return max
  }
}

let getClientIp = function (req) {
  const reqIp = req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress || ''
  let ip = reqIp.match(/\d+.\d+.\d+.\d+/)
  ip = ip ? ip.join('.') : null
  return ip
}

async function donate (req, res) {
  var addr = req.query.address
  var sat = parseInt(req.query.amount)
  let ip = getClientIp(req)
  console.log(ip, addr, sat)
  if (!addr || !sat) {
    res.statusCode = 406
    console.log(ip + ': ERROR missing params')
    return res.end(JSON.stringify({
      error: 'Missing required parameters'
    }))
  }

  // check IP limits
  const resp = await getSavedLimit(ip)
  console.log('getSavedLimit', ip, resp, sat)
  if (resp >= sat) {
    // make transaction
    let txid
    try {
      const result = (await rpc.sendtoaddress(addr, sat)).result
      txid = result
    } catch (e) {
      res.statusCode = 422
      console.log(ip + ': ERROR ' + e.message)
      return res.end(JSON.stringify({
        code: e.code,
        error: e.message
      }))
    }

    // we have successfully made a txn
    // update limit, and send new limit and txid
    try {
      const limitResult = await decrbyAsync(ip, sat)
      console.log(ip + ': ' + sat + ' in txid ' + txid)
      return res.end(JSON.stringify({
        id: txid,
        limit: limitResult
      }))
    } catch (e) {
      // this should never happen
      console.log(ip + ': INTERNAL ERROR')
      res.statusCode = 400
      return res.end(JSON.stringify({
        error: 'Internal Error'
      }))
    }
  } else {
    res.statusCode = 403
    console.log(ip + ': ERROR request exceeds lim. ' + sat + ' > ' + resp)
    return res.end(JSON.stringify({
      error: 'Request exceeds limit',
      limit: resp,
      request: sat,
      ip: ip
    }))
  }
}

module.exports = {
  donate
}
