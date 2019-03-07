/**
 * Global configuration object.
 */
const config = {
  api: {
    host: process.env.SERVER_API_HOST,
    port: process.env.SERVER_API_PORT || '8087',
    prefix: '/api',
    timeout: '10s'
  },
  coinMarketCap: {
    tickerId: '1779'
  },
  db: {
    host: process.env.MONGODB_HOST,
    port: process.env.MONGODB_PORT || '27017',
    name:  process.env.MONGODB_DATABASE,
    user:  process.env.MONGODB_USERNAME,
    pass: process.env.MONGODB_PASSWORD
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
    host: process.env.RPC_BIND || '127.0.0.1',
    port: process.env.RPC_PORT || 8332,
    user: process.env.RPC_USER,
    pass: process.env.RPC_PASS,
    timeout: 8000, // 8 seconds
  },
  coin:{
    testnet: process.env.COIN_TESTNET || false,
    oracle_payout_address: process.env.ORACLE_PAYOUT_ADDRESS,
    dev_payout_address: process.env.DEV_PAYOUT_ADDRESS,
  }
};

module.exports = config;
