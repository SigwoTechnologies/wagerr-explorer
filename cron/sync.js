const { exit } = require('../lib/cron');
const locker = require('../lib/locker');

const betUpdate = require('./bet');
const lottoUpdate = require('./lotto');
const errorUpdates = require('./errors');
const unmatchedSpreads = require('./spreads');

const { log } = console;

const type = 'sync';
let code = 0;

async function exec() {
  locker.lock(type);

  log('------------------------------');
  log('--- RUNNING SYNC FUNCTIONS ---');
  log('------------------------------');
  log('------------------------------');
  log('[1] RUNNING BET SYNC WORKER...');
  return betUpdate()
    .then(() => {
      log('------------------------------');
      log('[2] RUNNING LOTTO SYNC WORKER...');
      return lottoUpdate();
    })
    .then(() => {
      log('------------------------------');
      log('[3] RUNNING ERRORS CHECK WORKER..');
      return errorUpdates();
    })
    .then(() => {
      log('------------------------------');
      log('[4]CHECKING UNMATCHED SPREADS...');
      return unmatchedSpreads();
    })
    .then(() => {
      log('------------------------------');
      log('SYNC FUNCTIONS COMPLETED');
      log('------------------------------');
      log('------------------------------');
      try {
        locker.unlock(type);
      } catch (err) {
        if (err && err.message && err.message.includes("no such file or directory, unlink '/explorer/tmp/sync.cron_lock")) {
          // log(err)
        } else {
          log('Update() error: finally');
          log(err);
        }
        code = 1;
      }
      return exit(code);
    })
    .catch((err) => {
      log('ERROR EXECUTING SYNC FUNCTIONS');
      log(err)
      code = 1;
      try {
        locker.unlock(type);
      } catch (err) {
        log('Update() error: finally');
        if (err && err.message && err.message.includes("no such file or directory, unlink '/explorer/tmp/sync.cron_lock")) {
          // log(err)
        } else {
          log(err);
        }
      }
      return exit(code);
    });
}



exec();