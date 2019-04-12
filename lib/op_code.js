
const _ = require('lodash');

const { exit, rpc } = require('./cron');

const Mappingname = require('../model/mappingname');

const transactions = {
  sport: { txType: 1, namespaceId: 1 },
  tournament: { txType: 1, namespaceId: 4 },
  round: { txType: 1, namespaceId: 2 },
  teamnames: { txType: 1, namespaceId: 3 },
  peerlessEvent: { txType: 2 },
  peerlessBet: { txType: 3 },
  peerlessResult: { txType: 4 },
  peerlessUpdateOdds: { txType: 5 },
  peerlessSpreadsMarket: { txType: 9 },
  peerlessTotalsMarket: { txType: 10 },
  chainGamesLottoEvent: { txType: 6 },
  chainGamesLottoBet: { txType: 7 },
  chainGamesLottoResult: { txType: 8 },
};

const outcomeMapping = {
  1: 'Money Line - Home Win',
  2: 'Money Line - Away Win',
  3: 'Money Line - Draw',
  4: 'Spreads - Home',
  5: 'Spreads - Away',
  6: 'Totals - Over',
  7: 'Totals - Under',
};

const resultMapping = {
  1: 'Home / Home / Over',
  2: 'Away / Away / Under',
  3: 'Draw / Push/ Push',
  4: 'Refund / Refund / Refund',
};

const findTxType = (txCode) => {
  return _.findKey(transactions, (t) => (t.txType === txCode));
};

const txFields = ['prefix', 'version', 'txType', 'namespaceId', 'mappingId', 'string'];

const buildTypes = {
    sport: txFields,
    tournament: txFields,
    round: txFields,
    teamnames: txFields,
    peerlessEvent: [
      'prefix', 'version', 'txType', 'eventId', 'timestamp', 'sport', 'tournament',
      'round', 'homeTeam', 'awayTeam', 'homeOdds', 'awayOdds', 'drawOdds',
    ],
    peerlessBet: ['prefix', 'version', 'txType', 'eventId', 'outcome'],
    peerlessResult: ['prefix', 'version', 'txType', 'eventId', 'mlResult', 'sResult', 'tResult'],
    peerlessUpdateOdds: ['prefix', 'version', 'txType', 'eventId', 'homeOdds', 'awayOdds', 'drawOdds'],
    peerlessSpreadsMarket: ['prefix', 'version', 'txType', 'eventId', 'spreadPoints', 'homeOdds', 'awayOdds'],
    peerlessTotalsMarket: ['prefix', 'version', 'txType', 'eventId', 'spreadPoints', 'homeOdds', 'awayOdds'],
    chainGamesLottoEvent: ['prefix', 'version', 'txType', 'eventId', 'entryPrice'],
    chainGamesLottoBet: ['prefix', 'version', 'txType', 'eventId'],
    chainGamesLottoResult: ['prefix', 'version', 'txType', 'eventId'],
};

function buildProperty(ptype, slices, mappedData) {
  const basic = {
    mappedData,
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

const sport = {
  prefix: buildProperty('String'),
  version: buildProperty('Decimal', 2),
  txType: buildProperty('Decimal', 2),
  namespaceId: buildProperty('Decimal', 2),
  mappingId: buildProperty('Decimal', 4),
  string: buildProperty('String'),
  sport: buildProperty('Decimal', 4),
  timestamp: buildProperty('timestamp'),
};

const tournament = _.cloneDeep(sport);

const round = _.cloneDeep(sport);

const teamnames = _.cloneDeep(sport);
teamnames.mappingId.default.hex.slices = 8;

const peerlessEvent = {
  prefix: buildProperty('String'),
  version: buildProperty('Decimal', 2),
  txType: buildProperty('Decimal', 2),
  eventId: buildProperty('Decimal', 8),
  timestamp: buildProperty('timestamp'),
  sport: buildProperty('Decimal', 4, 'sports'),
  tournament: buildProperty('Decimal', 4, 'tournaments'),
  round: buildProperty('Decimal', 4),
  homeTeam: buildProperty('Decimal', 8, 'teamnames'),
  awayTeam: buildProperty('Decimal', 8, 'teamnames'),
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

const peerlessUpdateOdds = {
  prefix: buildProperty('String'),
  version: buildProperty('Decimal', 2),
  txType: buildProperty('Decimal', 2),
  eventId: buildProperty('Decimal', 8),
  homeOdds: buildProperty('Decimal', 8),
  awayOdds: buildProperty('Decimal', 8),
  drawOdds: buildProperty('Decimal', 8),
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
  sport,
  tournament,
  round,
  teamnames,
  peerlessEvent,
  peerlessBet,
  peerlessResult,
  peerlessUpdateOdds,
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
 * Converts a hext to a string
 * @param {String} hexx The rpc tx object.
 */

const hexToString = (hexx) => {
  var hex = hexx.toString(); //force conversion
  var str = '';
  for (var i = 0; (i < hex.length && hex.substr(i, 2) !== '00'); i += 2)
    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16))
  return str
}

/**
 * Converts a string to a hex.
 * @param {String} str The rpc tx object.
 */
const Codify = (value, key, build = 'sport') => {
  try {
    if (keyMapping[build][key].type === 'Decimal') {
      const slices = keyMapping[build][key].default.hex.slices;
      return {
        hex: dec2Hex(value, slices),
      };
    }

    if (keyMapping[build][key].type === 'timestamp') {
      return {
        hex: time2Hex(value),
      };
    }

    return {
      hex: Buffer.from(value, 'utf8').toString('hex'),
    };
  } catch (e) {
    console.log(e);
    return { error: e, value, key, build };
  }
}


/**
 * Maps transaction for proper OP_CODE
 * @param {String} str The rpc tx object.
 */
function buildOPCode(tx, bType = 'sport') {
  const keys = buildTypes[bType];
  let missingKey = false;
  const neededKeys = [];
  let refactoredHex = '';
  
  for (let x = 0; x < keys.length; x += 1) {
    const thisKey = keys[x];
    if (tx[thisKey] === undefined) {
      missingKey = true;
      neededKeys.push(thisKey);
    }
    const thisHex = Codify(tx[thisKey], thisKey, bType).hex;
    refactoredHex += thisHex
  }

  if (missingKey) return { error: true, message: `Transaction is missing the following keys [${neededKeys}]`};

  return { refactoredHex };
}

async function getMappingId(mappingIndex, name) {
  let response;

  try {
    response = await rpc.call('getmappingid', [mappingIndex, name]);
  } catch (e) {
    response = { error: true, fullError: e};
  }

  if (response.error) {
    return response;
  }

  if (!response[0]) {
    return { error: true, response };
  }
  if (response[0]['mapping-id'] === 0 || response[0]['mapping-id']) {
    return response[0];
  }

  return { error: true, response };
}

async function getMappingName(mappingIndex, id) {
  let response;

  try {
    response = await rpc.call('getmappingname', [mappingIndex, id.toString()]);
  } catch (e) {
    console.log(`Error obtaining mapping name => mappingIndex:${mappingIndex}, id:${id}`);
    response = { error: true, fullError: e };
  }

  if (response.error) {
    return response;
  }

  if (!response[0]) {
    return { error: true, response };
  }
  if (response[0]['mapping-name'] === 0 || response[0]['mapping-name']) {
    return response[0];
  }

  return response;
}

async function mapTransaction(bType, givenParams) {
  const params = givenParams;
  // We add the txType from transactions mapping object defined at the beginning of the file
  const { txType, namespaceId } = transactions[bType];
  if (!params.txType) params.txType = txType;

  const specialTransactions = ['sport', 'tournament', 'round', 'teamnames'];

  if (specialTransactions.includes(bType)) {
    // We assign namespace
    if (!params.namespaceId) params.namespaceId = namespaceId;

    // We call getMappingId method to obtain mapping-id from RPC
    const mappingData = await getMappingId(btype, params.string);

    params.mappingId = mappingData['mapping-id'];
  }

  return buildOPCode(params, bType);
}

function isOPCode(rawCode) {
  const code = rawCode.toString();
  const validPrefixes = ['42'];

  const prefix = code.slice(0, 2);
  const version = code.slice(2, 4);
  const type = parseInt(code.slice(4, 6), 16);
  const txType = findTxType(type);

  const errorReturn = (message) => {
    return { valid: false, message, prefix, version, type, txType };
  };

  if (!validPrefixes.includes(prefix)) return errorReturn('Wrong prefix');
  if (!txType) return errorReturn('Unknown transaction type');

  return { valid: true, type, prefix, version, txType };
}


async function decode(hexValue, decodeType = 'hex') {
  const opData = isOPCode(hexValue);

  if (!opData.valid) return opData;

  const transaction = {
    prefix: hexToString(opData.prefix),
    version: parseInt(opData.version, 16),
    type: opData.type,
    txType: opData.txType,
  };

  const totalFields = buildTypes[transaction.txType];
  const fieldsToFill = [];
  const startOfVariations = 6;
  
  await totalFields.forEach((f) => {
    if(transaction[f] == undefined) {
      fieldsToFill.push(f);
    }
  });

  let currentPos = startOfVariations;

  for (let x = 0; x < fieldsToFill.length; x +=1) {
    const f = fieldsToFill[x];
    if (transaction.type === 1 && transaction.namespaceId) {
      if (transaction.namespaceId === 4) {
        transaction.txType = 'tournament';
      } else if (transaction.namespaceId === 2) {
        transaction.txType = 'round';
      } else if (transaction.namespaceId === 3) {
        transaction.txType = 'teamnames';
      }
    }

    const fieldData = keyMapping[transaction.txType][f];
    const dataType = fieldData.type;
    const { slices } = fieldData.default[decodeType];
    let thisSection;

    if (slices) {
      thisSection = hexValue.slice(currentPos, currentPos + slices);
    } else if (dataType === 'timestamp') {
      thisSection = hexValue.slice(currentPos, currentPos + 8);
    } else {
      thisSection = hexValue.slice(currentPos, hexValue.length);
    }
    let decryptedValue;
    if (dataType === 'Decimal' && fieldData.mappedData) {
      let mappingNameData;

      // We save mappingname data here
      try {
        const query = await Mappingname.findOne({ 
          mappingId: parseInt(thisSection, 16),
          mappingIndex: fieldData.mappedData,
        });

        if (!query) {
          mappingNameData = await getMappingName(fieldData.mappedData, parseInt(thisSection, 16));

          try {
            await Mappingname.create({
              name: mappingNameData['mapping-name'] || 'Unknown',
              mappingIndex: mappingNameData['mapping-index'],
              mappingId: parseInt(thisSection, 16),
            });
          } catch(e) {
            console.log('Could not save mapping data');
            console.log(e);
          }
        } else {
          mappingNameData = {
            'mapping-name': query.name,
            'mapping-index': query.mappingIndex,
          };
        }

      } catch (e) {
        console.log(`Could not save mapping data => mappingIndex: ${fieldData.mappedData}, mappingId: ${parseInt(thisSection, 16)}`);
        console.log(e);
      }

      decryptedValue = mappingNameData['mapping-name'];
    } else if (['Decimal', 'timestamp'].includes(dataType)) {
      decryptedValue = parseInt(thisSection, 16);
    } else {
      decryptedValue = hexToString(thisSection);
    }

    if (dataType === 'timestamp') {
      currentPos += 8;
    } else {
      currentPos += slices;
    }
    transaction[f] = decryptedValue;
  }

  transaction.opCode = hexValue;

  return transaction;
}

module.exports = {
  outcomeMapping,
  resultMapping,
  findTxType,
  transactions,
  dec2Hex,
  hexToString,
  Codify,
  buildOPCode,
  getMappingId,
  mapTransaction,
  getMappingName,
  isOPCode,
  decode,
};
