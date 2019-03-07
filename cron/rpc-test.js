require('babel-polyfill');

const { exit, rpc } = require('../lib/cron');

async function getInfo() {
  let response;
  let code = 1;
  try {
    response = await rpc.call('getinfo');
    console.log(response);
    code = 0;
  } catch (e) {
    console.log(e);
    response = e;
  }
  exit(code);
  return response;
}

getInfo();
