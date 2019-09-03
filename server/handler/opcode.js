const  opCode = require('../../lib/op_code')


const decodeOP = async (req, res) => {
  const hexString = req.params.hex_value;

  const hexValue = hexString.replace('OP_RETURN ', '');

  const opData = opCode.isOPCode(hexValue);

  if (!opData.valid) {
    console.log('Error in OP code');
    console.log(opData);
    return res.status(500).send('Invalid OP code');
  }

  let response;

  try {
    response = await opCode.decode(hexValue, 'hex', true);  
  } catch (e) {
    console.log(e);
  }

  if (!response) {
    return res.status(500).send('Error decoding OP code');
  }

  return res.status(200).json(response);
};

module.exports = {
  decodeOP,
};
