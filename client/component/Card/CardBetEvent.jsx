import PropTypes from 'prop-types'
import React from 'react'
import { Link } from 'react-router-dom'
import Card from './Card'
import { dateFormat } from '../../../lib/date'

const CardBetEvent = ({betEvent}) => {

  if (betEvent) {
    return <Card title="Bet Event" className="card--status">
      <div className="card__row">
        <span className="card__label">Time:</span>
        {dateFormat(betEvent.start)}
      </div>
      <div className="card__row">
        <span className="card__label">League:</span>
        {betEvent.league} {betEvent.info}
      </div>
      <div className="card__row">
        <span className="card__label">Home Team:</span>
        <span className="card__result">
               {betEvent.homeTeam}
            </span>
      </div>
      <div className="card__row">
        <span className="card__label">Away Team:</span>
        <span className="card__result">
                {betEvent.awayTeam}
          </span>
      </div>
      <div className="card__row">
        <span className="card__label">Home Odds:</span>
        <span className="card__result">{betEvent.homeOdds / 10000}</span>
      </div>
      <div className="card__row">
        <span className="card__label">Draw Odds:</span>
        <span className="card__result">{betEvent.drawOdds / 10000}</span>
      </div>
      <div className="card__row">
        <span className="card__label">Away Odds:</span>
        <span className="card__result">{betEvent.awayOdds / 10000}</span>
      </div>
      <div className="card__row">
        <span className="card__label">TxId:</span>
        <span className="card__result">
               <Link to={`/tx/${ betEvent.txId }`}>
                  {betEvent.txId}
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
  betEvent: PropTypes.object
}

export default CardBetEvent
