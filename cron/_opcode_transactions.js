const {
  outcomeMapping,
  resultMapping,
} = require('../lib/op_code');

const Block = require('../model/block');
const Betupdate = require('../model/betupdate');
const Betspread = require('../model/betspread');
const Bettotal = require('../model/bettotal');
const Transaction = require('../model/transaction');
const BetAction = require('../model/betaction');
const BetEvent = require('../model/betevent');
const BetResult = require('../model/betresult');

const BetError = require('../model/beterror');

const TX = require('../model/tx');

const { log } = console;

async function getBetData() {
  const betEvent = await BetEvent.findOne().sort({blockHeight: -1});
  const betAction = await BetAction.findOne().sort({blockHeight: -1});
  const betResult = await BetResult.findOne().sort({blockHeight: -1});

  return {
    betEvent,
    betAction,
    betResult,
  };
}

async function deleteBetData(start, stop) {
  await BetAction.deleteMany({ blockHeight: { $gte: start, $lte: stop } });
  await BetEvent.deleteMany({ blockHeight: { $gte: start, $lte: stop } });
  await BetResult.deleteMany({ blockHeight: { $gte: start, $lte: stop } });
}


async function recordExists(rType, val, recordType = '_id') {
  let response;
  try {
    response = await rType.findOne({ [recordType]: val });
  } catch (e) {
    log('bet.js:recordExists');
    log(e);
  }

  return response;
}

async function createError(_id, rpctx, block, transaction, transactionType) {
  return BetError.create({
    _id: `error-${_id}`,
    txId: rpctx.get('txid'),
    blockHeight: block.height,
    createdAt: block.createdAt,
    eventId: transaction.eventId,
    opCode: transaction.opCode,
    transaction,
    completed: false,
    txType: transactionType,
    txErrorId: _id
  });
}

function handleError(msg, e, transaction) {
  log(msg);
  log(transaction);
  log(e);
}

async function logError(err, dataType, height, transaction, originalRecord, event) {
  if (err && err.message && err.message.includes('duplicate key error collection')) {
    return null;
  }

  if (height) {
    handleError(
      `Error ${dataType} at height ${height}`,
      err,
      transaction,
    );
  }

  if (originalRecord) {
    log(originalRecord);
  }

  if (event)  {
    log(event);
  }

  return log(err);
}

async function getEventData(block, eventId) {
  const originalRecord = await BetEvent.findOne({
    eventId,
  });

  let event = {};

  const updates = await Betupdate.find({
    eventId,
    createdAt: { $lt: block.createdAt },
  });

  const betTotals = await Bettotal.find({
    eventId,
    createdAt: { $lt: block.createdAt },
  });

  if(updates && updates.length > 0) {
    const lastRecord = updates[updates.length - 1].opObject;

    event = {
      homeOdds: lastRecord.get('homeOdds'),
      awayOdds: lastRecord.get('awayOdds'),
      drawOdds: lastRecord.get('drawOdds'),
    };
  } else {
    event = originalRecord;
  }

  if (betTotals && betTotals.length > 0) {
    const lastTotal = betTotals[betTotals.length - 1];

    event.points = lastTotal.points;
    event.overOdds = lastTotal.overOdds;
    event.underOdds = lastTotal.underOdds;
  }

  return { event, updates, betTotals, originalRecord };
}


async function saveOPTransaction(block, rpcTx, vout, transaction) {
  const rpctx = rpcTx;
  let createResponse;

  if (rpctx.get === undefined) {
    rpctx.get = (param) => {
      return rpctx[param];
    }
  }

  if (['peerlessEvent'].includes(transaction.txType)) {
    const _id = `${transaction.eventId}${rpctx.get('txid')}${block.height}`;
    const eventExists = await recordExists(BetEvent, _id);

    if (eventExists) {
      return eventExists;
    }

    try {
      createResponse = await BetEvent.create({
        _id,
        txId: rpctx.get('txid'),
        blockHeight: block.height,
        createdAt: block.createdAt,
        eventId: transaction.eventId,
        timeStamp:  transaction.timestamp,
        league:  transaction.tournament,
        info:  `R${transaction.round}`,
        homeTeam:  transaction.homeTeam,
        awayTeam:  transaction.awayTeam,
        homeOdds:  transaction.homeOdds,
        awayOdds:  transaction.awayOdds,
        drawOdds: transaction.drawOdds,
        opString: JSON.stringify(transaction),
        opCode: transaction.opCode,
        transaction,
        matched: true,
      });
    } catch (e) {
      createResponse = e;

      logError(e, 'creating bet event', block.height, transaction);
    }

    return createResponse;
  }

  if (['peerlessUpdateOdds'].includes(transaction.txType)) {
    const _id = `${transaction.eventId}${rpctx.get('txid')}${block.height}`;
    const updateExists = await recordExists(Betupdate, _id);
    const resultExists = await recordExists(BetResult, `${transaction.eventId}`, 'eventId');

    if (updateExists) {
      return updateExists;
    }

    if (!resultExists) {
      try {
        const event = await BetEvent.findOne({
          eventId: `${transaction.eventId}`,
        });
  
        if (event) {
          event.homeOdds = `${transaction.homeOdds}`;
          event.awayOdds = `${transaction.awayOdds}`;
          event.drawOdds = `${transaction.drawOdds}`;
  
          if (event.homeOdds == 0 || event.awayOdds == 0 || event.drawOdds == 0) {
            // log('Invalid transaction data');
            // log(transaction);
          }
  
          try {
            await event.save();
          } catch (e) {
            logError(e, 'saving odds update', block.height, transaction);
          }
        }
      } catch (e) {
        logError(e, 'finding odds update', block.height, transaction);
      }
    }

    try {
      createResponse = Betupdate.create({
        _id,
        txId: rpctx.get('txid'),
        blockHeight: block.height,
        createdAt: block.createdAt,
        opCode: transaction.opCode,
        type: transaction.type,
        txType: transaction.txType,
        eventId: transaction.eventId,
        opObject: transaction,
        matched: true,
      });
    } catch (e) {
      logError(e, 'creating event update', block.height, transaction);
    }

    return createResponse;
  }

  if (['peerlessBet'].includes(transaction.txType)) {
    const _id = `${transaction.eventId}${transaction.outcome}${rpctx.get('txid')}${block.height}`;
    const betExists = await recordExists(BetAction, _id);
    
    if (betExists) {
      // log(`Bet update ${_id} already on record`);
      return betExists;
    }

    try {
      const { event, originalRecord }  = await getEventData(block, transaction.eventId);

      const eventRecord = event || {};

      try {
        createResponse = await BetAction.create({
          _id,
          txId: rpctx.get('txid'),
          blockHeight: block.height,
          createdAt: block.createdAt,
          eventId: transaction.eventId,
          betChoose: outcomeMapping[transaction.outcome],
          betValue: vout.value,
          opString: JSON.stringify(transaction),
          opCode: transaction.opCode,
          homeOdds: eventRecord.homeOdds || 0,
          awayOdds: eventRecord.awayOdds || 0,
          drawOdds: eventRecord.drawOdds || 0,
          points: eventRecord.points || 0,
          overOdds: eventRecord.overOdds || 0,
          underOdds: eventRecord.underOdds || 0,
          transaction,
          matched: !event ? false : true,
        });

        if (!event) {
          log(`Error finding event data. Creating transaction error record at height ${block.height}`);
          await createError(_id, rpctx, block, transaction, 'BetAction');
        }
      } catch (e) {
        logError(e, 'creating bet action ', block.height, transaction, originalRecord, event);
      }
    } catch (e) {
      logError(e, 'retrieving event data ', block.height, transaction);
    }

    return createResponse;
  }

  if (['peerlessSpreadsMarket'].includes(transaction.txType)) {
    const _id = `SM${transaction.eventId}${rpctx.get('txid')}${block.height}`;
    const spreadExists = await recordExists(Betspread, _id);

    if (spreadExists) {
      log(`Bet spread ${_id} already on record`);
      return spreadExists;
    }

    const { spreadPoints } = transaction; 

    const homePoints = (transaction.homeOdds < transaction.awayOdds) ? -(spreadPoints) : spreadPoints;
    const awayPoints = (transaction.homeOdds > transaction.awayOdds) ? -(spreadPoints) : spreadPoints;

    try {
      createResponse = Betspread.create({
        _id,
        txId: rpctx.get('txid'),
        blockHeight: block.height,
        createdAt: block.createdAt,
        opCode: transaction.opCode,
        type: transaction.type,
        txType: transaction.txType,
        eventId: transaction.eventId,
        opObject: transaction,
        homeOdds: transaction.homeOdds,
        awayOdds: transaction.awayOdds,
        betValue: vout.value,
        value: transaction.betValue,
        transaction,
        homePoints,
        awayPoints,
        matched: true,
      });
    } catch (e) {
      logError(e, 'creating event update', block.height, transaction);
    }

    return createResponse;
  }

  if (['peerlessTotalsMarket'].includes(transaction.txType)) {
    const _id = `TM${transaction.eventId}${rpctx.get('txid')}${block.height}`;
    const spreadExists = await recordExists(Bettotal, _id);

    if (spreadExists) {
      return spreadExists;
    }

    try {
      createResponse = Bettotal.create({
        _id,
        txId: rpctx.get('txid'),
        blockHeight: block.height,
        createdAt: block.createdAt,
        opCode: transaction.opCode,
        type: transaction.type,
        txType: transaction.txType,
        eventId: transaction.eventId,
        opObject: transaction,
        points: transaction.spreadPoints,
        overOdds: transaction.homeOdds,
        underOdds: transaction.awayOdds,
        matched: true,
      });
    } catch (e) {
      logError(e, 'creating peerless totals market', block.height, transaction);
    }

    return createResponse;
  }

  if (['peerlessResult'].includes(transaction.txType)) {
    const _id = `${transaction.eventId}${rpctx.get('txid')}${block.height}`;
    const resultExists = await recordExists(BetResult, _id);

    if (resultExists) {
      return resultExists;
    }
    

    try {
      let resultPayoutTxs = await TX.find({blockHeight: block.height+1});

      createResponse = await BetResult.create({
        _id,
        txId: rpctx.get('txid'),
        blockHeight: block.height,
        createdAt: block.createdAt,
        eventId: transaction.eventId,
        result: resultMapping[transaction.resultType],
        opString: JSON.stringify(transaction),
        payoutTx: resultPayoutTxs[0],
        transaction,
        matched: true,
      });
    } catch (e) {
      createResponse = e;
      logError(e, ' creating bet result', block.height, transaction);
    }

    return createResponse;
  }

  const transactionId = `${transaction.txType}-${rpctx.get('txid')}${block.height}`;
  const transactionsExists = await recordExists(Transaction, transactionId);

  if (transactionsExists) {
    return transactionsExists;
  }

  return Transaction.create({
    _id: transactionId,
    txId: rpctx.get('txid'),
    blockHeight: block.height,
    createdAt: block.createdAt,
    opCode: transaction.opCode,
    type: transaction.type,
    txType: transaction.txType,
    opObject: transaction,
    matched: false,
  });
}

module.exports = {
  deleteBetData,
  recordExists,
  saveOPTransaction,
  getBetData,
  getEventData,
};