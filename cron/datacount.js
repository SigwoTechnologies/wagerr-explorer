const { exit } = require('../lib/cron');
const locker = require('../lib/locker');

const BetAction = require('../model/betaction.js');
const BetError = require('../model/beterror.js');
const BetEvent = require('../model/betevent.js');
const BetResult = require('../model/betresult.js');
const BetSpread = require('../model/betspread.js');
const BetTotal = require('../model/bettotal.js');
const BetUpdate = require('../model/betupdate.js');
// const Block = require('../model/block.js');
const LottoEvent = require('../model/lottoevent.js');
const LottoBet = require('../model/lottobet.js');
const LottoResult = require('../model/lottoresult.js');
const Transaction = require('../model/transaction.js');

const { log } = console;

const models = [
  [ BetAction, 'betaction' ],
  [ BetError, 'beterror' ],
  [ BetEvent, 'betevent' ],
  [ BetResult, 'betresult' ],
  [ BetSpread, 'betspread' ],
  [ BetTotal, 'bettotal' ],
  [ BetUpdate, 'betupdate' ],
  // [ Block, 'block' ],
  [ LottoEvent, 'lottoevent' ],
  [ LottoBet, 'lottobet' ],
  [ LottoResult, 'lottoresult' ],
  [ Transaction, 'transaction' ],  
];

async function getStatistics() {
  const statistics = {};
  for (let x = 0; x < models.length; x += 1) {
    const Model = models[x];
    const count = await Model[0].countDocuments();

    statistics[Model[1]] = count;
  }
  return statistics;
}

async function exec () {
  const type = 'datacount';
  let code = 0;

  let response;

  try {
    locker.lock(type);
    response = await getStatistics();
    log(response);
  } catch (err) {
    log('Update() error');
    log(err);
    code = 1;
    response = err;
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

  return response;
}

exec();
