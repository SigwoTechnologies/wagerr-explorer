/**
 * Global configuration object.
 */
const config = {
  api: {
    host: 'http://localhost:8087',
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
    testnet: process.env.COIN_TESTNET || true,
    oracle_payout_address: process.env.ORACLE_PAYOUT_ADDRESS || 'TGFKr64W3tTMLZrKBhMAou9wnQmdNMrSG2', // testnet address, replace with mainnet
    dev_payout_address: process.env.DEV_PAYOUT_ADDRESS || 'TLceyDrdPLBu8DK6UZjKu4vCDUQBGPybcY', // testnet address, replace with mainnet
  }
};

module.exports = config;
