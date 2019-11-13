require('babel-polyfill');

const { log } = console;


const Betupdate = require('../model/betupdate');
const Betspread = require('../model/betspread');
const BetEvent = require('../model/betevent');

/**
 * Handle locking.
 */
async function update () {
  let response;

  try {
    // We find the betspreads that have not been matched yet
    const spreads = await Betspread.find({ matched: false });
    const events = {};

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
      }
    } else {
      log('No spreads to match');
    }

  } catch (err) {
    log('Update() error');
    log(err);
    throw new Error(err);
  } 

  return response;
}

module.exports = update;
