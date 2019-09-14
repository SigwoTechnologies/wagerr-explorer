#!/bin/bash
set -e

# Download latest node and install from repo.
apt-get install -y software-properties-common -y
apt-get update
apt install -y build-essential libtool autotools-dev automake pkg-config libssl1.0-dev libevent-dev  -y
apt-get install -y libboost-all-dev
apt-get install libgmp-dev -y
add-apt-repository ppa:bitcoin/bitcoin
apt-get update
apt-get install -y libdb4.8-dev libdb4.8++-dev
apt-get install -y libqt5gui5 libqt5core5a libqt5dbus5 qttools5-dev qttools5-dev-tools libprotobuf-dev
apt-get install -y libqrencode-dev
apt-get install git -y
apt-get install autoconf -y
apt-get install pkg-config -y
apt-get install libtool -y
apt-get install libevent-dev -y
apt-get install protobuf-compiler -y

echo 'Cloning wagerr'

mkdir -p /tmp/wagerr
cd /tmp/wagerr
git clone -b master https://github.com/wagerr/wagerr
cd  wagerr
echo 'Running autogen'
./autogen.sh
echo 'Running configuration'
./configure --disable-tests --with-gui=qt5
echo 'Running make'
make
cd src
#cp test_wagerr /usr/local/bin
#cp test_wagerr-qt /usr/local/bin
cp wagerr-cli /usr/local/bin
cp wagerrd /usr/local/bin
#cp wagerr-qt /usr/local/bin
cp wagerr-tx /usr/local/bin
cd

# Download latest node and install.
#echo 'Installing wagerr'
#wgrlink=`curl -s https://api.github.com/repos/wagerr/wagerr/releases/latest | grep browser_download_url | grep x86_64-linux-gnu.tar.gz | cut -d '"' -f 4`
#mkdir -p /tmp/wagerr
#cd /tmp/wagerr
#curl -Lo wagerr.tar.gz $wgrlink
#tar -xvf wagerr.tar.gz
#wgrfolder=`ls | grep wagerr-`
#cd /tmp/wagerr/$wgrfolder
#mv ./bin/* /usr/local/bin
#cd
#rm -rf /tmp/wagerr

mkdir /root/.wagerr

echo 'Basic wagerr installation complete'
