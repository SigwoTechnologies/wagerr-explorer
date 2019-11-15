require('babel-polyfill');

const { log } = console;


const Betupdate = require('../model/betupdate');
const Betspread = require('../model/betspread');
const BetEvent = require('../model/betevent');
const BetAction = require('../model/betaction');


async function resyncActions(spread) {
  // We first get the next spread
  const nextSpreads = await Betspread.find({
    eventId: spread.eventId,
    createdAt: { $gt: spread.createdAt },
  });
  const nextSpread = nextSpreads[0];

  const query = {
    $gte: spread.createdAt,
  };

  if (nextSpread) {
    query['$lt'] = nextSpread.createdAt;
  }

  // We find the actions that are between this spread
  // and the next spread
  const actions = await BetAction.find({
    eventId: spread.eventId,
    createdAt: query,
    'transaction.outcome': { $in: [4, 5] },
  });
  
  // log(`Bet Actions to resync => ${actions.length}`);

  for (let x = 0; x < actions.length; x += 1) {
    const thisAction = actions[x];

    let updated = false;

    if (thisAction.spreadHomeOdds != spread.homeOdds) {
      updated = true;
      thisAction.homeOdds = spread.homeOdds;
    }

    if (thisAction.spreadAwayOdds != spread.awayOdds) {
      updated = true;
      thisAction.spreadAwayOdds = spread.awayOdds;
    }

    if (thisAction.spreadHomePoints != spread.homePoints) {
      updated = true;
      thisAction.spreadHomePoints = spread.homePoints;
    }


    if (thisAction.spreadAwayPoints != spread.awayPoints) {
      updated = true;
      thisAction.spreadAwayPoints = spread.awayPoints;
    }

    if (updated) {
      thisAction.fixed = true;
      await thisAction.save()
    }
  }
}

async function resyncRemainingActions() {
  // We first find all the actions that don't have the synced flag set to true
  const actions = await BetAction.find({
    fixed: false,
    'transaction.outcome': { $in: [4, 5] },
  });
  
  log(`${actions.length} betactions found that need to be resynced`);

  // Once we have the actions, we are going to loop through each of them
  // We are going to store eventIds into a dictionary to reduce the amount of calls being made

  const events = { };

  for (let x = 0; x < actions.length; x += 1) {
    const thisAction = actions[x];


    /* let event;

    // We get the original event data through this
    if (events[thisAction.eventId]) {
      event = events[thisAction.eventId];
    } else {
      event = await BetAction.findOne({ eventId: `${thisAction.eventId}` });
      events[thisAction.eventId] = event;
    } */

    // We are going to locate the spreads that apply to the particular betaction
    const spread = await Betspread.findOne({
      eventId: thisAction.eventId,
      createdAt: { $lte: thisAction.createdAt },
    })
    .sort({ createdAt: -1 });

    let updated = false;


    if (!spread) {
      console.log(spread);
      console.log(thisAction);
    }

    if (thisAction.spreadHomeOdds != spread.homeOdds) {
      updated = true;
      thisAction.homeOdds = spread.homeOdds;
    }

    if (thisAction.spreadAwayOdds != spread.awayOdds) {
      updated = true;
      thisAction.spreadAwayOdds = spread.awayOdds;
    }

    if (thisAction.spreadHomePoints != spread.homePoints) {
      updated = true;
      thisAction.spreadHomePoints = spread.homePoints;
    }


    if (thisAction.spreadAwayPoints != spread.awayPoints) {
      updated = true;
      thisAction.spreadAwayPoints = spread.awayPoints;
    }

    if (updated) {
      thisAction.fixed = true;
      await thisAction.save()
    }  
  }

  log(`Betactions resynced`);
}

async function update () {
  let response;

  try {
    // We find the betspreads that have not been matched yet
    const spreads = await Betspread.find({ matched: false });
    const events = {};

    log(`Spreads to resync => ${spreads.length}`);

    if (spreads.length > 0) {
      for(let x = 0; x < spreads.length; x +=1) {
        const thisSpread = spreads[x];
        
        // First thing we do is find eventData
        // it's either going to be in the dictionary or we'll need to 
        // query it
        let event;

        if (events[thisSpread.eventId] && events[thisSpread.eventId].data) {
          event = events[thisSpread.eventId].data;
        } else {
          event = await BetEvent.findOne({ eventId: `${thisSpread.eventId}` });
          // We save data to dictionary
          events[thisSpread.eventId] = {
            data: event,
          };
        }

        // After retrieving event data, we retrieve updates
        const updates = await Betupdate.find({
          eventId: `${thisSpread.eventId}`,
          createdAt: {
            $lte: thisSpread.createdAt,
          },
        });

        const lastMoneyLine = {};

        if (updates.length > 0) {
          const record = updates[updates.length - 1];
          lastMoneyLine.mhomeOdds = record.opObject.get('homeOdds');
          lastMoneyLine.mawayOdds = record.opObject.get('awayOdds');
        } else {
          lastMoneyLine.mhomeOdds = event ? event.homeOdds : null;
          lastMoneyLine.mawayOdds = event ? event.awayOdds : null;
        }

        const { mhomeOdds, mawayOdds } = lastMoneyLine;
        const spreadPoints = Math.abs(thisSpread.homePoints);
        const homePoints = (mhomeOdds < mawayOdds) ? -(spreadPoints) : spreadPoints;
        const awayPoints = (mhomeOdds > mawayOdds) ? -(spreadPoints) : spreadPoints;
        
        thisSpread.matched = true;
        thisSpread.homePoints = homePoints;
        thisSpread.awayPoints = awayPoints;
        thisSpread.synced = true;

        await thisSpread.save();


        // After the spread is saved, we are to update
        await resyncActions(thisSpread);
      }
    } else {
      log('No spreads to match');
    }

    await resyncRemainingActions();
  } catch (err) {
    log('Update() error');
    log(err);
    throw new Error(err);
  } 

  return response;
}

module.exports = update;
