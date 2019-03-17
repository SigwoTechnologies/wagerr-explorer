#!/bin/bash
# Download latest node and install.
wgrlink=`curl -s https://api.github.com/repos/wagerr/wagerr/releases/latest | grep browser_download_url | grep x86_64-linux-gnu.tar.gz | cut -d '"' -f 4`
mkdir -p /tmp/wagerr
cd /tmp/wagerr
wget -O wagerr.tar.gz $wgrlink
tar -xvf wagerr.tar.gz
wgrfolder=`ls | grep wagerr-`
cd /tmp/wagerr/$wgrfolder
sudo mv ./bin/* /usr/local/bin
cd
rm -rf /tmp/wagerr
mkdir /root/.wagerr

# Setup configuration for node.
rpcuser=$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c 13 ; echo '')
rpcpassword=$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c 32 ; echo '')
cat > /root/.wagerr/wagerr.conf <<EOL
rpcuser=wagerr
rpcpassword=this
daemon=1
txindex=1
testnet=1
enablezeromint=0
staking=0
EOL

