require('babel-polyfill');

const { exit } = require('../lib/cron');
const locker = require('../lib/locker');

// Models.
const Transaction = require('../model/transaction');
const LottoEvent = require('../model/lottoevent');
const LottoBet = require('../model/lottobet');
const LottoResult = require('../model/lottoresult');

const { log } = console;

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
      opCode: opObject.get('opCode'),
      transaction: opObject,
      matched: true,
    };

    if (txType === 'chainGamesLottoEvent') {
      params.entryPrice  = transaction.opObject.get('entryPrice');
    }

    let lottoDataSaved = false;

    try {
      lottoDataSaved = await Model.create(params);
    } catch(err) {
      log(`Error saving ${txType} data`);
      log(err);
    }

    try {
      if (lottoDataSaved) {
        transaction.matched = true;
        await transaction.save();
      }
    } catch(err) {
      log('Error updating transaction record');
    }
  }
}

async function syncLottoData() {
  await migrateTransaction('chainGamesLottoEvent');
  await migrateTransaction('chainGamesLottoBet');
  await migrateTransaction('chainGamesLottoResult');
}

/**
 * Handle locking.
 */
async function update () {
  const type = 'lotto';
  let code = 0;

  try {
    locker.lock(type);
    await syncLottoData();
  } catch (err) {
    log('Update() error');
    log(err);
    code = 1;
  } finally {
    try {
      locker.unlock(type);
    } catch (err) {
      log('Update() error: finally');
      log(err);
      code = 1;
    }
    exit(code);
  }
}

update()
