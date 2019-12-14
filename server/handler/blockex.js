const _ = require('lodash');
const moment = require('moment');
const { BigNumber } = require('bignumber.js');
const { forEach } = require('p-iteration');

const { getSubsidy } = require('../../lib/blockchain');
const chain = require('../../lib/blockchain');
const { rpc } = require('../../lib/cron');

const { CarverAddressType, CarverMovementType, CarverTxType } = require('../../lib/carver2d');
const { CarverAddress, CarverMovement, CarverAddressMovement } = require('../../model/carver2d');

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
const BetUpdate = require('../../model/betupdate');
const BetAction = require('../../model/betaction');
const BetResult = require('../../model/betresult');
const Proposal = require('../../model/proposal');
const Statistic = require('../../model/statistic');
const Betspread = require('../../model/betspread');
const Bettotal = require('../../model/bettotal');
// Lotto models
const LottoEvent = require('../../model/lottoevent');
const LottoBet = require('../../model/lottobet');
const LottoResult = require('../../model/lottoresult');


/**
 * Get transactions and unspent transactions by address.
 * @param {Object} req The request object.
 * @param {Object} res The response object.
 */
const getAddress = async (req, res) => {
  try {
    const txs = await TX
      .aggregate([
        { $match: { $or: [{ 'vout.address': req.params.hash }, { 'vin.address': req.params.hash }] } },
        { $sort: { blockHeight: -1 } },
      ])
      .allowDiskUse(true)
      .exec();

    const sent = txs.filter((tx) => tx.vout[0].address !== 'NON_STANDARD')
      .reduce((acc, tx) => acc.plus(tx.vin.reduce((a, t) => {
        if (t.address === req.params.hash) {
          return a.plus(BigNumber(t.value));
        }

        return a;
      }, BigNumber(0.0))), BigNumber(0.0));

    const received = txs.filter((tx) => tx.vout[0].address !== 'NON_STANDARD')
      .reduce((acc, tx) => acc.plus(tx.vout.reduce((a, t) => {
        if (t.address === req.params.hash) {
          return a.plus(BigNumber(t.value));
        }

        return a;
      }, BigNumber(0.0))), BigNumber(0.0));

    const staked = txs.filter((tx) => tx.vout[0].address === 'NON_STANDARD')
      .reduce((acc, tx) => acc.minus(tx.vin.reduce((a, t) => {
        if (t.address === req.params.hash) {
          return a.plus(BigNumber(t.value));
        }

        return a;
      }, BigNumber(0.0))).plus(tx.vout.reduce((a, t) => {
        if (t.address === req.params.hash) {
          return a.plus(BigNumber(t.value));
        }

        return a;
      }, BigNumber(0.0))), BigNumber(0.0));

    const balance = received.plus(staked).minus(sent);
    res.json({
      balance: balance.toNumber(),
      sent: sent.toNumber(),
      staked: staked.toNumber(),
      received: received.toNumber(),
      txs,
    });
  } catch (err) {
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
    } catch (err) {
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
    } catch (err) {
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
  } catch (err) {
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
      res.json({ ...doc._doc, wgr: 1 });
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
    } catch (err) {
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
  } catch (err) {
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
    const total = await Masternode.find().sort({ lastPaidAt: -1, status: 1 }).countDocuments();
    const mns = await Masternode.find().skip(skip).limit(limit).sort({ lastPaidAt: -1, status: 1 });

    res.json({ mns, pages: total <= limit ? 1 : Math.ceil(total / limit) });
  } catch (err) {
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
    const { hash } = req.params;
    const mns = await Masternode.findOne({ addr: hash });

    res.json({ mns });
  } catch (err) {
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
  } catch (err) {
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
    const info = await rpc.call('getinfo');
    res.json(info.moneysupply);
  } catch (err) {
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

const getTop1002 = async (req, res) => {
  try {
    const docs = await cache.getFromCache("top100", moment().utc().add(1, 'hours').unix(), async () => {
      const top100Addresses = await CarverAddress.find({ carverAddressType: CarverAddressType.Address }, { sequence: 0 })
        .limit(100)
        .sort({ balance: -1 }).populate({ path: "lastMovement", select: { carverMovement: 1 }, populate: { path: 'carverMovement', select: { date: 1 } } }); //@todo remove lastMovement;

      // For each address split them into 3 address (MN,POS,POW). Add each address to an array.
      const addressesToFetch = top100Addresses.reduce((addressesToFetch, address) => {
        return [
          ...addressesToFetch,
          `${address.label}:MN`,
          `${address.label}:POS`,
          `${address.label}:POW`
        ]
      }, []);
      const rewardAddressBalances = await CarverAddress.find({ label: { $in: addressesToFetch } }, { _id: 0, label: 1, valueOut: 1 })

      // For each top 100 address find any matching rewards addresses and calculate the total rewards for that address
      const addressesWithBalances = top100Addresses.map((address) => {
        // Calculate the total rewards sum for a specific address
        const rewardsSumValue = rewardAddressBalances.reduce((sum, rewardAddress) => {
          return sum + ([`${address.label}:MN`, `${address.label}:POS`, `${address.label}:POW`].includes(rewardAddress.label) ? rewardAddress.valueOut : 0);
        }, 0);

        return {
          ...address.toObject(),
          rewardsSumValue
        }
      });

      return addressesWithBalances;
    });

    res.json(docs);
  } catch (err) {
    console.log(err);
    res.status(500).send(err.message || err);
  }
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
      if (tx.vout[0].address === 'NON_STANDARD' && !vi.coinbase) {
        vin.push({ coinstake: true });
      } else if (vi.isZcSpend) {
        vin.push({ isZcSpend: true, value: vi.sequence });
      } else if (vi.txId) {
        const t = await TX.findOne({ txId: vi.txId });
        if (t) {
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
  } catch (err) {
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
    const total = await TX.find().sort({ blockHeight: -1 }).countDocuments();
    const txs = await TX.find().skip(skip).limit(limit).sort({ blockHeight: -1 });

    res.json({ txs, pages: total <= limit ? 1 : Math.ceil(total / limit) });
  } catch (err) {
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
      const start = moment().utc().startOf('day').subtract(7, 'days')
        .toDate();
      const end = moment().utc().endOf('day').subtract(1, 'days')
        .toDate();
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
    } catch (err) {
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
    const total = await ListEvent.find().sort({ starting: 1 }).countDocuments();
    const events = await ListEvent.find().skip(skip).limit(limit).sort({ starting: 1});

    res.json({ events, pages: total <= limit ? 1 : Math.ceil(total / limit) });
  } catch (err) {
    console.log(err);
    res.status(500).send(err.message || err);
  }
};

const getBetEvents = async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 1000;
    const skip = req.query.skip ? parseInt(req.query.skip, 10) : 0;
    if (req.query.eventId) {
      const { eventId } = req.query;
      const total = await BetEvent.find({
        eventId,
        visibility: true,
      }).sort({ createdAt: 1 }).countDocuments();
      const events = await BetEvent.find({
        eventId,
        visibility: true,
      }).skip(skip).limit(limit).sort({ createdAt: 1 });
      res.json({
        events,
        pages: total <= limit ? 1 : Math.ceil(total / limit),
      });
    } else {
      const total = await BetEvent.find({
        visibility: true,
      }).sort({ createdAt: 1 }).countDocuments();
      const events = await BetEvent.find({
        visibility: true,
      }).skip(skip).limit(limit).sort({ createdAt: 1 });
      res.json({ events, pages: total <= limit ? 1 : Math.ceil(total / limit) });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send(err.message || err);
  }
};

const getBetActions = async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 1000;
    const skip = req.query.skip ? parseInt(req.query.skip, 10) : 0;
    if (req.query.eventId) {
      const { eventId } = req.query;
      const total = await BetAction.find({
        eventId,
        visibility: true,
      }).sort({ createdAt: 1 }).countDocuments();
      const actions = await BetAction.find({
        eventId,
        visibility: true,
      }).skip(skip).limit(limit).sort({ createdAt: 1 });
      res.json({ actions, pages: total <= limit ? 1 : Math.ceil(total / limit) });
    } else {
      const total = await BetAction.find({
        visibility: true,
      }).sort({ createdAt: 1 }).countDocuments();
      const actions = await BetAction.find({
        visibility: true,
      }).skip(skip).limit(limit).sort({ createdAt: 1 });
      res.json({ actions, pages: total <= limit ? 1 : Math.ceil(total / limit) });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send(err.message || err);
  }
};

const getBetResults = async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 1000;
    const skip = req.query.skip ? parseInt(req.query.skip, 10) : 0;
    if (req.query.eventId) {
      const { eventId } = req.query;
      const total = await BetResult.find({
        eventId,
        visibility: true,
      }).sort({ createdAt: 1 }).countDocuments();
      const results = await BetResult.find({
        eventId,
        visibility: true,
      }).skip(skip).limit(limit).sort({ createdAt: 1 });
      res.json({ results, pages: total <= limit ? 1 : Math.ceil(total / limit) });
    } else {
      const total = await BetResult.find({
        visibility: true,
      }).sort({ createdAt: 1 }).countDocuments();
      const results = await BetResult.find({
        visibility: true,
      }).skip(skip).limit(limit).sort({ createdAt: 1 });
      res.json({ results, pages: total <= limit ? 1 : Math.ceil(total / limit) });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send(err.message || err);
  }
};

const getBetspreads = async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 1000;
    const skip = req.query.skip ? parseInt(req.query.skip, 10) : 0;
    if (req.query.eventId) {
      const { eventId } = req.query;
      const total = await Betspread.find({
        eventId: `${eventId}`,
        visibility: true,
      }).sort({ createdAt: 1 }).countDocuments();
      const results = await Betspread.find({
        eventId: `${eventId}`,
        visibility: true,
      }).skip(skip).limit(limit).sort({ createdAt: 1 });
      res.json({ results, pages: total <= limit ? 1 : Math.ceil(total / limit) });
    } else {
      const total = await Betspread.find({
        visibility: true,
      }).sort({ createdAt: 1 }).countDocuments();
      const results = await Betspread.find({
        visibility: true,
      }).skip(skip).limit(limit).sort({ createdAt: 1 });
      res.json({ results, pages: total <= limit ? 1 : Math.ceil(total / limit) });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send(err.message || err);
  }
};

const getBetTotals = async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 1000;
    const skip = req.query.skip ? parseInt(req.query.skip, 10) : 0;
    if (req.query.eventId) {
      const { eventId } = req.query;
      const total = await Bettotal.find({
        eventId: `${eventId}`,
        visibility: true,
      }).sort({ createdAt: 1 }).countDocuments();
      const results = await Bettotal.find({
        eventId: `${eventId}`,
        visibility: true,
      }).skip(skip).limit(limit).sort({ createdAt: 1 });
      res.json({ results, pages: total <= limit ? 1 : Math.ceil(total / limit) });
    } else {
      const total = await Bettotal.find({
        visibility: true,
      }).sort({ createdAt: 1 }).countDocuments();
      const results = await Bettotal.find({
        visibility: true,
      }).skip(skip).limit(limit).sort({ createdAt: 1 });
      res.json({ results, pages: total <= limit ? 1 : Math.ceil(total / limit) });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send(err.message || err);
  }
};

const getData = async (Model, req, res, visibility = true) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 1000;
    const skip = req.query.skip ? parseInt(req.query.skip, 10) : 0;
    
    if (req.query.eventId) {
      const { eventId } = req.query;

      const queryParam = {
        eventId: `${eventId}`,
      };
  
      if (visibility) {
        queryParam.visibility =  true;
      }

      const total = await Model
        .find(queryParam)
        .sort({ createdAt: 1 })
        .countDocuments();

      const results = await Model
      .find(queryParam)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: 1 });

      res.json({ results, pages: total <= limit ? 1 : Math.ceil(total / limit) });
    } else {
      const total = await Model.find({
        visibility: true,
      }).sort({ createdAt: 1 }).countDocuments();
      const results = await Model.find({
        visibility: true,
      }).skip(skip).limit(limit).sort({ createdAt: 1 });
      res.json({
        data: results,
        actions: results,
        results,
        pages: total <= limit ? 1 : Math.ceil(total / limit),
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send(err.message || err);
  }
};

// Modified this a bit - kyle h
const getDataListing = async (Model, actions, results, req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : 1000;
  const skip = req.query.skip ? parseInt(req.query.skip, 10) : 0;
  try {
    const totalParams = [
      {
        $group: {
          _id: '$eventId',
        },
      }, {
        $count: 'count',
      },
    ];
    const total = await Model.aggregate(totalParams);

    const resultParams = [
      {
        $group: {
          _id: '$eventId',
          events: {
            $push: '$$ROOT',
          },
        },
      },
      {
        $project: {
          _id: '$_id',
          events: '$events',
          timeStamp: { $arrayElemAt: ['$events.timeStamp', 0] },
        },
      },
      {
        $sort: {
          timeStamp: -1,
          _id: -1,
        },
      }, {
        $skip: skip,
      }, {
        $limit: limit,
      }, {
        $lookup: {
          from: actions,
          localField: '_id',
          foreignField: 'eventId',
          as: 'actions',
        },
      }, {
        $lookup: {
          from: results,
          localField: '_id',
          foreignField: 'eventId',
          as: 'results',
        },
      },
    ];

    const result = await Model.aggregate(resultParams);

    res.json({
      data: result,
      pages: total[0].count <= limit ? 1 : Math.ceil(total[0].count / limit),
    });
  } catch (err) {
    console.log(err);
    res.status(500).send(err.message || err);
  }
};

const getAltDataListing = async (Model, actions, results, req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : 1000;
  const skip = req.query.skip ? parseInt(req.query.skip, 10) : 0;
  try {
    const total = await Model.aggregate([
      {
        $group: {
          _id: '$eventId',
        },
      }, {
        $count: 'count',
      },
    ]);
    const result = await Model.aggregate([
      {
        $group: {
          _id: '$eventId',
          events: {
            $push: '$$ROOT',
          },
        },
      },
      {
        $project: {
          _id: '$_id',
          events: '$events',
          createdAt: { $arrayElemAt: ['$events.createdAt', 0] },
        },
      },
      {
        $sort: {
          createdAt: -1,
          _id: -1,
        },
      }, {
        $skip: skip,
      }, {
        $limit: limit,
      }, {
        $lookup: {
          from: actions,
          localField: '_id',
          foreignField: 'eventId',
          as: 'actions',
        },
      }, {
        $lookup: {
          from: results,
          localField: '_id',
          foreignField: 'eventId',
          as: 'results',
        },
      },
    ]);
    res.json({
      data: result,
      pages: total[0].count <= limit ? 1 : Math.ceil(total[0].count / limit),
    });
  } catch (err) {
    console.log(err);
    res.status(500).send(err.message || err);
  }
};

const getLottoEvents = async (req, res) => getAltDataListing(LottoEvent, 'lottobets', 'lottoresults', req, res);
// const getLottoEvents = async (req, res) =>  getData(LottoEvent, req, res);
const getLottoBets = async (req, res) => getData(LottoBet, req, res, false);
const getLottoResults = async (req, res) => getData(LottoResult, req, res);

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
      const start = moment()
        .utc()
        .startOf('day')
        .subtract(7, 'days')
        .toDate();
      const end = moment()
        .utc()
        .endOf('day')
        .subtract(1, 'days')
        .toDate();
      const qry = [
        // Select last 7 days of bets.
        { $match: { createdAt: { $gt: start, $lt: end } } },
        // Convert createdAt date field to date string.
        { $project: { date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } } } },
        // Group by date string and build total/sum.
        { $group: { _id: '$date', total: { $sum: 1 } } },
        // Sort by _id/date field in ascending order (order -> newer)
        { $sort: { _id: 1 } },
      ];

      cache = await BetAction.aggregate(qry);
      cutOff = moment().utc().add(90, 'seconds').unix();
    } catch (err) {
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
  const { eventId } = req.params;
  let results;
  try {
    results = await BetResult.find({
      eventId,
      visibility: true,
    }).sort({ createdAt: 1 });
  } catch (e) {
    console.log('Bet Event Not Published');
  }
  try {
    const events = await BetEvent.find({
      eventId,
      visibility: true,
    }).sort({ createdAt: 1 });
    const homeTeamNames = [];
    const awayTeamNames = [];
    events.forEach((event) => {
      if (homeTeamNames.indexOf(event.homeTeam) === -1) {
        homeTeamNames.push(event.homeTeam);
      }
      if (awayTeamNames.indexOf(event.awayTeam) === -1) {
        awayTeamNames.push(event.awayTeam);
      }
    });

    // We add how home teams are represented in bets with new opCodes
    homeTeamNames.push('Money Line - Home Win');
    homeTeamNames.push('Spreads - Home');
    // We add how home teams are represented in bets with new opCodes
    awayTeamNames.push('Money Line - Away Win');
    awayTeamNames.push('Spreads - Away');
    // We create the array that contains draw values
    const drawResults = ['DRW', 'Money Line - Draw'];

    const homeBets = await BetAction.find({
      eventId,
      visibility: true,
      betChoose: { $in: homeTeamNames },
    });
    const awayBets = await BetAction.find({
      eventId,
      visibility: true,
      betChoose: { $in: awayTeamNames },
    });
    const drawBets = await BetAction.find({
      eventId,
      visibility: true,
      betChoose: { $in: drawResults },
    });

    // These will return only one event with the latest updated odds
    // (with possibility of duplicates), but contains the original odds the event was created with.
    // We update them to these original
    // values for the frontend
    const formattedEvents = [];

    if (events.length > 0) {
      await events.forEach((e) => {
        const event = JSON.parse(JSON.stringify(e));

        event.homeOdds = event.transaction.homeOdds;
        event.awayOdds = event.transaction.awayOdds;
        event.drawOdds = event.transaction.drawOdds;

        formattedEvents.push(event);
      });

      // We also query event updates
      const updates = await BetUpdate.find({
        eventId: `${eventId}`,
        visibility: true,
      }).sort({ createdAt: 1 });

      await updates.forEach((u) => {
        const update = JSON.parse(JSON.stringify(u));

        update.homeOdds = update.opObject.homeOdds;
        update.awayOdds = update.opObject.awayOdds;
        update.drawOdds = update.opObject.drawOdds;

        formattedEvents.push(update);

        /* if (
          update.homeOdds > 0
          && update.awayOdds > 0
          && update.drawOdds > 0
        ) {
          formattedEvents.push(update);
        } */
      });
    }

    res.json({
      events: formattedEvents,
      homeBets,
      awayBets,
      drawBets,
      results,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send(err.message || err);
  }
};

const getLottoEventInfo = async (req, res) => {
  const { eventId } = req.params;
  let results;
  try {
    results = await LottoResult.find({
      eventId,
      visibility: true,
    }).sort({createdAt: 1})
  } catch (e) {
    console.log(e);
    console.log('Lot Event Not Published');
  }

  try {
    const events = await LottoEvent.find({
      eventId,
      visibility: true,
    }).sort({ createdAt: 1 });

    const bets = await LottoBet.find({ eventId, visibility: true });

    // These will return only one event with the latest updated odds
    // (with possibility of duplicates), but contains the original odds the event was created with.
    // We update them to these original values for the frontend

    res.json({ events, bets, results });
  } catch (err) {
    console.log(err);
    res.status(500).send(err.message || err);
  }
};

const getBetEventsInfo = async (req, res) => getDataListing(BetEvent, 'betactions', 'betresults', req, res);


const getBetQuery2 = async (req, res) => {
  try {
    const { query } = req;
    const { search } = query;

    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 1000
    const skip = req.query.skip ? parseInt(req.query.skip, 10) : 0

    if (!query) {
      return res.status(500).json({ error: true, message: 'No search specified' });
    }

    const params = [];

    if (isNaN(search)) {
      params.push({ txId: search },);
      params.push({ homeTeam: { $regex: `.*${search}.*` } });
      params.push({ awayTeam: { $regex: `.*${search}.*` } });
      params.push({ tournament: { $regex: `.*${search}.*` } });
      params.push({ 'transaction.sport': { $regex: `.*${search}.*` } });
      params.push({ 'transaction.tournament': search });
      params.push({ 'transaction.tournament': { $regex: `.*${search}.*` } });
    } else {
      params.push({ blockHeight: search });
      params.push({ eventId: search });
    }

    const total = await BetEvent.find({
      $or: params,
    }).sort({createdAt: 1}).countDocuments()

    const results = await BetEvent.find({
      $or: params,
    }).skip(skip).limit(limit).sort({createdAt: 1});


    return res.json({ results, count: results.length, pages: total <= limit ? 1 : Math.ceil(total / limit) });
  } catch (err) {
    console.log(err)
    return res.status(500).send(err.message || err)
  }
};

// Modified this a bit - kyle h
const getDataQuery = async (Model, actions, results, req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : 1000;
  const skip = req.query.skip ? parseInt(req.query.skip, 10) : 0;
  const { query } = req;
  const { search } = query;
  const { sport } = query;

  const orParams = [];

  if (isNaN(search)) {
    orParams.push({ txId: search },);
    orParams.push({ homeTeam: { $regex: `.*${search}.*`, $options: 'i' } });
    orParams.push({ awayTeam: { $regex: `.*${search}.*`, $options: 'i' } });
    orParams.push({ tournament: { $regex: `.*${search}.*`, $options: 'i' } });
    orParams.push({ 'transaction.tournament': { $regex: `.*${search}.*`, $options: 'i' } });
  } else {
    orParams.push({ blockHeight: search });
    orParams.push({ eventId: search });
  }

  const totalMatches = {
    $and: [],
  };

  const resultMatches = {
    $and: [],
  };
  
  if (sport) {
    totalMatches.$and.push({ 'transaction.sport': { $regex: `.*${sport || search}.*`, $options: 'i' }});
    resultMatches.$and.push({ 'transaction.sport': { $regex: `.*${sport || search}.*`, $options: 'i' }});
  }

  if (search) {
    totalMatches.$and.push({ $or: orParams });
    resultMatches.$and.push({ $or: orParams })
  }


  try {
    const totalParams = [
      {
        $match: totalMatches,
      },
      {
        $group: {
          _id: '$eventId',
        },
      }, {
        $count: 'count',
      },
    ];

    const resultParams = [
      {
        $match: resultMatches,
      },
      {
        $group: {
          _id: '$eventId',
          events: {
            $push: '$$ROOT',
          },
        },
      },
      {
        $project: {
          _id: '$_id',
          events: '$events',
          timeStamp: { $arrayElemAt: ['$events.timeStamp', 0] },
        },
      },
      {
        $sort: {
          timeStamp: -1,
          _id: -1,
        },
      }, {
        $skip: skip,
      }, {
        $limit: limit,
      }, {
        $lookup: {
          from: actions,
          localField: '_id',
          foreignField: 'eventId',
          as: 'actions',
        },
      }, {
        $lookup: {
          from: results,
          localField: '_id',
          foreignField: 'eventId',
          as: 'results',
        },
      },
    ];

    const total = await Model.aggregate(totalParams);
    const result = await Model.aggregate(resultParams);


    const pages = total && total[0] ? (total[0].count <= limit ? 1 : Math.ceil(total[0].count / limit)) : 1;

    res.json({
      data: result,
      pages,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send(err.message || err);
  }
};

const getBetQuery = (req, res) => getDataQuery(BetEvent, 'betactions', 'betresults', req, res);

const getCurrentProposals = async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 1000;
    const skip = req.query.skip ? parseInt(req.query.skip, 10) : 0;
    const total = await Proposal.find().sort({ createdAt: -1 }).countDocuments();
    const pps = await Proposal.find().skip(skip).limit(limit).sort({ createdAt: -1 });
    const block = await Block.findOne().sort({ height: -1 });
    const coin = await Coin.findOne().sort({ createdAt: -1 });
    const allocatedPps = _.filter(pps, (o) => o.alloted);
    let totalAllocated = 0;
    if (allocatedPps.length > 0) {
      totalAllocated = allocatedPps[0].totalBudgetAlloted;
    }
    console.log(coin);
    const { nextSuperBlock } = coin;
    const totalBudget = ((getSubsidy(block.height) / 100) * 10) * 1440 * 30;
    res.json({
      pps,
      currentBlock: block.height,
      nextSuperBlock,
      totalBudget,
      totalAllocated,
      pages: total <= limit ? 1 : Math.ceil(total / limit)
    });
  } catch (err) {
    console.log(err);
    res.status(500).send(err.message || err);
  }
};

const getStatisticPerWeek = () => {
  // When does the cache expire.
  // For now this is hard coded.
  let cache = [];
  let cutOff = moment().utc().add(1, 'hour').unix();
  let loading = true;

  // Aggregate the data and build the date list.
  const getStatistic = async () => {
    loading = true;

    try {
      const start = moment()
        .utc()
        .startOf('week')
        .subtract(7, 'weeks')
        .toDate();
      const end = moment()
        .utc()
        .endOf('week')
        .toDate();
      const qry = [
        // Select last 7 weeks of bets.
        { $match: { createdAt: { $gt: start, $lt: end } } },
        // Convert createdAt date field to date string.
        {
          $project: {
            week: {
              $dateToString: {
                format: '%Y-%U',
                date: '$createdAt',
              },
            },
            date: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt',
              },
            },
            totalBet: '$totalBet',
            totalMint: '$totalMint',
          },
        },
        // Group by date string and build total/sum.
        {
          $group: {
            _id: '$week',
            date: { $first: '$date' },
            totalBet: { $first: '$totalBet' },
            totalMint: { $first: '$totalMint' },
          },
        },
        // Sort by _id/date field in ascending order (order -> newer)
        { $sort: { _id: 1 } },
      ];

      cache = await Statistic.aggregate(qry);
      console.log(cache);
      cutOff = moment()
        .utc()
        .add(90, 'seconds')
        .unix();
    } catch (err) {
      console.log(err);
    } finally {
      loading = false;
    }
  };

  // Load the initial cache.
  getStatistic();

  return async (req, res) => {
    res.json(cache);

    // If the cache has expired then go ahead
    // and get a new one but return the current
    // cache for this request.
    if (!loading && cutOff <= moment().utc().unix()) {
      await getStatistic();
    }
  };
};

module.exports = {
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
  getBetQuery,
  getBetActions,
  getBetResults,
  getBetActioinsWeek,
  getBetEventInfo,
  getBetEventsInfo,
  getCurrentProposals,
  getStatisticPerWeek,
  getBetspreads,
  getBetTotals,
  getLottoEvents,
  getLottoBets,
  getLottoResults,
  getLottoEventInfo,
};
