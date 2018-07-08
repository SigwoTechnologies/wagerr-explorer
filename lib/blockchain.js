
const params = {
  LAST_POW_BLOCK: 1001
};

const avgBlockTime = 60; // 1 minutes (60 seconds)

const blocksPerDay = (24 * 60 * 60) / avgBlockTime; // 960

const blocksPerWeek = blocksPerDay * 7; // 6720

const blocksPerMonth = (blocksPerDay * 365.25) / 12; // 29220

const blocksPerYear = blocksPerDay * 365.25; // 350640

const mncoins = 25000.0;

const getMNBlocksPerDay = (mns) => {
  return blocksPerDay / mns;
};

const getMNBlocksPerWeek = (mns) => {
  return getMNBlocksPerDay(mns) * (365.25 / 52);
};

const getMNBlocksPerMonth = (mns) => {
  return getMNBlocksPerDay(mns) * (365.25 / 12);
};

const getMNBlocksPerYear = (mns) => {
  return getMNBlocksPerDay(mns) * 365.25;
};

const getMNSubsidy = (nHeight = 0, nMasternodeCount = 0, nMoneySupply = 0) => {
  const blockValue = getSubsidy(nHeight);
  let ret = 0.0;
  if (nHeight >= 0 && nHeight <=params.LAST_POW_BLOCK) {
    ret = 0;
  } else if (nHeight > params.LAST_POW_BLOCK) {
    let mNodeCoins = nMasternodeCount * 25000;
    if (mNodeCoins === 0) {
      ret = 0;
    } else if (nHeight > params.LAST_POW_BLOCK) {
      ret = blockValue * .75;
    } else {
      ret = blockValue * .75;
    }
  }
  return ret;
};

const getSubsidy = (nHeight = 1) => {
  let nSubsidy = 0.0;
  if (nHeight === 0) {
    // Genesis block
    nSubsidy = 0;
  } else if (nHeight === 1) {
    /* PREMINE: Current available wagerr on DEX marketc 198360471 wagerr
    Info abobut premine:
    Full premine size is 198360471. First 100 blocks mine 250000 wagerr per block - 198360471 - (100 * 250000) = 173360471
    */
    // 87.4 % of premine
    nSubsidy = 173360471;
  } else if (nHeight > 1 && nHeight <= 101 && nHeight <= params.LAST_POW_BLOCK) { // check for last PoW block is not required, it does not harm to leave it *** TODO ***
    // PoW Phase 1 does produce 12.6 % of full premine (25000000 WGR)
    nSubsidy = 250000 ;
  } else if (nHeight > 1 && nHeight > 101 && nHeight <= params.LAST_POW_BLOCK) {
    // PoW Phase does not produce any coins
    nSubsidy = 0 ;
  } else if (nHeight > params.LAST_POW_BLOCK && nHeight <= 10000) {
    // PoS - Phase 1 lasts until block 1110)
    nSubsidy = 0;
  } else if (nHeight > params.LAST_POW_BLOCK && nHeight > 10000) {
    // PoS - Phase 2 lasts until - undefined)
    nSubsidy = 3.8;
  } else {
    nSubsidy = 0;
  }
  return nSubsidy;
};

const getROI = (subsidy, mns) => {
  return ((getMNBlocksPerYear(mns) * subsidy) / mncoins) * 100.0;
};

const isAddress = (s) => {
  return typeof(s) === 'string' && s.length === 34;
};

const isBlock = (s) => {
  return !isNaN(s) || (typeof(s) === 'string');
};

const isPoS = (b) => {
  return !!b && b.height > params.LAST_POW_BLOCK; // > 182700
};

const isTX = (s) => {
  return typeof(s) === 'string' && s.length === 64;
};

module.exports = {
  avgBlockTime,
  blocksPerDay,
  blocksPerMonth,
  blocksPerWeek,
  blocksPerYear,
  mncoins,
  params,
  getMNBlocksPerDay,
  getMNBlocksPerMonth,
  getMNBlocksPerWeek,
  getMNBlocksPerYear,
  getMNSubsidy,
  getSubsidy,
  getROI,
  isAddress,
  isBlock,
  isPoS,
  isTX
};
