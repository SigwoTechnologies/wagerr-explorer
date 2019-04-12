import chai from 'chai';
import opCode from '../../lib/op_code';
import methods from '../../cron/methods';

const Mappingname = require('../../model/mappingname');
const { rpc } = require('../../lib/cron');
const { expect } = chai;

describe('Methods', () => {
  let vout;

  beforeEach(() => {
    vout = {
      scriptPubKey: {
        type: 'nulldata',
        asm: 'OP_RETURN 420102000000015BD39C700001000100010000000100000002000057E400004C2C000088B8',
      },
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
  });

  describe('getOPCode', () => {
    it('should retrieve op code from provided out data', () => {
      let response = methods.getOPCode(vout);
      expect(response).to.equal('420102000000015BD39C700001000100010000000100000002000057E400004C2C000088B8');
    
      vout.scriptPubKey.asm = 'OP_RETURN 3|1.0|#000|RUS';
      response = methods.getOPCode(vout);
      expect(response).to.equal('3|1.0|#000|RUS');
    });
  });

  describe('validateVoutData', () => {
    it('should decode provided hex value', async () => {
      Mappingname.findOne = () => false;
      Mappingname.create = () => true;
      const transaction = await methods.validateVoutData(vout);

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
    });
  });
});