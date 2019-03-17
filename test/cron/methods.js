import chai from 'chai';
import methods from '../../cron/methods';

const { expect } = chai;

const buildTx = (prefix, version, txType, namespaceId, mappingId, str) => ({
  prefix,
  version,
  txType,
  namespaceId,
  mappingId,
  string: str,
});

describe('Methods', () => {
  describe('dec2Hex', () => {
    it('should convert a decimal value into a hex value', () => {
      let response = methods.dec2Hex(1, 2);
      expect(response).to.equal('01');

      response = methods.dec2Hex(1, 4);
      expect(response).to.equal('0001');

      response = methods.dec2Hex(1, 8);
      expect(response).to.equal('00000001');
    });
  });

  describe('hexToString', () => {
    it('should convert a hex into a string value', () => {
      const response = methods.hexToString('536f63636572', 4);

      expect(response).to.equal('Soccer');
    });
  });

  describe('Codify', () => {
    it('should convert a string into a hex value', () => {
      let response = methods.Codify('B', 'prefix');
      expect(response.hex).to.equal('42');

      response = methods.Codify(1, 'version');
      expect(response.hex).to.equal('01');
      
      response = methods.Codify(1, 'txType');
      expect(response.hex).to.equal('01');
      
      response = methods.Codify(1, 'namespaceId');
      expect(response.hex).to.equal('01');

      response = methods.Codify(1, 'mappingId');
      expect(response.hex).to.equal('0001');

      response = methods.Codify('Soccer', 'string');
      expect(response.hex).to.equal('536f63636572');

      response = methods.Codify(1, 'mappingId', 'txTeamNames');
      expect(response.hex).to.equal('00000001');

      response = methods.Codify(1540594800, 'timeStamp');
      expect(response.hex).to.equal('5BD39C70');
    });
  });

  describe('buildOPCode', () => {
    it('should convert a string into a hex value', () => {
      let tx = buildTx('B', 1, 1, 1, 1, 'Soccer'); 
      let response = methods.buildOPCode(tx);

      expect(response.refactoredHex).to.equal('420101010001536f63636572');

      tx = buildTx('B', 1, 1, 2, 1, 'World Cup 2018'); 
      response = methods.buildOPCode(tx);

      expect(response.refactoredHex).to.equal('420101020001576f726c64204375702032303138');

      tx = buildTx('B', 1, 1, 3, 1, 'Round 1'); 
      response = methods.buildOPCode(tx);

      expect(response.refactoredHex).to.equal('420101030001526f756e642031');

      tx = buildTx('B', 1, 1, 4, 1, 'Russia'); 
      response = methods.buildOPCode(tx, 'txTeamNames');

      expect(response.refactoredHex).to.equal('4201010400000001527573736961');
    });
  });
});