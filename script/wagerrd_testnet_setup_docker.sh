#!/bin/bash
set -e

# Download latest node and install.
wgrlink=`curl -s https://api.github.com/repos/wagerr/wagerr/releases/latest | grep browser_download_url | grep x86_64-linux-gnu.tar.gz | cut -d '"' -f 4`
mkdir -p /tmp/wagerr
cd /tmp/wagerr
wget -O wagerr.tar.gz $wgrlink
tar -xvf wagerr.tar.gz
wgrfolder=`ls | grep wagerr-`
cd /tmp/wagerr/$wgrfolder
mv ./bin/* /usr/local/bin
cd
rm -rf /tmp/wagerr
mkdir /root/.wagerr

# Setup configuration for node.
rpcuser=$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c 13 ; echo '')
rpcpassword=$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c 32 ; echo '')
cat > /root/.wagerr/wagerr.conf <<EOL
rpcuser='$RPC_USER'
rpcpassword='$RPC_PASS'
enablezeromint=0
daemon=1
txindex=1
testnet=1
server=1
rpcbind=$RPC_BIND
rpcclienttimeout=30
rpcport=8332
whitelist=$NODE_TWO
whitelist=$NODE_THREE
whitelist=$NODE_FOUR
addnode=$NODE_ONE
addnode=$NODE_TWO
addnode=$NODE_THREE
addnode=$NODE_FOUR
connect=$NODE_ONE
connect=$NODE_TWO
connect=$NODE_THREE
connect=$NODE_FOUR
EOL