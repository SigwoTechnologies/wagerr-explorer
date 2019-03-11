require('babel-polyfill')
require('../lib/cron')
const config = require('../config')
const {exit, rpc} = require('../lib/cron')
const fetch = require('../lib/fetch')
const {forEach} = require('p-iteration')
const locker = require('../lib/locker')
const moment = require('moment')
// Models.
const ListEvent = require('../model/listevent')

/**
 * Get a list of the mns and request IP information
 * from freegeopip.net.
 */
async function syncListEvents () {
  const date = moment().utc().startOf('minute').toDate()

  await ListEvent.deleteMany({})

  // Increase the timeout for listevents.
  rpc.timeout(10000) // 10 secs

  const events = await rpc.call('listevents')
  const inserts = []
  await forEach(events, async (event) => {
    let teams = await getTeams(event)

    const listEvent = new ListEvent({
      txId: event['tx-id'],
      id: event.id,
      createdAt: date,
      name: event.name,
      round: event.round,
      starting: event.starting,
      teams: teams
    })

    inserts.push(listEvent)
  })

  if (inserts.length) {
    await ListEvent.insertMany(inserts)
  }
}

async function getTeams (event) {
  // Setup the outputs for the transaction.
  const teamsResult = []
  event.teams.forEach((team) => {
    const teamItem = {
      name: team.name,
      odds: team.odds,
    }
    teamsResult.push(teamItem)
  })
  return teamsResult
}

/**
 * Handle locking.
 */
async function update () {
  const type = 'listevent'
  let code = 0

  try {
    locker.lock(type)
    await syncListEvents()
  } catch (err) {
    console.log(err)
    code = 1
  } finally {
    try {
      locker.unlock(type)
    } catch (err) {
      console.log(err)
      code = 1
    }
    exit(code)
  }
}

update()
