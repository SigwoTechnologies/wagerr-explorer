#!/bin/bash
set -e

echo "User: $RPC_USER"
echo "Pass: $RPC_PASS"
sleep 1s
if [ -z "$RPC_USER" ] || [ -z "$RPC_PASS" ]
then
  echo "node: RPC_USER or RPC_PASS not provided!"
  printenv
  exit 1
fi

# Setup configuration for node.
rpcuser=$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c 13 ; echo '')
rpcpassword=$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c 32 ; echo '')
cat > /root/.wagerr/wagerr.conf <<EOL
daemon=1
txindex=1
enablezeromint=0
server=1
rpcbind=0.0.0.0
rpcallowip=0.0.0.0/0
rpcuser=$RPC_USER
rpcpassword=$RPC_PASS
rpcclienttimeout=30
rpcport=$RPC_PORT
testnet=$COIN_TESTNET
staking=0
debug=1
EOL

echo 'RPC configuration has been applied'
# ls /root/.wagerr
cat /root/.wagerr/wagerr.conf

exec "$@"
