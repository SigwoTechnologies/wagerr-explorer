/**
 * Global configuration object.
 */
const config = {
  api: {
    host: process.env.SERVER_API_HOST || '0.0.0.0',
    port: process.env.SERVER_API_PORT || '8087',
    prefix: '/api',
    timeout: '10s'
  },
  coinMarketCap: {
    tickerId: '1779'
  },
  db: {
    host: process.env.MONGODB_HOST || 'mongo',
    port: process.env.MONGODB_PORT || '27017',
    name:  process.env.MONGODB_DATABASE || 'wagerrx',
    user:  process.env.MONGODB_USERNAME || 'wagerru',
    pass: process.env.MONGODB_PASSWORD || 'wagerrpass2019'
  },
  freegeoip: {
    api: 'https://extreme-ip-lookup.com/json/'
  },
  faucet:{
    wait_time: 1440,
    percent: 0.02,
    limit: 500
  },
  rpc: {
    host: process.env.RPC_BIND || 'rpcnode',
    port: process.env.RPC_PORT || 8332,
    user: process.env.RPC_USER || 'wagerr',
    pass: process.env.RPC_PASS || 'thiswagerrpass',
    timeout: 8000, // 8 seconds
  },
  coin:{
    testnet: process.env.COIN_TESTNET || false,
    oracle_payout_address: process.env.ORACLE_PAYOUT_ADDRESS || 'WRBs8QD22urVNeGGYeAMP765ncxtUA1Rv2',
    dev_payout_address: process.env.DEV_PAYOUT_ADDRESS || 'Wm5om9hBJTyKqv5FkMSfZ2FDMeGp12fkTe',
  }
};

module.exports = config;
