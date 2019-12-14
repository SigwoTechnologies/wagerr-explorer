require('babel-polyfill');

const { exit } = require('../lib/cron');
const locker = require('../lib/locker');

// Models.
const Transaction = require('../model/transaction');
const LottoEvent = require('../model/lottoevent');
const LottoBet = require('../model/lottobet');
const LottoResult = require('../model/lottoresult');
const TX = require('../model/tx');

const { log } = console;

function handleError(msg, transaction) {
  log(msg);
  log(transaction);
}

async function logError(err, info, height, transaction) {
  if (err && err.message && err.message.includes('duplicate key error collection')) {
    return null;
  }

  if (height) {
    handleError(
      `Error ${info} at height ${height}`,
      transaction,
    );
  }

  return log(err);
}

async function migrateTransaction(txType) {
  let Model;
  let params = {};

  const transactions = await Transaction.find({
    'opObject.txType': txType,
    matched: false,
  });

  log(`Found ${transactions.length} unmatched transactions for ${txType}`);

  if (txType === 'chainGamesLottoEvent') {
    Model = LottoEvent;
  } else if (txType === 'chainGamesLottoBet') {
    Model = LottoBet;
  } else if (txType === 'chainGamesLottoResult') {
    Model = LottoResult;
    
  }

  for (let x = 0; x < transactions.length;  x +=1) {
    const transaction = transactions[x];
    const { opObject } = transaction;
    params = {
      _id: `${opObject.get('type')}${opObject.get('eventId')}${transaction.txId}${transaction.blockHeight}`,
      txId: transaction.txId,
      blockHeight: transaction.blockHeight,
      createdAt: transaction.createdAt,
      txType: opObject.get('txType'),
      eventId: opObject.get('eventId'),
      opString: JSON.stringify(opObject),
      betValue: transaction.betValue,
      opCode: opObject.get('opCode'),
      transaction: opObject,
      matched: true,
    };

    if (txType === 'chainGamesLottoEvent') {
      params.entryPrice  = transaction.opObject.get('entryPrice');
    }

    if (txType === 'chainGamesLottoResult') {
      let resultPayoutTxs = await TX.find({ blockHeight: transaction.blockHeight + 1 });

      params.entryPrice  = transaction.opObject.get('entryPrice');
      params.payoutTx = resultPayoutTxs[0];
    }

    let lottoDataSaved = false;

    try {
      lottoDataSaved = await Model.create(params);
    } catch(err) {
      logError(err, `saving ${txType} data`, transaction.blockHeight, transaction);
    }

    try {
      if (lottoDataSaved) {
        transaction.matched = true;
        await transaction.save();
      }
    } catch(err) {
      logError(err, `updating ${txType} transaction data`, transaction.blockHeight, transaction);
    }
  }
}

async function syncLottoData() {
  await migrateTransaction('chainGamesLottoEvent');
  await migrateTransaction('chainGamesLottoBet');
  await migrateTransaction('chainGamesLottoResult');

  return true;
}

/**
 * Handle locking.
 */
async function update () {
  const type = 'lotto';
  let code = 0;
  let response;

  try {
    // locker.lock(type);
    response = await syncLottoData();
  } catch (err) {
    log('Update() error');
    log(err);
    code = 1;
    response = err;
    throw new Error(err);
  } /* finally {
    try {
      locker.unlock(type);
    } catch (err) {
      log('Update() error: finally');
      log(err);
      code = 1;
    }
    exit(code);
  } */

  return response;
}

module.exports = update;
