
const _ = require('lodash');

const { exit, rpc } = require('./cron');

const Mappingname = require('../model/mappingname');

const endianness = require('endianness');

const { log } = console;

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
  1: 'Standard Payout',
  2: 'Event Refund',
  3: 'Money Line Refund',
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

  if (['Decimal', 'LittleEndian'].includes(ptype) ) {
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

const teamnames = {
  prefix: buildProperty('String'),
  version: buildProperty('Decimal', 2),
  txType: buildProperty('Decimal', 2),
  namespaceId: buildProperty('Decimal', 2),
  mappingId: buildProperty('LittleEndian', 8),
  string: buildProperty('String'),
};

const peerlessEvent = {
  prefix: buildProperty('String'),
  version: buildProperty('Decimal', 2),
  txType: buildProperty('Decimal', 2),
  eventId: buildProperty('LittleEndian', 8),
  timestamp: buildProperty('timestamp'),
  sport: buildProperty('Decimal', 4, 'sports'),
  tournament: buildProperty('Decimal', 4, 'tournaments'),
  round: buildProperty('Decimal', 4),
  homeTeam: buildProperty('Decimal', 8, 'teamnames'),
  awayTeam: buildProperty('Decimal', 8, 'teamnames'),
  homeOdds: buildProperty('LittleEndian', 8),
  awayOdds: buildProperty('LittleEndian', 8),
  drawOdds: buildProperty('LittleEndian', 8),
};

const peerlessBet = {
  prefix: buildProperty('String'),
  version: buildProperty('Decimal', 2),
  txType: buildProperty('Decimal', 2),
  eventId: buildProperty('LittleEndian', 8),
  outcome: buildProperty('LittleEndian', 2)
};

const peerlessResult = {
  prefix: buildProperty('String'),
  version: buildProperty('Decimal', 2),
  txType: buildProperty('Decimal', 2),
  eventId: buildProperty('LittleEndian', 8),
  mlResult: buildProperty('LittleEndian', 2),
  sResult: buildProperty('LittleEndian', 4),
  tResult: buildProperty('LittleEndian', 4),
};

const peerlessUpdateOdds = {
  prefix: buildProperty('String'),
  version: buildProperty('Decimal', 2),
  txType: buildProperty('Decimal', 2),
  eventId: buildProperty('LittleEndian', 8),
  homeOdds: buildProperty('LittleEndian', 8),
  awayOdds: buildProperty('LittleEndian', 8),
  drawOdds: buildProperty('LittleEndian', 8),
};

const peerlessSpreadsMarket = {
  prefix: buildProperty('String'),
  version: buildProperty('Decimal', 2),
  txType: buildProperty('Decimal', 2),
  eventId: buildProperty('LittleEndian', 8),
  spreadPoints: buildProperty('LittleEndian', 4),
  homeOdds: buildProperty('LittleEndian', 8),
  awayOdds: buildProperty('LittleEndian', 8),
};

const peerlessTotalsMarket = _.cloneDeep(peerlessSpreadsMarket);


const chainGamesLottoEvent = {
  prefix: buildProperty('String'),
  version: buildProperty('Decimal', 2),
  txType: buildProperty('Decimal', 2),
  eventId: buildProperty('LittleEndian', 4),
  entryPrice: buildProperty('Decimal', 4),
};

const chainGamesLottoBet = {
  prefix: buildProperty('String'),
  version: buildProperty('Decimal', 2),
  txType: buildProperty('Decimal', 2),
  eventId: buildProperty('LittleEndian', 4),
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
    log(e);
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
    log(e);
    log(`Error obtaining mapping name => mappingIndex:${mappingIndex}, id:${id}`);
    response = { error: true, fullError: e };
  }

  if (response.error) {
    return response;
  }

  if (!response[0]) {
    return { error: true, response };
  }
  if (response[0]['mapping-name'] === 0 || response[0]['mapping-name'] || response[0]['mapping-name'] === '' ) {
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

function bufferDecrypt(hex) {
  return Buffer.from(hex, 'hex').readIntLE();
}


function toPaddedHexString(num, bytes) {
  let len;

  if (bytes === 1) {
    len = 2;
  } else if (bytes === 2) {
    len = 4;
  } else if (bytes === 4) {
    len = 8;
  }
    str = num.toString(16);
    return "0".repeat(len - str.length) + str;
}

function decryptFromLittleEndian(littleEn) {
  /* let hexArray = hex.match(/../g);
  hexArray.reverse();

  const littleEndian = hexArray.join('');   */

  const hexArray = littleEn.match(/../g);
  hexArray.reverse();

  const hex = hexArray.join("");   
  const decryptedVal = parseInt(hex, 16)

  return decryptedVal;
}

function isOPCode(rawCode) {
  const code = rawCode.toString();
  const validPrefixes = ['42'];

  const prefix = code.slice(0, 2);
  const version = code.slice(2, 4);
  const type = bufferDecrypt(code.slice(4, 6));
  const txType = findTxType(type);

  const errorReturn = (message) => {
    return { valid: false, message, prefix, version, type, txType };
  };

  if (!validPrefixes.includes(prefix)) return errorReturn('Wrong prefix');
  if (!txType) return errorReturn('Unknown transaction type');

  return { valid: true, type, prefix, version, txType };
}

async function handleSingleMappingRequest(id, fieldData, opcode) {
  let mappingNameData;
  const decryptedSection = id;

  // We save mappingname data here
  try {
    const query = await Mappingname.findOne({ 
      mappingId: decryptedSection,
      mappingIndex: fieldData.mappedData,
    });

    if (!query) {
      mappingNameData = await getMappingName(fieldData.mappedData, decryptedSection);

      try {
        let mappingIndex = mappingNameData['mapping-index'];
        let name = mappingNameData['mapping-name'];

        if (mappingNameData['mapping-name'] === '') {
          name = 'Unknown'
        }

        await Mappingname.create({
          mappingIndex,
          name,
          mappingId: decryptedSection,
        });
      } catch(e) {
        // log('Could not save mapping data');
        throw new Error(`Could not save mapping data for ${opcode}`);
      }
    } else {
      mappingNameData = {
        'mapping-name': query.name,
        'mapping-index': query.mappingIndex,
        'mapping-id': query.mappingId,
      };
    }

  } catch (e) {
    log(`Could not save mapping data => mappingIndex: ${fieldData.mappedData}, mappingId: ${decryptedSection})} => opcode: ${opcode}`);
    throw new Error(e);
  }

  return mappingNameData;
}

async function handleMappingData(hex, fieldData, opcode) {
  let decryptedSection = decryptFromLittleEndian(hex);
  let mappingNameData;

  try {
    mappingNameData = await handleSingleMappingRequest(decryptedSection, fieldData, opcode);
  } catch (e) {
    log('First decryption method for mapping data failed');
    decryptedSection = parseInt(hex, 16);
    try {
      log('Second decryption method used');
      mappingNameData = await handleSingleMappingRequest(decryptedSection, fieldData, opcode);
      log('Method successfull');
    } catch (e) {
      log('This is the second error');
      log(e);
    }
  }

  return mappingNameData;
}


async function decode(hexValue, decodeType = 'hex', showLogs = false) {
  const opData = isOPCode(hexValue);

  if (!opData.valid) return opData;

  const transaction = {
    prefix: hexToString(opData.prefix),
    version: bufferDecrypt(opData.version),
    type: opData.type,
    txType: opData.txType,
  };

  const totalFields = buildTypes[transaction.txType];
  const fieldsToFill = [];
  const startOfVariations = 6;

  const schema = {
    prefix: {
      section: opData.prefix,
      decryptedValue: transaction.prefix,
    },
    version: {
      section: opData.version,
      decryptedValue: transactions.version,
    },
    txType: {
      decryptedValue: opData.type,
      value: opData.txType,
    },
  };
  
  await totalFields.forEach((f) => {
    if(transaction[f] == undefined) {
      fieldsToFill.push(f);
    }
  });

  let currentPos = startOfVariations;

  if (showLogs) {
    log('Schema at the beginning');
    log(schema);
  }

  for (let x = 0; x < fieldsToFill.length; x +=1) {
    const f = fieldsToFill[x];
    if (transaction.type === 1 && transaction.namespaceId) {
      if (transaction.namespaceId === 4) {
        transaction.txType = 'tournament';
        schema.txType.value = 'tournament';
      } else if (transaction.namespaceId === 2) {
        transaction.txType = 'round';
        schema.txType.value = 'round';
      } else if (transaction.namespaceId === 3) {
        transaction.txType = 'teamnames';
        schema.txType.value = 'teamnames';
      }
    }

    const fieldData = keyMapping[transaction.txType][f];
    const dataType = fieldData.type;
    const { slices } = fieldData.default[decodeType];
    let thisSection;
    let decryptedSection;

    if (slices) {
      thisSection = hexValue.substr(currentPos, slices);
    } else if (dataType === 'timestamp') {
      thisSection = hexValue.substr(currentPos, 8);
    } else {
      thisSection = hexValue.substr(currentPos);
    }

    let decryptedValue;
    let mappingId;
  
    if ((dataType === 'Decimal' || dataType === 'LittleEndian') && fieldData.mappedData) {
      let mappingNameData = {};
      mappingNameData = await handleMappingData(thisSection, fieldData, hexValue);

      decryptedValue = mappingNameData['mapping-name'];
      mappingId = mappingNameData['mapping-id'];
    } else if (['Decimal'].includes(dataType)) {
      decryptedValue = bufferDecrypt(thisSection)
    } else if (['timestamp'].includes(dataType)) {
      try {
        decryptedValue = decryptFromLittleEndian(thisSection) * 1000;
        // console.log(parseInt(thisSection, 16));
      } catch (e) {
        console.log(e);
        decryptedValue = parseInt(thisSection, 16) * 1000;
      }
    } else if (dataType === 'LittleEndian') {
      // decryptedValue = bufferDecrypt(thisSection);
      try {
        const newWay = decryptFromLittleEndian(thisSection);
        decryptedValue = newWay;
      } catch (e) {
        log(e);
        decryptedValue = 'unknown';
      }
    } else {
      decryptedValue = hexToString(thisSection);
    }

    if (f) {
      schema[f] = {
        section: thisSection,
        decryptedValue,
      }
    }

    if (dataType === 'timestamp') {
      currentPos += 8;
    } else {
      currentPos += slices;
    }
    transaction[f] = decryptedValue || decryptedSection;

    if (transaction[f] === undefined) {
      transaction[f] = parseInt(thisSection, 16);
    }

    if (f === 'timestamp') {
      transaction.date = new Date(decryptedValue);
    }
  }

  schema.opCode == hexValue;


  if (showLogs) {
    console.log('Schema at the end');
    console.log(schema);
  }

  transaction.opCode = hexValue;

  if (transaction.txType === 'peerlessResult' ) {
    transaction.resultType = transaction.mlResult;
    transaction.homeScore = transaction.sResult;
    transaction.awayScore = transaction.tResult;
    delete transaction.mlResult;
    delete transaction.sResult;
    delete transaction.tResult;
  }  

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
