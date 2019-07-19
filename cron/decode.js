const methods = require('./methods')

const Transaction = require('../model/transaction');
const BetEvent = require('../model/betevent')

const mockVoutValidation = async () => {
  const data = {
    scriptPubKey: {
      type: 'nulldata',
      asm: 'OP_RETURN 42010400000381010303',
    },
  };
  
  const res = await methods.validateVoutData(data);

  return res;
};

const getTransactionList = async () => {
  const res = await Transaction.find();

  const transactionList = [];

  for (let x =0; x < res.length; x += 1) {
    const thisTx = res[x];

    if (!transactionList.includes(thisTx.txType)) {
      transactionList.push(thisTx.txType);
    }
  }

  return { transactionList, count: res.length } ;
};

const getTransactionTypeCount = async () => {

  const lists = await getTransactionList();
  const transactionCount = {};

  for (let x = 0; x < lists.transactionList.length; x += 1) {
    const txType = lists.transactionList[x];
    const res = await Transaction.countDocuments({ txType });

    transactionCount[txType] = res;
  }
  transactionCount.totalCount = lists.count;

  // console.log(transactionCount);

  return transactionCount;
};

const exec = async () => {
  const res = await BetEvent.find();

  console.log(res);
  console.log('End of list');
  return res;
};

mockVoutValidation();
// exec();
getTransactionTypeCount()
