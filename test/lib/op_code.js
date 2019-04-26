import chai from 'chai';
import opCode from '../../lib/op_code';

const Mappingname = require('../../model/mappingname');
const { rpc } = require('../../lib/cron');
const { expect } = chai;

const buildTx = (prefix, version, txType, namespaceId, mappingId, str) => ({
  prefix,
  version,
  txType,
  namespaceId,
  mappingId,
  string: str,
});

describe('OpCode', () => {
  describe('dec2Hex', () => {
    it('should convert a decimal value into a hex value', () => {
      let response = opCode.dec2Hex(1, 2);
      expect(response).to.equal('01');

      response = opCode.dec2Hex(1, 4);
      expect(response).to.equal('0001');

      response = opCode.dec2Hex(1, 8);
      expect(response).to.equal('00000001');
    });
  });

  describe('hexToString', () => {
    it('should convert a hex into a string value', () => {
      const response = opCode.hexToString('536f63636572', 4);

      expect(response).to.equal('Soccer');
    });
  });

  describe('Codify', () => {
    it('should convert a string into a hex value', () => {
      let response = opCode.Codify('B', 'prefix');
      expect(response.hex).to.equal('42');

      response = opCode.Codify(1, 'version');
      expect(response.hex).to.equal('01');
      
      response = opCode.Codify(1, 'txType');
      expect(response.hex).to.equal('01');
      
      response = opCode.Codify(1, 'namespaceId');
      expect(response.hex).to.equal('01');

      response = opCode.Codify(1, 'mappingId');
      expect(response.hex).to.equal('0001');

      response = opCode.Codify('Soccer', 'string');
      expect(response.hex).to.equal('536f63636572');

      response = opCode.Codify(1, 'mappingId', 'teamnames');
      expect(response.hex).to.equal('00000001');

      response = opCode.Codify(1540594800, 'timestamp');
      expect(response.hex).to.equal('5BD39C70');
    });
  });

  describe('buildOPCode', () => {
    let tx;
    let response;

    it('should convert an object description for Sports transactions into a hex value', () => {
      tx = buildTx('B', 1, 1, 1, 1, 'Soccer'); 
      response = opCode.buildOPCode(tx);

      expect(response.refactoredHex).to.equal('420101010001536f63636572');
    });

    it('should convert an object description for Tournaments transactions into a hex value', () => {
      tx = buildTx('B', 1, 1, 2, 1, 'World Cup 2018'); 
      response = opCode.buildOPCode(tx, 'tournament');

      expect(response.refactoredHex).to.equal('420101020001576f726c64204375702032303138');
    });

    it('should convert an object description for Round transactions into a hex value', () => {
      tx = buildTx('B', 1, 1, 3, 1, 'Round 1'); 
      response = opCode.buildOPCode(tx, 'round');

      expect(response.refactoredHex).to.equal('420101030001526f756e642031');
    });

    it('should convert an object description for Team names transactions into a hex value', () => {
      tx = buildTx('B', 1, 1, 4, 1, 'Russia'); 
      response = opCode.buildOPCode(tx, 'teamnames');

      expect(response.refactoredHex).to.equal('4201010400000001527573736961');
    });

    it('should convert an object description for Peerless event transactions into a hex value', () => {
      tx = {
        prefix: 'B', version: 1, txType: 2, eventId: 1,
        timestamp: 1540594800, sport: 1, tournament: 1,
        round: 1, homeTeam: 1, awayTeam: 2, homeOdds: 22500,
        awayOdds: 19500, drawOdds: 35000,
      }; 
      response = opCode.buildOPCode(tx, 'peerlessEvent');

      expect(response.refactoredHex).to.equal('420102000000015BD39C700001000100010000000100000002000057E400004C2C000088B8');
    });

    it('should convert an object description for Peerless bet transactions into a hex value', () => {
      tx = { prefix: 'B', version: 1, txType: 3, eventId: 1, outcome: 2 }; 
      response = opCode.buildOPCode(tx, 'peerlessBet');

      expect(response.refactoredHex).to.equal('4201030000000102');
    });

    it('should convert an object description for Peerless result transactions into a hex value', () => {
      tx = { prefix: 'B', version: 1, txType: 4, eventId: 1, mlResult: 2, sResult: 3, tResult: 1 }; 
      response = opCode.buildOPCode(tx, 'peerlessResult');

      expect(response.refactoredHex).to.equal('420104000000010200030001');
    });

    it('should convert an object description for Peerless update odds transactions into a hex value', () => {
      tx = { prefix: 'B', version: 1, txType: 5, eventId: 1, homeOdds: 22500, awayOdds: 19500, drawOdds: 35000 }; 
      response = opCode.buildOPCode(tx, 'peerlessUpdateOdds');

      expect(response.refactoredHex).to.equal('42010500000001000057E400004C2C000088B8');
    });

    it('should convert an object description for Peerless spreads market transactions into a hex value', () => {
      tx = { prefix: 'B', version: 1, txType: 9, eventId: 1, spreadPoints: 60, homeOdds: 19500, awayOdds: 35000 }; 
      response = opCode.buildOPCode(tx, 'peerlessSpreadsMarket');

      expect(response.refactoredHex).to.equal('42010900000001003C00004C2C000088B8');
    });

    it('should convert an object description for Peerless totals market transactions into a hex value', () => {
      tx = { prefix: 'B', version: 1, txType: 10, eventId: 1, spreadPoints: 60, homeOdds: 19500, awayOdds: 35000 }; 
      response = opCode.buildOPCode(tx, 'peerlessTotalsMarket');

      expect(response.refactoredHex).to.equal('42010A00000001003C00004C2C000088B8');
    });

    it('should convert an object description for Chain games lotto event transactions into a hex value', () => {
      tx = { prefix: 'B', version: 1, txType: 6, eventId: 1, entryPrice: 100 }; 
      response = opCode.buildOPCode(tx, 'chainGamesLottoEvent');

      expect(response.refactoredHex).to.equal('42010600010064');
    });

    it('should convert an object description for Chain games lotto bet transactions into a hex value', () => {
      tx = { prefix: 'B', version: 1, txType: 7, eventId: 1 }; 
      response = opCode.buildOPCode(tx, 'chainGamesLottoBet');

      expect(response.refactoredHex).to.equal('4201070001');
    });

    it('should convert an object description for Chain games lotto result transactions into a hex value', () => {
      tx = { prefix: 'B', version: 1, txType: 8, eventId: 1 }; 
      response = opCode.buildOPCode(tx, 'chainGamesLottoResult');

      expect(response.refactoredHex).to.equal('4201080001');
    });
  });

  describe('getMappingId', () => {
    let rpcCallData;

    beforeEach(() => {
      rpc.call = (request, params) => {
        rpcCallData = [request, params];
        return [{ 'mapping-id': 12, 'mapping-index': params[0], exists: true }];;
      };
    });
    
    it('should make an rpc call with correct request type and parameters and provide response', async () => {
      let response = await opCode.getMappingId('sports', 'Football');

      expect(rpcCallData[0]).to.equal('getmappingid');
      expect(rpcCallData[1][0]).to.equal('sports');
      expect(rpcCallData[1][1]).to.equal('Football');
      expect(response['mapping-id']).to.equal(12);
      expect(response['mapping-index']).to.equal('sports');
      expect(response.exists).to.equal(true);

      response = await opCode.getMappingId('sports', 'Hockey');

      expect(rpcCallData[0]).to.equal('getmappingid');
      expect(rpcCallData[1][0]).to.equal('sports');
      expect(rpcCallData[1][1]).to.equal('Hockey');

      response = await opCode.getMappingId('sports', 'Baseball');

      expect(rpcCallData[0]).to.equal('getmappingid');
      expect(rpcCallData[1][0]).to.equal('sports');
      expect(rpcCallData[1][1]).to.equal('Baseball');
    });

    it('should return an error if mapping-id is not in response', async () => {
      rpc.call = () => ({ message: 'This is a test transaction' });
      const response = await opCode.getMappingId('sports', 'Hockey');

      expect(response.error).to.equal(true);
      expect(response.response.message).to.equal('This is a test transaction');
    });
  });

  describe('getMappingName', () => {
    let rpcCallData;

    beforeEach(() => {
      rpc.call = (request, params) => {
        rpcCallData = [request, params];
        return [{ 'mapping-name': 'Soccer', 'mapping-index': params[0], exists: true }];;
      };
    });
    
    it('should make an rpc call with correct request type and parameters and provide response', async () => {
      let response = await opCode.getMappingName('sports', 1);

      expect(rpcCallData[0]).to.equal('getmappingname');
      expect(rpcCallData[1][0]).to.equal('sports');
      expect(rpcCallData[1][1]).to.equal('1');
      expect(response['mapping-name']).to.equal('Soccer');
      expect(response['mapping-index']).to.equal('sports');
      expect(response.exists).to.equal(true);

      response = await opCode.getMappingName('sports', 3);

      expect(rpcCallData[0]).to.equal('getmappingname');
      expect(rpcCallData[1][0]).to.equal('sports');
      expect(rpcCallData[1][1]).to.equal('3');

      response = await opCode.getMappingName('sports', 2);

      expect(rpcCallData[0]).to.equal('getmappingname');
      expect(rpcCallData[1][0]).to.equal('sports');
      expect(rpcCallData[1][1]).to.equal('2');
    });

    it('should return an error if mapping-name is not in response', async () => {
      rpc.call = () => ({ message: 'This is a test transaction' });
      const response = await opCode.getMappingName('sports', 1);

      expect(response.error).to.equal(true);
      expect(response.response.message).to.equal('This is a test transaction');
    });
  });

  describe('isOPCode', () => {
    it('should verify if hex provided represents an OPCode based on format', () => {
      let response = opCode.isOPCode('4201070002');
      expect(response.valid).to.equal(true);
      expect(response.type).to.equal(7);
      expect(response.txType).to.equal('chainGamesLottoBet');

      response = opCode.isOPCode('4201060002');
      expect(response.valid).to.equal(true);
      expect(response.type).to.equal(6);
      expect(response.txType).to.equal('chainGamesLottoEvent');

      response = opCode.isOPCode('4201080002');
      expect(response.valid).to.equal(true);
      expect(response.type).to.equal(8);
      expect(response.txType).to.equal('chainGamesLottoResult');

      response = opCode.isOPCode('5201070002');
      expect(response.valid).to.equal(false);

      response = opCode.isOPCode('3201070002');
      expect(response.valid).to.equal(false);
    });

    it('should return error if provided with an unknown transaction type', () => {
      const response = opCode.isOPCode('42010B0002');

      expect(response.valid).to.equal(false);
      expect(response.type).to.equal(11);
      expect(response.txType).to.equal(undefined);
      expect(response.message).to.equal('Unknown transaction type');
    });
  });

  describe('decode', () => {  
    it('should decrypt lotto bets op codes', async () => {
      const response = await opCode.decode('4201070002');

      expect(response.prefix).to.equal('B');
      expect(response.version).to.equal(1);
      expect(response.type).to.equal(7);
      expect(response.txType).to.equal('chainGamesLottoBet');
      expect(response.eventId).to.equal(2);
    });

    it('should decrypt lotto results op codes', async () => {
      const transaction = await opCode.decode('4201080002');

      expect(transaction.prefix).to.equal('B');
      expect(transaction.version).to.equal(1);
      expect(transaction.type).to.equal(8);
      expect(transaction.txType).to.equal('chainGamesLottoResult');
      expect(transaction.eventId).to.equal(2);
    });

    it('should decrypt sport transactions op codes', async () => {
      const transaction = await opCode.decode('420101010001536f63636572');

      expect(transaction.prefix).to.equal('B');
      expect(transaction.version).to.equal(1);
      expect(transaction.type).to.equal(1);
      expect(transaction.namespaceId).to.equal(1);
      expect(transaction.mappingId).to.equal(1);
      expect(transaction.txType).to.equal('sport');
      expect(transaction.string).to.equal('Soccer');
    });


    it('should decrypt tournament transactions op codes', async () => {
      const transaction = await opCode.decode('420101040001576f726c64204375702032303138');

      expect(transaction.prefix).to.equal('B');
      expect(transaction.version).to.equal(1);
      expect(transaction.type).to.equal(1);
      expect(transaction.namespaceId).to.equal(4);
      expect(transaction.mappingId).to.equal(1);
      expect(transaction.txType).to.equal('tournament');
      expect(transaction.string).to.equal('World Cup 2018');
    });

    it('should decrypt round transactions op codes', async () => {
      const transaction = await opCode.decode('420101020001526f756e642031');

      expect(transaction.prefix).to.equal('B');
      expect(transaction.version).to.equal(1);
      expect(transaction.type).to.equal(1);
      expect(transaction.namespaceId).to.equal(2);
      expect(transaction.mappingId).to.equal(1);
      expect(transaction.txType).to.equal('round');
      expect(transaction.string).to.equal('Round 1');
    });

    it('should decrypt team names transactions op codes', async () => {
      const transaction = await opCode.decode('4201010300000001527573736961');

      expect(transaction.prefix).to.equal('B');
      expect(transaction.version).to.equal(1);
      expect(transaction.type).to.equal(1);
      expect(transaction.namespaceId).to.equal(3);
      expect(transaction.mappingId).to.equal(1);
      expect(transaction.txType).to.equal('teamnames');
      expect(transaction.string).to.equal('Russia');
    });

    it('should decrypt peerless events op codes', async () => {
      let createdRecord = false;
      Mappingname.findOne = () => false;
      Mappingname.create = () => {
        createdRecord = true;
        return true;
      };

      rpc.call = (req, index) => {
        const sportsResponse = [{ 'mapping-name': 'Soccer' }];
        const teamnameResponse = [{ 'mapping-name': 'Russia' }];
        const tournamentResponse = [{ 'mapping-name': 'World Cup 2018' }];

        if (req === 'getmappingname' && index[0] === 'sports') {
          return sportsResponse;
        }

        if (req === 'getmappingname' && index[0] === 'teamnames') {
          return teamnameResponse;
        }

        if (req === 'getmappingname' && index[0] === 'tournaments') {
          return tournamentResponse;
        }

        return(sportsResponse);
      };

      const transaction = await opCode.decode('420102000000015BD39C700001000100010000000100000002000057E400004C2C000088B8');
      expect(transaction.prefix).to.equal('B');
      expect(transaction.version).to.equal(1);
      expect(transaction.type).to.equal(2);
      expect(transaction.txType).to.equal('peerlessEvent');
      expect(transaction.eventId).to.equal(1);
      expect(transaction.timestamp).to.equal(1540594800);
      expect(transaction.sport).to.equal('Soccer');
      expect(transaction.tournament).to.equal('World Cup 2018');
      expect(transaction.round).to.equal(1);
      expect(transaction.homeTeam).to.equal('Russia');
      expect(transaction.homeOdds).to.equal(22500);
      expect(transaction.awayOdds).to.equal(19500);
      expect(transaction.drawOdds).to.equal(35000);
      expect(transaction.opCode).to.equal('420102000000015BD39C700001000100010000000100000002000057E400004C2C000088B8');
      expect(createdRecord).to.equal(true);
    });
  });
});