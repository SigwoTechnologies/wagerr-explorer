#!/bin/bash
/usr/local/bin/node ./cron/block.js
printenv
sleep 30
/usr/local/bin/node ./cron/block.js
