#!/bin/bash
set -e

echo 'Installing wagerr'

# Download latest node and install.
wgrlink=`curl -s https://api.github.com/repos/wagerr/wagerr/releases/latest | grep browser_download_url | grep x86_64-linux-gnu.tar.gz | cut -d '"' -f 4`
mkdir -p /tmp/wagerr
cd /tmp/wagerr
curl -Lo wagerr.tar.gz $wgrlink
tar -xvf wagerr.tar.gz
wgrfolder=`ls | grep wagerr-`
cd /tmp/wagerr/$wgrfolder
mv ./bin/* /usr/local/bin
cd
rm -rf /tmp/wagerr
mkdir /root/.wagerr

echo 'Basic wagerr installation complete'
