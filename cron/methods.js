
require('babel-polyfill');

const _ = require('lodash');

const txFields = ['prefix', 'version', 'txType', 'namespaceId', 'mappingId', 'string'];

const buildTypes = {
    txSport: txFields,
    txTournament: txFields,
    txRound: txFields,
    txTeamNames: txFields,
};

function buildProperty(ptype, slices) {
  const basic = {
    type: ptype,
    default: {
      hex: {
        slices: 0,
      },
    },
  };

  if (ptype === 'Decimal') {
    basic.default.hex.slices = slices;
  }

  return basic;
};

const txSport = {
  prefix: buildProperty('String'),
  version: buildProperty('Decimal', 2),
  txType: buildProperty('Decimal', 2),
  namespaceId: buildProperty('Decimal', 2),
  mappingId: buildProperty('Decimal', 4),
  string: buildProperty('String'),
  sport: buildProperty('Decimal', 4),
  timeStamp: buildProperty('Timestamp'),
};

const txTournament = _.cloneDeep(txSport);

const txRound = _.cloneDeep(txSport);

const txTeamNames = _.cloneDeep(txSport);
txTeamNames.mappingId.default.hex.slices = 8;

const peerlessEvent = {
  prefix: buildProperty('String'),
  version: buildProperty('Decimal', 2),
  txType: buildProperty('Decimal', 2),
  eventId: buildProperty('Decimal', 8),
  timeStamp: buildProperty('Timestamp'),
  sport: buildProperty('Decimal', 4),
  tournament: buildProperty('Decimal', 4),
  round: buildProperty('Decimal', 4),
  homeTeam: buildProperty('Decimal', 8),
  awayTeam: buildProperty('Decimal', 8),
  homeOdds: buildProperty('Decimal', 8),
  awayOdds: buildProperty('Decimal', 8),
  drawOdds: buildProperty('Decimal', 8),
};

const peerlessBet = {
  prefix: buildProperty('String'),
  version: buildProperty('Decimal', 2),
  txType: buildProperty('Decimal', 2),
  eventId: buildProperty('Decimal', 8),
  outcome: buildProperty('Decimal', 2)
};

const peerlessResult = {
  prefix: buildProperty('String'),
  version: buildProperty('Decimal', 2),
  txType: buildProperty('Decimal', 2),
  eventId: buildProperty('Decimal', 8),
  mlResult: buildProperty('Decimal', 2),
  sResult: buildProperty('Decimal', 2),
  tResult: buildProperty('Decimal', 2),
};

const peerlessUpdateOddsTx = {
  prefix: buildProperty('String'),
  version: buildProperty('Decimal', 2),
  txType: buildProperty('Decimal', 2),
  eventId: buildProperty('Decimal', 8),
  homeOdds: buildProperty('String'),
  awayOdds: buildProperty('String'),
  drawOdds: buildProperty('String'),
};

const peerlessSpreadsMarket = {
  prefix: buildProperty('String'),
  version: buildProperty('Decimal', 2),
  txType: buildProperty('Decimal', 2),
  eventId: buildProperty('Decimal', 8),
  spreadPoints: buildProperty('Decimal', 4),
  homeOdds: buildProperty('Decimal', 8),
  awayOdds: buildProperty('Decimal', 8),
};

const peerlessTotalsMarket = _.cloneDeep(peerlessSpreadsMarket);


const chainGamesLottoEvent = {
  prefix: buildProperty('String'),
  version: buildProperty('Decimal', 2),
  txType: buildProperty('Decimal', 2),
  eventId: buildProperty('Decimal', 4),
  entryPrice: buildProperty('Decimal', 4),
};

const chainGamesLottoBet = {
  prefix: buildProperty('String'),
  version: buildProperty('Decimal', 2),
  txType: buildProperty('Decimal', 2),
  eventId: buildProperty('Decimal', 4),
};

const chainGamesLottoResult = _.cloneDeep(chainGamesLottoBet);

const keyMapping = {
  txSport,
  txTournament,
  txRound,
  txTeamNames,
  peerlessEvent,
  peerlessBet,
  peerlessResult,
  peerlessUpdateOddsTx,
  peerlessSpreadsMarket,
  peerlessTotalsMarket,
  peerlessTotalsMarket,
  chainGamesLottoEvent,
  chainGamesLottoBet,
  chainGamesLottoResult,
};

const dec2Binary = (num) => parseInt(num, 10).toString(2);
const dec2Hex = (num, slices) => ("0000000"+(parseInt(num, 10).toString(16))).slice(-slices).toUpperCase();
const time2Hex = (time) => parseInt(time, 10).toString(16).toUpperCase();

/**
 * Converts a string to a hex.
 * @param {String} hexx The rpc tx object.
 */
const hexToString = (hexx) => Buffer.from(hexx, 'hex').toString('utf8');

/**
 * Converts a string to a hex.
 * @param {String} str The rpc tx object.
 */
const Codify = (value, key, build = 'txSport') => {
  if (keyMapping[build][key].type === 'Decimal') {
    const slices = keyMapping[build][key].default.hex.slices;
    return {
      hex: dec2Hex(value, slices),
    };
  }

  if (keyMapping[build][key].type === 'Timestamp') {
    return {
      hex: time2Hex(value),
    };
  }

  return {
    hex: Buffer.from(value, 'utf8').toString('hex'),
  };
}


/**
 * Maps transaction for proper OP_CODE
 * @param {String} str The rpc tx object.
 */
function buildOPCode(tx, bType = 'txSport') {
  const keys = buildTypes[bType];
  const missingKey = false;
  const neededKeys = [];
  let refactoredHex = '';
  
  for (let x = 0; x < keys.length; x += 1) {
    const thisKey = keys[x];
    if (tx[thisKey] === undefined) {
      missingKey = true;
      neededKeys.push(thisKey);
    }

    refactoredHex += Codify(tx[thisKey], thisKey, bType).hex;
  }

  if (missingKey) return { error: true, message: `Transaction is missing the following keys [${neededKeys}]`};

  return { refactoredHex };
}

module.exports = {
  dec2Hex,
  hexToString,
  Codify,
  buildOPCode,
};
