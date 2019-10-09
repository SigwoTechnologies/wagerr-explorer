#!/bin/bash
set -e
cat > ./config.js <<EOL
const config = {
  api: {
    host: '$API_SERVER',
    port: '$SERVER_API_PORT' || '8087',
    prefix: '/api',
    timeout: '30s'
  },
  coinMarketCap: {
    tickerId: '1779'
  },
  db: {
    host: '$MONGODB_HOST' || 'mongo',
    port: '$MONGODB_PORT' || '27017',
    name: '$MONGODB_DATABASE' || 'wagerrx',
    user: '$MONGODB_USERNAME' || 'wagerru',
    pass: '$MONGODB_PASSWORD' || 'wagerrpass2019'
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
    host: '$RPC_BIND' || 'rpcnode',
    port: '$RPC_PORT' || 8332,
    user: '$RPC_USER' || 'wagerr',
    pass: '$RPC_PASS' || 'thiswagerrpass',
    timeout: 8000, // 8 seconds
  },
  coin:{
    testnet: 'MainNet' || 'MainNet',
    oracle_payout_address: '$ORACLE_PAYOUT_ADDRESS' || 'TGFKr64W3tTMLZrKBhMAou9wnQmdNMrSG2', // testnet address, replace with mainnet
    dev_payout_address: '$DEV_PAYOUT_ADDRESS' || 'TLceyDrdPLBu8DK6UZjKu4vCDUQBGPybcY', // testnet address, replace with mainnet
  },
  redis:{
    host: '$REDIS_HOST' || 'localhost',
  },
  crons: {
    start: '$START_HEIGHT',
  },
};

module.exports = config;
EOL

echo 'Configuration for explorer applied'

cron &
tail -f /var/log/cron.log &
echo 'executing log watch' &
yarn run build &&
yarn run start:api &
yarn run start:web
