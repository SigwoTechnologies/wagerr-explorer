import PropTypes from 'prop-types'
import React from 'react'
import { Link } from 'react-router-dom'
import Card from './Card'
import { timeStamp24Format } from '../../../lib/date'
import numeral from 'numeral'
import { compose } from 'redux'
import { translate } from 'react-i18next'
import connect from 'react-redux/es/connect/connect'

const CardBetEvent = ({eventInfo, t}) => {

  if (eventInfo) {
    const homeBetAmount = eventInfo.homeBets.reduce((acc, bet) => acc + bet.betValue, 0.0)
    const awayBetAmount = eventInfo.awayBets.reduce((acc, bet) => acc + bet.betValue, 0.0)
    const drawBetAmount = eventInfo.drawBets.reduce((acc, bet) => acc + bet.betValue, 0.0)
    return <Card title={t('betEvent')} className="card--status">
      <div className="card__row">
        <span className="card__label">{t('time')}:</span>
        {timeStamp24Format(eventInfo.events[0].timeStamp)}
      </div>
      <div className="card__row">
        <span className="card__label">{t('league')}:</span>
        {eventInfo.events[0].league}
      </div>
      <div className="card__row">
        <span className="card__label">{t('homeTeam')}:</span>
        <span className="card__result">
               {eventInfo.events[0].homeTeam}
            </span>
      </div>
      <div className="card__row">
        <span className="card__label">{t('awayTeam')}:</span>
        <span className="card__result">
                {eventInfo.events[0].awayTeam}
          </span>
      </div>
      <div className="card__row">
        <span className="card__label">{t('homeBetNum')}:</span>
        <span
          className="card__result">{eventInfo.homeBets.length}</span>
      </div>
      <div className="card__row">
        <span className="card__label">{t('homeBetAmount')}:</span>
        <span className="card__result"> <span className={`badge badge-danger`}>
                {numeral(homeBetAmount).format('0,0.00000000')}</span></span>
      </div>
      <div className="card__row">
        <span className="card__label">{t('drawBetNum')}:</span>
        <span
          className="card__result">{eventInfo.drawBets.length}</span>
      </div>
      <div className="card__row">
        <span className="card__label">{t('drawBetAmount')}:</span>
        <span className="card__result">
           <span className={`badge badge-danger`}>
                {numeral(drawBetAmount).format('0,0.00000000')}</span></span>
      </div>
      <div className="card__row">
        <span className="card__label">{t('awayBetNum')}:</span>
        <span
          className="card__result">{eventInfo.awayBets.length}</span>
      </div>
      <div className="card__row">
        <span className="card__label">{t('awayBetAmount')}:</span>
        <span className="card__result"><span className={`badge badge-danger`}>
               {numeral(awayBetAmount).format('0,0.00000000')}</span>
          </span>
      </div>
    </Card>
  } else {
    return <Card title="Bet Event" className="card--status">
      <div className="card__row">
        {t('cantFindEvent')}
      </div>
    </Card>
  }

}

CardBetEvent.propTypes = {
  eventInfo: PropTypes.object
}

export default compose(
  translate('betEvent')
)(CardBetEvent);
