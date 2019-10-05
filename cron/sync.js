const { exit } = require('../lib/cron');
const locker = require('../lib/locker');

const betUpdate = require('./bet');
const lottoUpdate = require('./lotto');
const errorUpdates = require('./errors');

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
      log('SYNC FUNCTIONS COMPLETED');
      log('------------------------------');
      log('------------------------------');
      try {
        locker.unlock(type);
      } catch (err) {
        log('Update() error: finally');
        log(err);
        code = 1;
      }
      return exit(code);
    })
    .catch((err) => {
      log(err);
      code = 1;
      return exit(code);
    });
}



exec();