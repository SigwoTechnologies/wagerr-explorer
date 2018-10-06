const { BigNumber } = require('bignumber.js')

const chain = require('../../lib/blockchain');
const { forEach } = require('p-iteration');
const moment = require('moment');
const { rpc } = require('../../lib/cron');

// System models for query and etc.
const Block = require('../../model/block');
const Coin = require('../../model/coin');
const Masternode = require('../../model/masternode');
const Peer = require('../../model/peer');
const Rich = require('../../model/rich');
const TX = require('../../model/tx');
const UTXO = require('../../model/utxo');
const STXO = require('../../model/stxo');
const ListEvent = require('../../model/listevent');
const BetEvent = require('../../model/betevent');
const BetAction = require('../../model/betaction');
const BetResult = require('../../model/betresult');

/**
 * Get transactions and unspent transactions by address.
 * @param {Object} req The request object.
 * @param {Object} res The response object.
 */
const getAddress = async (req, res) => {
  try {
    const txs = await TX
      .aggregate([
        {$match: {$or: [{'vout.address': req.params.hash},{'vin.address': req.params.hash}]}},
        {$sort: {blockHeight: -1}}
      ])
      .allowDiskUse(true)
      .exec()

    const sent = txs.filter(tx => tx.vout[0].address !== 'NON_STANDARD')
      .reduce((acc, tx) => acc.plus(tx.vin.reduce((a, t) => {
      if (t.address === req.params.hash) {
        return a.plus(BigNumber(t.value))
      } else {
        return a
      }
    }, BigNumber(0.0))), BigNumber(0.0))

    const received = txs.filter(tx => tx.vout[0].address !== 'NON_STANDARD')
      .reduce((acc, tx) => acc.plus(tx.vout.reduce((a, t) => {
      if (t.address === req.params.hash) {
        return a.plus(BigNumber(t.value))
      } else {
        return a
      }
    }, BigNumber(0.0))), BigNumber(0.0))

    const staked = txs.filter(tx => tx.vout[0].address === 'NON_STANDARD')
      .reduce((acc, tx) => acc.minus(tx.vin.reduce((a, t) => {
        if (t.address === req.params.hash) {
          return a.plus(BigNumber(t.value))
        } else {
          return a
        }
      }, BigNumber(0.0))).plus(tx.vout.reduce((a, t) => {
      if (t.address === req.params.hash) {
        return a.plus(BigNumber(t.value))
      } else {
        return a
      }
    }, BigNumber(0.0))), BigNumber(0.0))

    const balance = received.plus(staked).minus(sent)
    res.json({balance:balance.toNumber(), sent:sent.toNumber(), staked:staked.toNumber(),
      received:received.toNumber(), txs });
  } catch(err) {
    console.log(err);
    res.status(500).send(err.message || err);
  }
};

/**
 * Will return the average block time over 24 hours.
 * @param {Object} req The request object.
 * @param {Object} res The response object.
 */
const getAvgBlockTime = () => {
  // When does the cache expire.
  // For now this is hard coded.
  let cache = 90.0;
  let cutOff = moment().utc().add(60, 'seconds').unix();
  let loading = true;

  // Generate the average.
  const getAvg = async () => {
    loading = true;

    try {
      const date = moment.utc().subtract(24, 'hours').toDate();
      const blocks = await Block.find({ createdAt: { $gt: date } });
      const seconds = 24 * 60 * 60;

      cache = seconds / blocks.length;
      cutOff = moment().utc().add(60, 'seconds').unix();
    } catch(err) {
      console.log(err);
    } finally {
      if (!cache) {
        cache = 0.0;
      }

      loading = false;
    }
  };

  // Load the initial cache.
  getAvg();

  return async (req, res) => {
    res.json(cache || 0.0);

    // If the cache has expired then go ahead
    // and get a new one but return the current
    // cache for this request.
    if (!loading && cutOff <= moment().utc().unix()) {
      await getAvg();
    }
  };
};

/**
 * Will return the average masternode payout time over 24 hours.
 * @param {Object} req The request object.
 * @param {Object} res The response object.
 */
const getAvgMNTime = () => {
  // When does the cache expire.
  // For now this is hard coded.
  let cache = 24.0;
  let cutOff = moment().utc().add(5, 'minutes').unix();
  let loading = true;

  // Generate the average.
  const getAvg = async () => {
    loading = true;

    try {
      const date = moment.utc().subtract(24, 'hours').toDate();
      const blocks = await Block.find({ createdAt: { $gt: date } });
      const mns = await Masternode.find();

      cache = (24.0 / (blocks.length / mns.length));
      cutOff = moment().utc().add(5, 'minutes').unix();
    } catch(err) {
      console.log(err);
    } finally {
      if (!cache) {
        cache = 0.0;
      }

      loading = false;
    }
  };

  // Load the initial cache.
  getAvg();

  return async (req, res) => {
    res.json(cache || 0.0);

    // If the cache has expired then go ahead
    // and get a new one but return the current
    // cache for this request.
    if (!loading && cutOff <= moment().utc().unix()) {
      await getAvg();
    }
  };
};

/**
 * Get block by hash or height.
 * @param {Object} req The request object.
 * @param {Object} res The response object.
 */
const getBlock = async (req, res) => {
  try {
    const query = isNaN(req.params.hash)
      ? { hash: req.params.hash }
      : { height: req.params.hash };
    const block = await Block.findOne(query);
    if (!block) {
      res.status(404).send('Unable to find the block!');
      return;
    }

    const txs = await TX.find({ txId: { $in: block.txs }});

    res.json({ block, txs });
  } catch(err) {
    console.log(err);
    res.status(500).send(err.message || err);
  }
};

/**
 * Return the coin information.
 * @param {Object} req The request object.
 * @param {Object} res The response object.
 */
const getCoin = (req, res) => {
  Coin.findOne()
    .sort({ createdAt: -1 })
    .then((doc) => {
      res.json(doc);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send(err.message || err);
    });
};

/**
 * Get history of coin information.
 * @param {Object} req The request object.
 * @param {Object} res The response object.
 */
const getCoinHistory = (req, res) => {
  Coin.find()
    .skip(req.query.skip ? parseInt(req.query.skip, 10) : 0)
    .limit(req.query.limit ? parseInt(req.query.limit, 10) : 12) // 12x5=60 mins
    .sort({ createdAt: -1 })
    .then((docs) => {
      res.json(docs);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send(err.message || err);
    });
};

/**
 * Return all the coins for an entire week.
 * Method uses a closure for caching.
 * @param {Object} req The request object.
 * @param {Object} res The response object.
 */
const getCoinsWeek = () => {
  // When does the cache expire.
  // For now this is hard coded.
  let cache = [];
  let cutOff = moment().utc().add(1, 'hour').unix();
  let loading = true;

  // Aggregate the data and build the date list.
  const getCoins = async () => {
    loading = true;

    try {
      const start = moment().utc().subtract(8, 'days').toDate();
      const end = moment().utc().toDate();
      const qry = [
        // Select last 7 days of coins.
        { $match: { createdAt: { $gt: start, $lt: end } } },
        // Sort by _id/date field in ascending order (order -> newer)
        { $sort: { createdAt: 1 } }
      ];

      cache = await Coin.aggregate(qry);
      cutOff = moment().utc().add(90, 'seconds').unix();
    } catch(err) {
      console.log(err);
    } finally {
      loading = false;
    }
  };

  // Load the initial cache.
  getCoins();

  return async (req, res) => {
    res.json(cache);

    // If the cache has expired then go ahead
    // and get a new one but return the current
    // cache for this request.
    if (!loading && cutOff <= moment().utc().unix()) {
      await getCoins();
    }
  };
};

/**
 * Will return true if a block hash.
 * @param {Object} req The request object.
 * @param {Object} res The response object.
 */
const getIsBlock = async (req, res) => {
  try {
    let isBlock = false;

    // Search for block hash.
    const block = await Block.findOne({ hash: req.params.hash });
    if (block) {
      isBlock = true;
    }

    res.json(isBlock);
  } catch(err) {
    console.log(err);
    res.status(500).send(err.message || err);
  }
};

/**
 * Get list of masternodes from the server.
 * @param {Object} req The request object.
 * @param {Object} res The response object.
 */
const getMasternodes = async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 1000;
    const skip = req.query.skip ? parseInt(req.query.skip, 10) : 0;
    const total = await Masternode.find().sort({ lastPaidAt: -1, status: 1 }).count();
    const mns = await Masternode.find().skip(skip).limit(limit).sort({ lastPaidAt: -1, status: 1 });

    res.json({ mns, pages: total <= limit ? 1 : Math.ceil(total / limit) });
  } catch(err) {
    console.log(err);
    res.status(500).send(err.message || err);
  }
};

/**
 * Get a masternode by wallet adress hash from the server.
 * @param {Object} req The request object.
 * @param {Object} res The response object.
 */
const getMasternodeByAddress = async (req, res) => {
  try {
    const hash = req.params.hash;
    const mns = await Masternode.findOne({ addr: hash});

    res.json({ mns });
  } catch(err) {
    console.log(err);
    res.status(500).send(err.message || err);
  }
};

/**
 * Get list of masternodes from the server.
 * @param {Object} req The request object.
 * @param {Object} res The response object.
 */
const getMasternodeCount = async (req, res) => {
  try {
    const coin = await Coin.findOne().sort({ createdAt: -1 });

    res.json({ enabled: coin.mnsOn, total: coin.mnsOff + coin.mnsOn });
  } catch(err) {
    console.log(err);
    res.status(500).send(err.message || err);
  }
};

/**
 * Get the list of peers from the database.
 * @param {Object} req The request object.
 * @param {Object} res The response object.
 */
const getPeer = (req, res) => {
  Peer.find()
    .skip(req.query.skip ? parseInt(req.query.skip, 10) : 0)
    .limit(req.query.limit ? parseInt(req.query.limit, 10) : 500)
    .sort({ ip: 1 })
    .then((docs) => {
      res.json(docs);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send(err.message || err);
    });
};

/**
 * Get coin supply information for usage.
 * https://github.com/coincheckup/crypto-supplies
 * @param {Object} req The request object.
 * @param {Object} res The response object.
 */
const getSupply = async (req, res) => {
  try {
    let c = 0; // Circulating supply.
    let t = 0; // Total supply.

    const utxo = await UTXO.aggregate([
      {$match: {address: {$ne: 'ZERO_COIN_MINT'}}},
      { $group: { _id: 'supply', total: { $sum: '$value' } } }
    ]);

    const info = await rpc.call('getinfo');

    t = utxo[0].total + info.zWGRsupply.total;
    c = t;

    res.json({ c, t });
  } catch(err) {
    console.log(err);
    res.status(500).send(err.message || err);
  }
};

/**
 * Get the top 100 addresses from the database.
 * @param {Object} req The request object.
 * @param {Object} res The response object.
 */
const getTop100 = (req, res) => {
  Rich.find()
    .limit(100)
    .sort({ value: -1 })
    .then((docs) => {
      res.json(docs);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send(err.message || err);
    });
};

/**
 * Return a paginated list of transactions.
 * @param {Object} req The request object.
 * @param {Object} res The response object.
 */
const getTXLatest = (req, res) => {
  TX.find()
    .limit(10)
    .sort({ blockHeight: -1 })
    .then((docs) => {
      res.json(docs);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send(err.message || err);
    });
};

/**
 * Return the transaction information for given hash.
 * @param {Object} req The request object.
 * @param {Object} res The response object.
 */
const getTX = async (req, res) => {
  try {
    const query = isNaN(req.params.hash)
      ? { txId: req.params.hash }
      : { height: req.params.hash };
    const tx = await TX.findOne(query);
    if (!tx) {
      res.status(404).send('Unable to find the transaction!');
      return;
    }

    // Get the transactions that are found in the
    // vin section of the tx.
    const vin = [];
    await forEach(tx.vin, async (vi) => {
      if (tx.vout[0].address === 'NON_STANDARD' && !vi.coinbase){
        vin.push({coinstake:true});
      } else if(vi.isZcSpend){
        vin.push({isZcSpend:true, value: vi.sequence});
      }else if (vi.txId) {
        const t = await TX.findOne({ txId: vi.txId });
        if (!!t) {
          t.vout.forEach((vo) => {
            if (vo.n === vi.vout) {
              vin.push({ address: vo.address, value: vo.value });
            }
          });
        }
      } else if (vi.coinbase) {
        vin.push(vi);
      }
    });

    res.json({ ...tx.toObject(), vin });
  } catch(err) {
    console.log(err);
    res.status(500).send(err.message || err);
  }
};

/**
 * Return a paginated list of transactions.
 * @param {Object} req The request object.
 * @param {Object} res The response object.
 */
const getTXs = async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
    const skip = req.query.skip ? parseInt(req.query.skip, 10) : 0;
    const total = await TX.find().sort({ blockHeight: -1 }).count();
    const txs = await TX.find().skip(skip).limit(limit).sort({ blockHeight: -1 });

    res.json({ txs, pages: total <= limit ? 1 : Math.ceil(total / limit) });
  } catch(err) {
    console.log(err);
    res.status(500).send(err.message || err);
  }
};

/**
 * Return all the transactions for an entire week.
 * Method uses a closure for caching.
 * @param {Object} req The request object.
 * @param {Object} res The response object.
 */
const getTXsWeek = () => {
  // When does the cache expire.
  // For now this is hard coded.
  let cache = [];
  let cutOff = moment().utc().add(1, 'hour').unix();
  let loading = true;

  // Aggregate the data and build the date list.
  const getTXs = async () => {
    loading = true;

    try {
      const start = moment().utc().startOf('day').subtract(7, 'days').toDate();
      const end = moment().utc().endOf('day').subtract(1, 'days').toDate();
      const qry = [
        // Select last 7 days of txs.
        { $match: { createdAt: { $gt: start, $lt: end } } },
        // Convert createdAt date field to date string.
        { $project: { date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } } } },
        // Group by date string and build total/sum.
        { $group: { _id: '$date', total: { $sum: 1 } } },
        // Sort by _id/date field in ascending order (order -> newer)
        { $sort: { _id: 1 } }
      ];

      cache = await TX.aggregate(qry);
      cutOff = moment().utc().add(90, 'seconds').unix();
    } catch(err) {
      console.log(err);
    } finally {
      loading = false;
    }
  };

  // Load the initial cache.
  getTXs();

  return async (req, res) => {
    res.json(cache);

    // If the cache has expired then go ahead
    // and get a new one but return the current
    // cache for this request.
    if (!loading && cutOff <= moment().utc().unix()) {
      await getTXs();
    }
  };
};

const getListEvents = async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 1000;
    const skip = req.query.skip ? parseInt(req.query.skip, 10) : 0;
    const total = await ListEvent.find().sort({ starting: 1 }).count();
    const events = await ListEvent.find().skip(skip).limit(limit).sort({ starting: 1});

    res.json({ events, pages: total <= limit ? 1 : Math.ceil(total / limit) });
  } catch(err) {
    console.log(err);
    res.status(500).send(err.message || err);
  }
};

const getBetEvents = async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 1000
    const skip = req.query.skip ? parseInt(req.query.skip, 10) : 0
    if (req.query.eventId) {
      const eventId = req.query.eventId
      const total = await BetEvent.find({eventId: eventId}).sort({createdAt: 1}).count()
      const events = await BetEvent.find({eventId: eventId}).skip(skip).limit(limit).sort({createdAt: 1})
      res.json({events, pages: total <= limit ? 1 : Math.ceil(total / limit)})
    } else {
      const total = await BetEvent.find().sort({createdAt: 1}).count()
      const events = await BetEvent.find().skip(skip).limit(limit).sort({createdAt: 1})
      res.json({events, pages: total <= limit ? 1 : Math.ceil(total / limit)})
    }

  } catch (err) {
    console.log(err)
    res.status(500).send(err.message || err)
  }
}

const getBetActions = async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 1000
    const skip = req.query.skip ? parseInt(req.query.skip, 10) : 0
    if (req.query.eventId) {
      const eventId = req.query.eventId
      const total = await BetAction.find({eventId: eventId}).sort({createdAt: 1}).count()
      const actions = await BetAction.find({eventId: eventId}).skip(skip).limit(limit).sort({createdAt: 1})
      res.json({actions, pages: total <= limit ? 1 : Math.ceil(total / limit)})
    } else {
      const total = await BetAction.find().sort({createdAt: 1}).count()
      const actions = await BetAction.find().skip(skip).limit(limit).sort({createdAt: 1})
      res.json({actions, pages: total <= limit ? 1 : Math.ceil(total / limit)})
    }
  } catch (err) {
    console.log(err)
    res.status(500).send(err.message || err)
  }
}

const getBetResults = async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 1000
    const skip = req.query.skip ? parseInt(req.query.skip, 10) : 0
    if (req.query.eventId) {
      const eventId = req.query.eventId
      const total = await BetResult.find({eventId: eventId}).sort({createdAt: 1}).count()
      const results = await BetResult.find({eventId: eventId}).skip(skip).limit(limit).sort({createdAt: 1})
      res.json({results, pages: total <= limit ? 1 : Math.ceil(total / limit)})
    } else {
      const total = await BetResult.find().sort({createdAt: 1}).count()
      const results = await BetResult.find().skip(skip).limit(limit).sort({createdAt: 1})
      res.json({results, pages: total <= limit ? 1 : Math.ceil(total / limit)})
    }

  } catch (err) {
    console.log(err)
    res.status(500).send(err.message || err)
  }
}

const getBetActioinsWeek = () => {
  // When does the cache expire.
  // For now this is hard coded.
  let cache = [];
  let cutOff = moment().utc().add(1, 'hour').unix();
  let loading = true;

  // Aggregate the data and build the date list.
  const getBetActioinsWeek = async () => {
    loading = true;

    try {
      const start = moment().utc().startOf('day').subtract(7, 'days').toDate();
      const end = moment().utc().endOf('day').subtract(1, 'days').toDate();
      const qry = [
        // Select last 7 days of bets.
        { $match: { createdAt: { $gt: start, $lt: end } } },
        // Convert createdAt date field to date string.
        { $project: { date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } } } },
        // Group by date string and build total/sum.
        { $group: { _id: '$date', total: { $sum: 1 } } },
        // Sort by _id/date field in ascending order (order -> newer)
        { $sort: { _id: 1 } }
      ];

      cache = await BetAction.aggregate(qry);
      cutOff = moment().utc().add(90, 'seconds').unix();
    } catch(err) {
      console.log(err);
    } finally {
      loading = false;
    }
  };

  // Load the initial cache.
  getBetActioinsWeek();

  return async (req, res) => {
    res.json(cache);

    // If the cache has expired then go ahead
    // and get a new one but return the current
    // cache for this request.
    if (!loading && cutOff <= moment().utc().unix()) {
      await getBetActioinsWeek();
    }
  };
};

const getBetEventInfo = async (req, res) => {
  const eventId = req.params.eventId
  let results
  let payouttxs
  try {
    results = await BetResult.find({eventId: eventId}).sort({createdAt: 1})
    payouttxs = await TX.find({blockHeight: results[0].blockHeight+1})
  }catch (e) {
    console.log("Bet Event Not Publish")
  }

  try {
    const events = await BetEvent.find({eventId: eventId}).sort({createdAt: 1})
    const homeBets = await BetAction.find({eventId: eventId, betChoose: events[0].homeTeam})
    const awayBets = await BetAction.find({eventId: eventId, betChoose: events[0].awayTeam})
    const drawBets = await BetAction.find({eventId: eventId, betChoose: 'DRW'})
    res.json({events, homeBets: homeBets, awayBets: awayBets, drawBets: drawBets,results,payouttxs})
  } catch (err) {
    console.log(err)
    res.status(500).send(err.message || err)
  }
}

const getBetEventsInfo = async (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : 1000
  const skip = req.query.skip ? parseInt(req.query.skip, 10) : 0
  try {
    const total = await BetEvent.aggregate([
      {
        $group: {
          _id: '$eventId',
        },
      }, {
        $count: 'count'
      }])
    const result = await BetEvent.aggregate([
      {
        $group: {
          _id: '$eventId',
          events: {
            $push: '$$ROOT'
          },
        },
      },
      {
        $project: {
          _id: '$_id',
          events: '$events',
          timeStamp: {$arrayElemAt: [ "$events.timeStamp", 0 ]}
        }
      },
      {
        $sort: {
          timeStamp: -1
        }
      }, {
        $skip: skip
      }, {
        $limit: limit
      }, {
        $lookup: {
          from: 'betactions',
          localField: '_id',
          foreignField: 'eventId',
          as: 'actions'
        }
      }, {
        $lookup: {
          from: 'betresults',
          localField: '_id',
          foreignField: 'eventId',
          as: 'results'
        }
      },
      {
        $project: {

          _id: '$_id',
          events: '$events',
          timeStamp: '$timeStamp',
          actions: '$actions',
          results: '$results',
          payoutBlockHeight: {$add: [{$arrayElemAt: ['$results.blockHeight', 0]}, 1]}
        }
      },
      {
        $lookup: {
          from: 'txs',
          let: { 'payoutBlockHeight': '$payoutBlockHeight'},
          pipeline: [
            {$match:
                { $and:
                    [ {$expr: {$eq: ["$blockHeight", "$$payoutBlockHeight"]}},
                    ]
                }}
          ],
          as: 'payouttxs'
        }
      }
    ])
    res.json({data:result, pages: total[0].count <= limit ? 1 : Math.ceil(total[0].count/ limit)})
  } catch (err) {
    console.log(err)
    res.status(500).send(err.message || err)
  }
}

module.exports =  {
  getAddress,
  getAvgBlockTime,
  getAvgMNTime,
  getBlock,
  getCoin,
  getCoinHistory,
  getCoinsWeek,
  getIsBlock,
  getMasternodes,
  getMasternodeByAddress,
  getMasternodeCount,
  getPeer,
  getSupply,
  getTop100,
  getTXLatest,
  getTX,
  getTXs,
  getTXsWeek,
  getListEvents,
  getBetEvents,
  getBetActions,
  getBetResults,
  getBetActioinsWeek,
  getBetEventInfo,
  getBetEventsInfo
};
