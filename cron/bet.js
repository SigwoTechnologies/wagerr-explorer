require('babel-polyfill');

const { exit } = require('../lib/cron');
const locker = require('../lib/locker');
const {
  syncBlocksForBet,
  getBetData,
} = require('./methods');

// Models.
const Block = require('../model/block');
const { log } = console;


/**
 * Handle locking.
 */
async function update () {
  const type = 'bet';
  let code = 0;

  let response;

  try {
    const {
      betEvent,
      betAction,
      betResult,
    }= await getBetData();

    let clean = true // Always clear for now.
    let dbEventHeight = betEvent && betEvent.blockHeight ? betEvent.blockHeight : 1;
    let dbActionHeight = betAction && betAction.blockHeight ? betAction.blockHeight : 1;
    let dbResultHeight = betResult && betResult.blockHeight ? betResult.blockHeight : 1;
    let dbHeight = [dbEventHeight, dbActionHeight, dbResultHeight].sort().reverse()[0];
    const block = await Block.findOne().sort({ height: -1});
    // const blocks = await Block.find().sort({ height: -1});

    let blockDbHeight = block && block.height ? block.height - 1: 1;

    // If heights provided then use them instead.
    if (!isNaN(process.argv[2])) {
      clean = true;
      dbHeight = parseInt(process.argv[2], 10);
    }
    if (!isNaN(process.argv[3])) {
      clean = true;
      blockDbHeight = parseInt(process.argv[3], 10);
    }
    //log(dbHeight, blockDbHeight, clean)
    // If nothing to do then exit.
    if (dbHeight >= blockDbHeight) {
      return;
    }
    // If starting from genesis skip.
    else if (dbHeight === 0) {
      dbHeight = 1;
    }

    // locker.lock(type);
    log(`-- First sync --`);
    const firstSync = await syncBlocksForBet(dbHeight, blockDbHeight, clean);
    log(`-- Second sync --`);
    const secondSync = await syncBlocksForBet(dbHeight, blockDbHeight, false, 70);

    response = { firstSync, secondSync };
  } catch (err) {
    log('Update() error');
    log(err);
    code = 1;
    response = err;
    throw new Error(err);
  } /* finally {
    try {
      // locker.unlock(type);
    } catch (err) {
      log('Update() error: finally');
      log(err);
      code = 1;
      throw new Error(err);
    }
    // exit(code);
  } */

  return response;
}

module.exports = update;
