
require('babel-polyfill');
const { rpc } = require('../lib/cron');
const TX = require('../model/tx');
const UTXO = require('../model/utxo');
const STXO = require('../model/stxo');
const _ = require('lodash')

function hexToString(hexx) {
  var hex = hexx.toString()//force conversion
  var str = ''
  for (var i = 0; (i < hex.length && hex.substr(i, 2) !== '00'); i += 2)
    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16))
  return str
}

function handleError(msg, e) {
  log(msg);
  log('Duplicate')
  // log(e);
}

async function logError(err, height, dataType) {
  if (err && err.message && err.message.includes('duplicate key error collection')) {
    return null;
  }

  if (height) {
    return handleError(
      `Error recording ${dataType} data at height ${height}`,
      err,
    );
  }

  return log(err);
}

/**
 * Process the inputs for the tx.
 * @param {Object} rpctx The rpc tx object.
 */
async function vin(rpctx, blockHeight) {
  // Setup the input list for the transaction.
  const txin = [];
  if (rpctx.vin) {
    let stxo = [];
    const txIds = new Set();
    for (const vin of rpctx.vin) {
      let isZcSpend = false
      if (vin.scriptSig){
        isZcSpend = vin.scriptSig.asm === "OP_ZEROCOINSPEND"
      }
      let connectedTx = await TX.findOne({txId: vin.txid})
      if (connectedTx) {
        const from = {
          blockHeight,
          address: connectedTx.vout[vin.vout].address,
          n: vin.vout,
          value: connectedTx.vout[vin.vout].value
        }

        stxo.push({
          ...from,
          _id: `${ connectedTx.txId }:${ vin.vout }`,
          txId: rpctx.txid
        })

        txin.push({
          coinbase: vin.coinbase,
          sequence: vin.sequence,
          txId: vin.txid,
          vout: vin.vout,
          address: connectedTx.vout[vin.vout].address,
          value: connectedTx.vout[vin.vout].value,
          isZcSpend: isZcSpend
        })
      } else {
        txin.push({
          coinbase: vin.coinbase,
          sequence: vin.sequence,
          txId: vin.txid,
          vout: vin.vout,
          isZcSpend: isZcSpend
        });
      }
      txIds.add(`${ vin.txid }:${ vin.vout }`)
    }

    // Insert spent transactions.
    if (stxo.length !== 0) {
      try {
        await STXO.insertMany(stxo);
      }catch (e) {
        logError(e, blockHeight,'STXO');
      }
    }
    // Remove spent transactions.
    if (txIds.size) {
      await UTXO.deleteMany({ _id: { $in: Array.from(txIds) } });
    }
  }
  return txin;
}

/**
 * Process the outputs for the tx.
 * @param {Object} rpctx The rpc tx object.
 * @param {Number} blockHeight The block height for the tx.
 */
async function vout(rpctx, blockHeight) {
  // Setup the outputs for the transaction.
  const txout = [];
  if (rpctx.vout) {
    const utxo = [];
    rpctx.vout.forEach((vout) => {
      var address;
      if (vout.scriptPubKey.type == 'nulldata') {
        if(_.startsWith(vout.scriptPubKey.asm, 'OP_RETURN 317c') || _.startsWith(vout.scriptPubKey.asm, 'OP_RETURN 327c')
         || _.startsWith(vout.scriptPubKey.asm, 'OP_RETURN 337c')){
          address = "OP_RETURN "+hexToString(vout.scriptPubKey.asm.substring(10))
        }else{
          address = "OP_RETURN "+vout.scriptPubKey.asm.substring(10)
        }
      }else if (vout.scriptPubKey.type == 'zerocoinmint') {
        address = 'ZERO_COIN_MINT'
      } else if (vout.scriptPubKey.type == 'nonstandard') {
        address = 'NON_STANDARD'
      } else {
        address = vout.scriptPubKey.addresses[0]
      }

      const to = {
        blockHeight,
        address: address,
        n: vout.n,
        value: vout.value
      };

      txout.push(to);
      utxo.push({
        ...to,
        _id: `${ rpctx.txid }:${ vout.n }`,
        txId: rpctx.txid
      });
    });

    // Insert unspent transactions.
    if (utxo.length) {
      try {
        await UTXO.insertMany(utxo);
      } catch (e) {
        if (e && e.message && e.message.includes('duplicate key error collection')) {
          // console.log('Error right here');
        } else {
          console.log(e)
        }
      }
    }
  }
  return txout;
}

/**
 * Process a proof of stake block.
 * @param {Object} block The block model object.
 * @param {Object} rpctx The rpc object from the node.
 */
async function addPoS(block, rpctx) {
  // We will ignore the empty PoS txs.
  if (rpctx.vin[0].coinbase && rpctx.vout[0].value === 0)
    return;

  const txin = await vin(rpctx, block.height);
  const txout = await vout(rpctx, block.height);

  try {
    await TX.create({
      _id: rpctx.txid,
      blockHash: block.hash,
      blockHeight: block.height,
      createdAt: block.createdAt,
      txId: rpctx.txid,
      version: rpctx.version,
      vin: txin,
      vout: txout
    });
  } catch(e) {
    logError(e, block.height, 'TX');
  }
}

/**
 * Handle a proof of work block.
 * @param {Object} block The block model object.
 * @param {Object} rpctx The rpc object from the node.
 */
async function addPoW(block, rpctx) {
  const txin = await vin(rpctx, block.height);
  const txout = await vout(rpctx, block.height);

  try {
    await TX.create({
      _id: rpctx.txid,
      blockHash: block.hash,
      blockHeight: block.height,
      createdAt: block.createdAt,
      txId: rpctx.txid,
      version: rpctx.version,
      vin: txin,
      vout: txout
    });
  } catch(e) {
    logError(e, block.height, 'TX');
  }
}

/**
 * Will process the tx from the node and return.
 * @param {String} tx The transaction hash string.
 */
async function getTX(txhash) {
  const hex = await rpc.call('getrawtransaction', [txhash]);
  return await rpc.call('decoderawtransaction', [hex]);
}

module.exports = {
  addPoS,
  addPoW,
  getTX,
  vin,
  vout
};
