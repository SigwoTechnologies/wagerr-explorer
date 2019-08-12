wagerrd -p=$RPC_PORT -rpcuser=$RPC_USER -rpcpassword=$RPC_PASS &&
sleep 5 &&
tail -f /root/.wagerr/debug.log
