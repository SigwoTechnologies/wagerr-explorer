
/**
 * Global configuration object.
 */
const config = {
  'api': {
    'host': 'https://explorer.wagerr.com',
    'port': '8087',
    'prefix': '/api',
    'timeout': '10s'
  },
  'coinMarketCap': {
    'api': 'http://api.coinmarketcap.com/v1/ticker/',
    'ticker': 'wagerr'
  },
  'db': {
    'host': '127.0.0.1',
    'port': '27017',
    'name': 'wagerrx',
    'user': 'wagerr',
    'pass': 'wagerr'
  },
  'freegeoip': {
    'api': 'https://extreme-ip-lookup.com/json/'
  },
  'faucet':{
    'wait_time': 1440,
    'percent': 0.02,
    'limit': 500
  },
  'rpc': {
    'host': '127.0.0.1',
    'port': '55003',
    'user': 'wagerr',
    'pass': 'this',
    'timeout': 8000, // 8 seconds
  },
  'coin':{
    'testnet':false,
    'oracle_payout_address':'WRBs8QD22urVNeGGYeAMP765ncxtUA1Rv2',
    'dev_payout_address':'Wm5om9hBJTyKqv5FkMSfZ2FDMeGp12fkTe',
  }
};

module.exports = config;
