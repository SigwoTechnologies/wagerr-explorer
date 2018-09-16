import PropTypes from 'prop-types'
import React from 'react'
import { Link } from 'react-router-dom'
import Card from './Card'
import { dateFormat } from '../../../lib/date'
import numeral from 'numeral'

const CardBetEvent = ({eventInfo}) => {

  if (eventInfo) {
    const homeBetAmount = eventInfo.homeBets.reduce((acc, bet) => acc + bet.betValue, 0.0)
    const awayBetAmount = eventInfo.awayBets.reduce((acc, bet) => acc + bet.betValue, 0.0)
    const drawBetAmount = eventInfo.drawBets.reduce((acc, bet) => acc + bet.betValue, 0.0)
    return <Card title="Bet Event" className="card--status">
      <div className="card__row">
        <span className="card__label">Time:</span>
        {dateFormat(eventInfo.events[0].start)}
      </div>
      <div className="card__row">
        <span className="card__label">League:</span>
        {eventInfo.events[0].league} {eventInfo.events[0].info}
      </div>
      <div className="card__row">
        <span className="card__label">Home Team:</span>
        <span className="card__result">
               {eventInfo.events[0].homeTeam}
            </span>
      </div>
      <div className="card__row">
        <span className="card__label">Away Team:</span>
        <span className="card__result">
                {eventInfo.events[0].awayTeam}
          </span>
      </div>
      <div className="card__row">
        <span className="card__label">Home Bet Num:</span>
        <span
          className="card__result">{eventInfo.homeBets.length}</span>
      </div>
      <div className="card__row">
        <span className="card__label">Home Bet Amount:</span>
        <span className="card__result"> <span className={`badge badge-danger`}>
                {numeral(homeBetAmount).format('0,0.0000')}</span></span>
      </div>
      <div className="card__row">
        <span className="card__label">Draw Bet Num:</span>
        <span
          className="card__result">{eventInfo.drawBets.length}</span>
      </div>
      <div className="card__row">
        <span className="card__label">Draw Bet Amount:</span>
        <span className="card__result">
           <span className={`badge badge-danger`}>
                {numeral(drawBetAmount).format('0,0.0000')}</span></span>
      </div>
      <div className="card__row">
        <span className="card__label">Away Bet Num:</span>
        <span
          className="card__result">{eventInfo.awayBets.length}</span>
      </div>
      <div className="card__row">
        <span className="card__label">Away Bet Amount:</span>
        <span className="card__result"><span className={`badge badge-danger`}>
               {numeral(awayBetAmount).format('0,0.0000')}</span>
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
