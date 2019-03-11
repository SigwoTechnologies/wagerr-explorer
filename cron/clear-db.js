
require('babel-polyfill');
const { exit, rpc } = require('../lib/cron');
const locker = require('../lib/locker');
// Models.
const Block = require('../model/block');
const Coin = require('../model/coin');
const Masternode = require('../model/masternode');
const Peer = require('../model/peer');
const Rich = require('../model/rich');
const TX = require('../model/tx');
const UTXO = require('../model/utxo');
const BetAction = require('../model/betaction');
const BetEvent = require('../model/betevent');
const BetPayout = require('../model/betpayout');
const BetResult = require('../model/betresult');
const ListEvent = require('../model/listevent');
const STXO = require('../model/stxo');

/**
 * Clear database.
 */
async function clearDatabase() {
  await Block.deleteMany({});
  await Coin.deleteMany({});
  await Masternode.deleteMany({});
  await Peer.deleteMany({});
  await Rich.deleteMany({});
  await TX.deleteMany({});
  await UTXO.deleteMany({});
  await BetAction.deleteMany({});
  await BetEvent.deleteMany({});
  await BetPayout.deleteMany({});
  await BetResult.deleteMany({});
  await ListEvent.deleteMany({});
  await STXO.deleteMany({});
}

/**
 * Handle locking.
 */
async function update() {
  let code = 0;

  try {
    locker.lock('block');
    locker.lock('coin');
    locker.lock('masternode');
    locker.lock('peer');
    locker.lock('rich');
    locker.lock('tx');
    locker.lock('utxo');
    locker.lock('bet');
    locker.lock('listevent');
    await clearDatabase();
  } catch(err) {
    console.log(err);
    code = 1;
  } finally {
    try {
      locker.unlock('block');
      locker.unlock('coin');
      locker.unlock('masternode');
      locker.unlock('peer');
      locker.unlock('rich');
      locker.unlock('tx');
      locker.unlock('utxo');
      locker.unlock('bet');
      locker.unlock('listevent');
    } catch(err) {
      console.log(err);
      code = 1;
    }
    exit(code);
  }
}

update();
