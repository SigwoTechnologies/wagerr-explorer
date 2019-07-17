import PropTypes from 'prop-types'
import React from 'react'
import { Link } from 'react-router-dom'
import Card from './Card'
import { timeStamp24Format } from '../../../lib/date'
import numeral from 'numeral'
import { compose } from 'redux'
import { translate } from 'react-i18next'
import connect from 'react-redux/es/connect/connect'

const CardSpreadEvent = ({eventInfo, t}) => {
  if (eventInfo) {
    let SpreadsBets = { home: [], away: [], draw: [] };

    const sortHomeBets = eventInfo.homeBets.map((event) => {
      if (event.betChoose.includes('Spreads - Home')) {
        SpreadsBets.home.push(event);
      }
    });
    const sortAwayBets = eventInfo.awayBets.map((event) => {
      if (event.betChoose.includes('Spreads - Away')) {
        SpreadsBets.away.push(event);
      }
    });
    const sortDrawBets = eventInfo.drawBets.map((event) => {
      if (event.betChoose.includes('Spreads - Draw')) {
        MoneyLineBets.draw.push(event);
      }
    });

    const SHomeBetAmount = SpreadsBets.home.reduce((acc, bet) => acc + bet.betValue, 0.0);
    const SAwayBetAmount = SpreadsBets.away.reduce((acc, bet) => acc + bet.betValue, 0.0);
    const SDrawBetAmount = SpreadsBets.draw.reduce((acc, bet) => acc + bet.betValue, 0.0);

    return <Card className="card--status">
      {/* <Card title={t('betEvent')} className="card--status"> */}
      <h2>Spread Event</h2>
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
          className="card__result">{SpreadsBets.home.length}</span>
      </div>
      <div className="card__row">
        <span className="card__label">{t('homeBetAmount')}:</span>
        <span className="card__result"> <span className={`badge badge-danger`}>
                {numeral(SHomeBetAmount).format('0,0.00000000')}</span></span>
      </div>
      <div className="card__row">
        <span className="card__label">{t('awayBetNum')}:</span>
        <span
          className="card__result">{SpreadsBets.away.length}</span>
      </div>
      <div className="card__row">
        <span className="card__label">{t('awayBetAmount')}:</span>
        <span className="card__result"><span className={`badge badge-danger`}>
               {numeral(SAwayBetAmount).format('0,0.00000000')}</span>
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

CardSpreadEvent.propTypes = {
  eventInfo: PropTypes.object
}

export default compose(
  translate('betEvent')
)(CardSpreadEvent);
