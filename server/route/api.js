
const express = require('express');
const blockex = require('../handler/blockex');
const faucet = require('../handler/faucet');
const iquidus = require('../handler/iquidus');
const custom = require('../handler/custom');
const opCode = require('../handler/opcode');

const router = express.Router();

router.get('/address/:hash', blockex.getAddress);
router.get('/block/average', blockex.getAvgBlockTime());
router.get('/block/is/:hash', blockex.getIsBlock);
router.get('/block/:hash', blockex.getBlock);
router.get('/coin', blockex.getCoin);
router.get('/coin/history', blockex.getCoinHistory);
router.get('/coin/week', blockex.getCoinsWeek());
router.get('/masternode', blockex.getMasternodes);
router.get('/masternode/average', blockex.getAvgMNTime());
router.get('/masternode/:hash', blockex.getMasternodeByAddress);
router.get('/masternodecount', blockex.getMasternodeCount);
router.get('/peer', blockex.getPeer);
router.get('/supply', blockex.getSupply);
router.get('/top100', blockex.getTop100);
router.get('/tx', blockex.getTXs);
router.get('/tx/latest', blockex.getTXLatest);
router.get('/tx/week', blockex.getTXsWeek());
router.get('/tx/:hash', blockex.getTX);
router.get('/bet/listevents', blockex.getListEvents);
router.get('/bet/events', blockex.getBetEvents);
router.get('/bet/events/query', blockex.getBetQuery);
router.get('/bet/actions', blockex.getBetActions);
router.get('/bet/results', blockex.getBetResults);
router.get('/bet/spreads', blockex.getBetspreads);
router.get('/bet/totals', blockex.getBetTotals);
router.get('/bet/event/:eventId/info', blockex.getBetEventInfo);
router.get('/bet/events/info', blockex.getBetEventsInfo);
router.get('/bet/action/week', blockex.getBetActioinsWeek());
router.get('/pps/current', blockex.getCurrentProposals);
router.get('/statistic/perweek', blockex.getStatisticPerWeek());

// Lotto routes
router.get('/lotto/events', blockex.getLottoEvents);
router.get('/lotto/bets', blockex.getLottoBets);
router.get('/lotto/results', blockex.getLottoResults);
router.get('/lotto/event/:eventId/info', blockex.getLottoEventInfo);

// faucet
router.get('/faucet/donate', faucet.donate);

// Iquidus Explorer routes.
router.get('/getdifficulty', iquidus.getdifficulty);
router.get('/getconnectioncount', iquidus.getconnectioncount);
router.get('/getblockcount', iquidus.getblockcount);
router.get('/getblockhash', iquidus.getblockhash);
router.get('/getblock', iquidus.getblock);
router.get('/getrawtransaction', iquidus.getrawtransaction);
router.get('/getnetworkhashps', iquidus.getnetworkhashps);

// Custom
router.get('/custom/betstatus', custom.getBetStatus);
router.get('/custom/supply', custom.getCustomSupply);

// OpCode decryption
router.get('/opcodes/:hex_value', opCode.decodeOP);

module.exports =  router;
