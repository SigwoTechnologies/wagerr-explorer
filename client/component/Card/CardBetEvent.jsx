import PropTypes from 'prop-types'
import React from 'react'
import { Link } from 'react-router-dom'
import Card from './Card'
import { dateFormat } from '../../../lib/date'

const CardBetEvent = ({eventInfo}) => {

  if (eventInfo) {
    return <Card title="Bet Event" className="card--status">
      <div className="card__row">
        <span className="card__label">Time:</span>
        {dateFormat(eventInfo.event.start)}
      </div>
      <div className="card__row">
        <span className="card__label">League:</span>
        {eventInfo.event.league} {eventInfo.event.info}
      </div>
      <div className="card__row">
        <span className="card__label">Home Team:</span>
        <span className="card__result">
               {eventInfo.event.homeTeam}
            </span>
      </div>
      <div className="card__row">
        <span className="card__label">Away Team:</span>
        <span className="card__result">
                {eventInfo.event.awayTeam}
          </span>
      </div>
      <div className="card__row">
        <span className="card__label">Home Bet:</span>
        <span className="card__result">{eventInfo.homeBetNum} ({eventInfo.event.homeOdds > 10000 ? eventInfo.event.homeOdds / 10000 : eventInfo.event.homeOdds})</span>
      </div>
      <div className="card__row">
        <span className="card__label">Draw Bet:</span>
        <span className="card__result">{eventInfo.drawBetNum} ({eventInfo.event.drawOdds > 10000 ? eventInfo.event.drawOdds / 10000 : eventInfo.event.drawOdds})</span>
      </div>
      <div className="card__row">
        <span className="card__label">Away Bet:</span>
        <span className="card__result">{eventInfo.awayBetNum} ({eventInfo.event.awayOdds > 10000 ? eventInfo.event.awayOdds / 10000 : eventInfo.event.awayOdds})</span>
      </div>
      <div className="card__row">
        <span className="card__label">TxId:</span>
        <span className="card__result">
               <Link to={`/tx/${ eventInfo.event.txId }`}>
                  {eventInfo.event.txId}
                </Link>
            </span>
      </div>
    </Card>
  } else {
    return <Card title="Bet Event" className="card--status">
      <div className="card__row">
        Can't find event
      </div>
    </Card>
  }

}

CardBetEvent.propTypes = {
  eventInfo: PropTypes.object
}

export default CardBetEvent
