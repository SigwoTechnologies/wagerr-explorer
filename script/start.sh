#!/bin/bash
set -e

cron &
tail -f /var/log/cron.log &
echo 'executing log watch' &
yarn run build &&
yarn run start:api &
yarn run start:web
