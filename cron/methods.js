const { forEachSeries } = require('p-iteration');

const blockchain = require('../lib/blockchain');
const { rpc } = require('../lib/cron');
const config = require('../config')

const {
  isOPCode,
  decode,
} = require('../lib/op_code');

const {
  deleteBetData,
  saveOPTransaction,
  getBetData,
  getEventData,
} = require('./_opcode_transactions.js');

const Block = require('../model/block');
const BetAction = require('../model/betaction');
const BetEvent = require('../model/betevent');
const BetResult = require('../model/betresult');
const BetError = require('../model/beterror');

const TX = require('../model/tx');

const { log } = console;


async function getBlockData(height) {
  const blocks= await Block.find({ height });
  let block = {};
  if (blocks.length > 1) {
    let rpctxsCount = 0;
    
    for (let x = 0; x < blocks.length; x +=1) {
      const thisBlock = blocks[x];

      if (thisBlock.rpctxs.length > rpctxsCount) {
        rpctxsCount = thisBlock.rpctxs.length;
        block = thisBlock;
      }
    }
    
  } else {
    block = blocks[0] || {};
  }

  return block;
}

function hexToString(hexx) {
  var hex = hexx.toString(); //force conversion
  var str = '';
  for (var i = 0; (i < hex.length && hex.substr(i, 2) !== '00'); i += 2);
  str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  return str;
}

function getOPCode(voutData) {
  const { type, asm } = voutData.scriptPubKey;

  if (!type || type !== 'nulldata') {
    return { error: false, message: 'Incorrect type', type };
  }

  if (!asm) {
    return { error: false, message: 'Missing asm data', asm };
  }

  const hexValue = asm.replace('OP_RETURN ', '');

  return hexValue;
}

function validateVoutData(voutData) {
  const hexValue = getOPCode(voutData);

  const returnError = (fullError) => {
    return ({ error: true, fullError });
  };

  if (hexValue.error) return returnError(hexValue);

  const opData = isOPCode(hexValue);

  if (!opData.valid) {
    log(opData);
    return returnError(opData);
  }

  return decode(hexValue);
}

async function preOPCode(block, rpctx, vout) {
  let opString = hexToString(vout.scriptPubKey.asm.substring(10));
  let datas = opString.split('|');
  if (datas[0] === '1' && datas.length === 11) {
    BetEvent.create({
      _id: datas[2] + rpctx.txid,
      txId: rpctx.txid,
      blockHeight: block.height,
      createdAt: block.createdAt,
      eventId: datas[2],
      timeStamp: datas[3],
      league: datas[4],
      info: datas[5],
      homeTeam: datas[6],
      awayTeam: datas[7],
      homeOdds: datas[8],
      awayOdds: datas[9],
      drawOdds: datas[10],
      opString: opString,
    });
  } else if (datas[0] === '2' && datas.length === 4) {
    try {
      await BetAction.create({
        _id: datas[2] + datas[3] + rpctx.txid,
        txId: rpctx.txid,
        blockHeight: block.height,
        createdAt: block.createdAt,
        eventId: datas[2],
        betChoose: datas[3],
        betValue: vout.value,
        opString: opString,
      });
    } catch (e) {
      //log('Error saving bet action with old decryption method');
    }
  } else if (datas[0] === '3' && datas.length === 4) {
    let resultPayoutTxs = await TX.find({ blockHeight: block.height + 1 })
    BetResult.create({
      _id: datas[2] + rpctx.txid,
      txId: rpctx.txid,
      blockHeight: block.height,
      createdAt: block.createdAt,
      eventId: datas[2],
      result: datas[3],
      opString: opString,
      payoutTx: resultPayoutTxs[0],
    });
  } else if (datas[0] === '4' && datas.length === 4) {
    let resultPayoutTxs = await TX.find({ blockHeight: block.height + 1 })
    BetResult.create({
      _id: datas[2] + rpctx.txid,
      txId: rpctx.txid,
      blockHeight: block.height,
      createdAt: block.createdAt,
      eventId: datas[2],
      result: 'REFUND ' + datas[3],
      opString: opString,
      payoutTx: resultPayoutTxs[0],
    });
  }
}

async function addPoS(block, rpcTx, waitTime = 50) {
  const rpctx = rpcTx;
  // We will ignore the empty PoS txs.
  // Setup the outputs for the transaction.
  if (rpctx.get === undefined) {
    rpctx.get = (param) => {
      return rpctx[param];
    }
  }

  const rpctxVout = rpctx.get('vout');

  if (rpctxVout) {
    rpctxVout.forEach(async (vout) => {
      if (vout.scriptPubKey.type === 'nulldata') {
        let transaction;
        try {
          transaction = await validateVoutData(vout);
        } catch (e) {
          log('addPoS error');
          log(block.height);
          log(e);
          transaction = { error: true, fullError: e };
        }

        let success;

        if (transaction.error || !transaction.prefix) {
          success = await preOPCode(block, rpctx, vout);
        } else {
          success = await saveOPTransaction(block, rpctx, vout, transaction, waitTime);
        }

        if (!transaction.error && success && !success.error) {
          return { success: true };
        }
      }
    })
  }

  return true;
}

/**
 * Process the blocks and transactions.
 * @param {Number} start The current starting block height.
 * @param {Number} stop The current block height at the tip of the chain.
 */
async function syncBlocksForBet(start, stop, clean = false, waitTime = 50) {
  const { crons } = config;

  const dataStartBlock = crons.start || 756000;

  if (start == 0 || start == 1) {
    log(`First time data sync. Only data found in block ${dataStartBlock} and above will be synced`)
  }

  if (clean) {
    await deleteBetData(start, stop);
  }
  rpc.timeout(10000); // 10 secs

  log(start, stop);
  try {
    for (let height = start; height <= stop; height++) {
      if (height >= dataStartBlock) {

        const block = await getBlockData(height);

        let rpcblock = block;
        let txs = rpcblock.rpctxs ? rpcblock.rpctxs : [];

        await forEachSeries(txs, async (rpctx) => {
          if (blockchain.isPoS(block)) {
            // const rpctx = await util.getTX(txhash)
            await addPoS(block, rpctx, waitTime);
          }
        });
      }
    }
    log('Finished sync process');
  } catch (e) {
    log(e);
  }

  return true;
}

async function resolveErrors() {
  const maximumTries = 10;
  const response = [];
  let error;

  try {
    const errors = await BetError.find({
      completed: false,
      reviewed: { $lt: maximumTries },
    });
    log(`${errors.length} errors found`);
    if (errors.length > 0) {
      for (let x = 0; x < errors.length; x += 1) {
        const thisError = errors[x];
        const block = await getBlockData(thisError.blockHeight);
        let rpcblock = block;

        let txs = rpcblock.rpctxs ? rpcblock.rpctxs : [];
        let needsResync = false;
        let blockFromUpdate;
        let blockToUpdate = 756001;
        let searchDepth = 1000;

        await forEachSeries(txs, async (rpctx) => {
          if (blockchain.isPoS(block)) {
            if (thisError.txType === 'BetAction') {
              let completed = false;

              const { event } = await getEventData(block, thisError.eventId);

              // If match found, we find the BetAction record and update it
              if (event) {
                const betaction = await BetAction.findById(thisError.txErrorId.replace('error-', ''));

                betaction.homeOdds = event.homeOdds,
                  betaction.awayOdds = event.awayOdds,
                  betaction.drawOdds = event.drawOdds,
                  betaction.points = event.points,
                  betaction.overOdds = event.overOdds,
                  betaction.underOdds = event.underOdds,
                  betaction.matched = true;
                completed = await betaction.save();
              } else {
                log(`Event# ${thisError.eventId} not found`);
                // If not found, we use the the syncBlocksForBet method to try to complete missed records
                needsResync = true;
                if (!blockFromUpdate) {
                  blockFromUpdate = thisError.blockHeight - searchDepth;
                }
                blockToUpdate = thisError.blockHeight;
              }

              // We terminate the function when betSync record is completed

              if (completed) {
                thisError.completed = true;
                await thisError.save();
                log(`Error with ${thisError.txType} eventId#${thisError.eventId} has been resolved`);
                response.push(thisError);
              } else {
                thisError.reviewed += 1;

                await thisError.save();
                log(`Error with ${thisError.txType} eventId#${thisError.eventId} has not yet been resolved. ${maximumTries - thisError.reviewed} tries left for resolution.`);
                response.push(thisError);
              }
            }
          }
        });

        if (needsResync) {
          log('Missing events...running blok sync function...');
          await syncBlocksForBet((blockFromUpdate || (blockToUpdate - searchDepth)), blockToUpdate, false, 80);
        }
      }
    }
  } catch (e) {
    log('Error running resolveErrors function');
    log(e);
    error = e;
  }
  log('Sending response object now');
  return { records: response, error };
}

module.exports = {
  hexToString,
  getOPCode,
  validateVoutData,
  preOPCode,
  addPoS,
  syncBlocksForBet,
  resolveErrors,
  getBetData,
};
