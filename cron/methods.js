const opCode = require('../lib/op_code');


function getOPCode(voutData) {
  const { type, asm } = voutData.scriptPubKey;
  
  if (!type || type !== 'nulldata') {
    return { error: false, message: 'Incorrect type', type };
  }

  if (!asm) {
    return { error: false, message: 'Missing asm data', asm};
  }

  const hexValue = asm.replace('OP_RETURN ', '');

  return hexValue;
}

function validateVoutData(voutData) {
  const hexValue = getOPCode(voutData);

  const returnError = (fullError) => {
    return ({ error: true, fullError });
  };

  if (hexValue.error) return returnError(hexValue);

  const opData = opCode.isOPCode(hexValue);

  if (!opData.valid) return returnError(opData);

  return opCode.decode(hexValue);
}

module.exports = {
  getOPCode,
  validateVoutData,
};
