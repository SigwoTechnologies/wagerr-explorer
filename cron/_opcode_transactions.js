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

const invalidIds = require('./_invalid_ids.js');

const { log } = console;

async function getBetData() {
  const betEvent = await BetEvent.findOne().sort({ blockHeight: -1 });
  const betAction = await BetAction.findOne().sort({ blockHeight: -1 });
  const betResult = await BetResult.findOne().sort({ blockHeight: -1 });

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


async function recordCheck(rType, val, recordType = '_id') {
  let response;
  try {
    response = await rType.findOne({ [recordType]: val });
  } catch (e) {
    log('bet.js:recordCheck');
    log(e);
  }

  if (!response && recordType === '_id') {
    if (invalidIds.includes(val)) {
      return true;
    }
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

  if (event) {
    log(event);
  }

  return log(err);
}

async function verifyBetOdds(record, rtype) {
  const { eventId } = record;

  try {
    if (rtype === 'update' || rtype === 'create') {
      const updates = await Betupdate.find({
        eventId: `${eventId}`,
        createdAt: { $gt: record.createdAt },
      });

      const nextUpdate = updates[0];
      const queryParams = { $gte: record.createdAt };

      if (nextUpdate) {
        queryParams['$lt'] = nextUpdate.createdAt;
      }

      // Updates betactions data
      const actions = await BetAction.find({
        eventId: `${eventId}`,
        createdAt: queryParams,
      });

      if (actions.length > 0) {
        for (let x = 0; x < actions.length; x += 1) {
          const thisAction = actions[x];
          let updated = false;
          let opObject;
          ({ opObject } = record);

          if (!opObject) {
            opObject = record.transaction;
          }

          if (thisAction.homeOdds != opObject.get('homeOdds')) {
            updated = true;
            thisAction.homeOdds = opObject.get('homeOdds');
          }

          if (thisAction.drawOdds != opObject.get('drawOdds')) {
            updated = true;
            thisAction.drawOdds = opObject.get('drawOdds');
          }

          if (thisAction.awayOdds != opObject.get('awayOdds')) {
            updated = true;
            thisAction.awayOdds = opObject.get('awayOdds');
          }

          if (updated) {
            await thisAction.save()
            if (rtype == 'create') {
              // log('Event create update');
            }
            // log(`Odds for event#${thisAction.eventId} action were updated`);
          }
        }
      }

      // Updates betspreads data
      const betspreads = await Betspread.find({
        eventId: `${eventId}`,
        createdAt: queryParams,
      });

      if (betspreads.length > 0) {
        for (let y = 0; y < betspreads.length; y += 1) {
          const thisSpread = betspreads[y];
          let updated = false;
          let opObject;
          ({ opObject } = record);

          if (!opObject) {
            opObject = record.transaction;
          }

          if (thisSpread.mhomeOdds != opObject.get('homeOdds')) {
            updated = true;
            thisSpread.mhomeOdds = opObject.get('homeOdds');
          }

          if (thisSpread.mawayOdds != opObject.get('awayOdds')) {
            updated = true;
            thisSpread.mawayOdds = opObject.get('awayOdds');
          }

          const spreadPoints = Math.abs(thisSpread.homePoints);

          const homePoints = (thisSpread.mhomeOdds < thisSpread.mawayOdds) ? -(spreadPoints) : spreadPoints;
          const awayPoints = (thisSpread.mhomeOdds > thisSpread.mawayOdds) ? -(spreadPoints) : spreadPoints;

          thisSpread.matched = true;
          thisSpread.homePoints = homePoints;
          thisSpread.awayPoints = awayPoints;


          if (updated) {
            await thisSpread.save()
            if (rtype == 'create') {
              // log('Event create update');
            }
            // log(`Data for event#${thisSpread.eventId} spread was updated`);
          }
        }
      }

      return record;
    }


    if (rtype === 'action') {
      await Betupdate.find({
        eventId: `${eventId}`,
        createdAt: { $gt: record.createdAt },
      });
    }
  } catch (e) {
    log(e)
  }

  return record;
}

async function verifySpreadActions(record, rtype) {
  const { eventId } = record;

  try {
    if (rtype === 'update' || rtype === 'create') {
      const updates = await Betspread.find({
        eventId: `${eventId}`,
        createdAt: { $gt: record.createdAt },
      });

      const nextUpdate = updates[0];
      const queryParams = { $gte: record.createdAt };

      if (nextUpdate) {
        queryParams['$lt'] = nextUpdate.createdAt;
      }

      const actions = await BetAction.find({
        eventId: `${eventId}`,
        createdAt: queryParams,
        'transaction.outcome': { $in: [4, 5] },
      });

      if (actions.length > 0) {
        for (let x = 0; x < actions.length; x += 1) {
          const thisAction = actions[x];
          let updated = false;

          if (thisAction.spreadHomeOdds != record.homeOdds) {
            updated = true;
            thisAction.homeOdds = record.homeOdds;
          }

          if (thisAction.spreadAwayOdds != record.awayOdds) {
            updated = true;
            thisAction.spreadAwayOdds = record.awayOdds;
          }

          if (thisAction.spreadHomePoints != record.homePoints) {
            updated = true;
            thisAction.spreadHomePoints = record.homePoints;
          }


          if (thisAction.spreadAwayPoints != record.awayPoints) {
            updated = true;
            thisAction.spreadAwayPoints = record.awayPoints;
          }

          if (updated) {
            await thisAction.save()
            if (rtype == 'create') {
              // log('Event create update');
            }
            // log(`Spread data for event#${thisAction.eventId} action was updated`);
          }
        }
      }

      return record;
    }


    if (rtype === 'action') {
      await Betupdate.find({
        eventId: `${eventId}`,
        createdAt: { $gt: record.createdAt },
      });
    }
  } catch (e) {
    log(e)
  }

  return record;
}

async function waitForData(eventId, time = 50) {
  return new Promise((resolve) => {
    setTimeout(async () => {
      const data = await BetEvent.find({
        $or: [
          { eventId },
          { evntId: `${eventId}` },
        ],
      });
      return resolve(data);
    }, time);
  });
}

async function getEventData(block, eventId, waitTime = 50) {
  let originalRecord = await BetEvent.findOne({
    eventId: `${eventId}`,
  });

  if (originalRecord == null || originalRecord == undefined) {
    const data = await waitForData(eventId, waitTime);
    originalRecord = data[0];
  }

  let event = {};
  // Getting money line updates that are less or equal to the block the transaction is contained in
  const updates = await Betupdate.find({
    eventId: `${eventId}`,
    createdAt: { $lte: block.createdAt },
  });

  // Get thebettotals that are less or equal to the block the transaction is contained in
  const betTotals = await Bettotal.find({
    eventId: `${eventId}`,
    createdAt: { $lte: block.createdAt },
  });

  if (updates && updates.length > 0) {
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
    let recheck;

    if (event === null) {
      recheck = await waitForData(eventId, 100);
      event = recheck[0];
    }

    event.points = lastTotal ? lastTotal.points : 0;
    event.overOdds = lastTotal ? lastTotal.overOdds : 0;
    event.underOdds = lastTotal? lastTotal.underOdds : 0;
  }

  return { event, updates, betTotals, originalRecord };
}

async function saveOPTransaction(block, rpcTx, vout, transaction, waitTime = 50) {
  const rpctx = rpcTx;
  let createResponse;

  if (rpctx.get === undefined) {
    rpctx.get = (param) => {
      return rpctx[param];
    }
  }

  if (['peerlessEvent'].includes(transaction.txType)) {
    const _id = `${transaction.eventId}${rpctx.get('txid')}${block.height}`;
    const skipRecord = await recordCheck(BetEvent, _id);

    if (skipRecord) {
      return skipRecord;
    }

    try {
      createResponse = await BetEvent.create({
        _id,
        txId: rpctx.get('txid'),
        blockHeight: block.height,
        createdAt: block.createdAt,
        eventId: transaction.eventId,
        timeStamp: transaction.timestamp,
        league: transaction.tournament,
        info: `R${transaction.round}`,
        homeTeam: transaction.homeTeam,
        awayTeam: transaction.awayTeam,
        homeOdds: transaction.homeOdds,
        awayOdds: transaction.awayOdds,
        drawOdds: transaction.drawOdds,
        opString: JSON.stringify(transaction),
        opCode: transaction.opCode,
        transaction,
        matched: true,
      });

      verifyBetOdds(createResponse, 'create');
    } catch (e) {
      createResponse = e;

      logError(e, 'creating bet event', block.height, transaction);
    }

    return createResponse;
  }

  if (['peerlessUpdateOdds'].includes(transaction.txType)) {
    const _id = `${transaction.eventId}${rpctx.get('txid')}${block.height}`;

    const updateExists = await recordCheck(Betupdate, _id);

    if (updateExists) {
      return updateExists;
    }

    const resultExists = await recordCheck(BetResult, `${transaction.eventId}`, 'eventId');

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
      createResponse = await Betupdate.create({
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

      verifyBetOdds(createResponse, 'update');
    } catch (e) {
      logError(e, 'creating event update', block.height, transaction);
    }

    return createResponse;
  }

  if (['peerlessBet'].includes(transaction.txType)) {
    const _id = `${transaction.eventId}${transaction.outcome}${rpctx.get('txid')}${block.height}`;
    const betExists = await recordCheck(BetAction, _id);

    if (betExists) {
      // log(`Bet update ${_id} already on record`);
      return betExists;
    }

    try {
      const { event, originalRecord } = await getEventData(block, transaction.eventId, waitTime);

      const eventRecord = event || {};
      let lastSpread;

      if ([4, 5].includes(transaction.outcome)) {
        const spreadRecords = await Betspread.find({
          eventId: transaction.eventId,
          createdAt: { $lte: block.createdAt },
        });
    
        lastSpread = spreadRecords[spreadRecords.length - 1];
      }

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
          spreadHomePoints: lastSpread ? lastSpread.homePoints : 0,
          spreadAwayPoints: lastSpread ? lastSpread.awayPoints : 0,
          spreadHomeOdds: lastSpread ? lastSpread.homeOdds : 0,
          spreadAwayOdds: lastSpread ? lastSpread.awayOdds : 0,
          transaction,
          matched: !event ? false : true,
        });

        if (!event) {
          log(`Error finding event#${transaction.eventId} data. Creating transaction error record at height ${block.height}`);
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
    const spreadExists = await recordCheck(Betspread, _id);
    let mhomeOdds;
    let mawayOdds;
    let matched;

    if (spreadExists) {
      return spreadExists;
    }

    const { spreadPoints } = transaction;

    const moneyLine = await Betupdate.find({
      eventId: transaction.eventId,
      createdAt: { $lte: block.createdAt },
    });

    let lastMoneyLine = moneyLine[moneyLine.length - 1];

    // const homePoints = (transaction.homeOdds < transaction.awayOdds) ? -(spreadPoints) : spreadPoints;
    // const awayPoints = (transaction.homeOdds > transaction.awayOdds) ? -(spreadPoints) : spreadPoints;

    if (!lastMoneyLine) {
      let moneyLineEvent = await BetEvent.findOne({ eventId: `${transaction.eventId}` });

      if (!moneyLineEvent) {
        let moneyLineData = await waitForData(transaction.eventId, 150);
        moneyLineEvent = moneyLineData[0];
      }
      lastMoneyLine = moneyLineEvent;
      try {
        lastMoneyLine.opObject = lastMoneyLine.transaction;
        mhomeOdds = lastMoneyLine.opObject.get('homeOdds');
        mawayOdds = lastMoneyLine.opObject.get('awayOdds');
        matched = true;
      } catch (e) {
        // console.log(`Unmatched spread for event#${transaction.eventId} at height ${block.height}`);
        mhomeOdds = transaction.homeOdds;
        mawayOdds = transaction.awayOdds;;
        matched = false;
      }
    }

    // mhomeOdds = lastMoneyLine.opObject.get('homeOdds');
    // mawayOdds = lastMoneyLine.opObject.get('awayOdds');

    const homePoints = (mhomeOdds < mawayOdds) ? -(spreadPoints) : spreadPoints;
    const awayPoints = (mhomeOdds > mawayOdds) ? -(spreadPoints) : spreadPoints;

    try {
      createResponse = await Betspread.create({
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
        mhomeOdds,
        mawayOdds,
        matched,
      });

      verifySpreadActions(createResponse, 'update');
    } catch (e) {
      logError(e, 'creating spreads data', block.height, transaction);
    }

    return createResponse;
  }

  if (['peerlessTotalsMarket'].includes(transaction.txType)) {
    const _id = `TM${transaction.eventId}${rpctx.get('txid')}${block.height}`;
    const spreadExists = await recordCheck(Bettotal, _id);

    if (spreadExists) {
      return spreadExists;
    }

    try {
      createResponse = await Bettotal.create({
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
    const resultExists = await recordCheck(BetResult, _id);

    if (resultExists) {
      return resultExists;
    }


    try {
      let resultPayoutTxs = await TX.find({ blockHeight: block.height + 1 });

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
  const transactionsExists = await recordCheck(Transaction, transactionId);

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
    betValue: vout.value || 0,
    matched: false,
  });
}

module.exports = {
  deleteBetData,
  recordCheck,
  saveOPTransaction,
  getBetData,
  getEventData,
};
