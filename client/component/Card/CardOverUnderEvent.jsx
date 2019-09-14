import PropTypes from 'prop-types'
import React from 'react'
import { Link } from 'react-router-dom'
import Card from './Card'
import { timeStamp24Format } from '../../../lib/date'
import numeral from 'numeral'
import { compose } from 'redux'
import { translate } from 'react-i18next'
import connect from 'react-redux/es/connect/connect'

const CardOverUnderEvent = ({eventInfo, data, t}) => {
  if (eventInfo) {
    // let TotalsBets = { home: [], away: [], draw: [] };
    let over = [];
    let under = [];

    data.betActions.map((event) => {
      if (event.betChoose.includes('Totals - Over')) {
        over.push(event);
      } else if (event.betChoose.includes('Totals - Under')) {
        under.push(event);
      }
    });

    // const sortHomeBets = eventInfo.homeBets.map((event) => {
    //   if (event.betChoose == 'Totals - Over') {
    //     under.push(event);
    //   }
    // });
    // const sortAwayBets = eventInfo.awayBets.map((event) => {
    //   if (event.betChoose == 'Totals - Under') {
    //     TotalsBets.away.push(event);
    //   }
    // });
    // const sortDrawBets = eventInfo.drawBets.map((event) => {
    //   if (event.betChoose == 'Totals - Draw') {
    //     TotalsBets.draw.push(event);
    //   }
    // });

    const THomeBetAmount = over.reduce((acc, bet) => acc + bet.betValue, 0.0);
    const TAwayBetAmount = under.reduce((acc, bet) => acc + bet.betValue, 0.0);
    
    // const TDrawBetAmount = TotalsBets.draw.reduce((acc, bet) => acc + bet.betValue, 0.0);
    return <Card className="card--status">
      <h2>Over/Under</h2>
      <div className="card__row">
        <span className="card__label">{t('time')}:</span>
        {timeStamp24Format(eventInfo.events[0].timeStamp)}
      </div>
      <div className="card__row">
        <span className="card__label">{t('league')}:</span>
        {eventInfo.events[0].league}
      </div>
      <div className="card__row">
        <span className="card__label">match:</span>
        <span className="card__result">
          {`${eventInfo.events[0].homeTeam} vs ${eventInfo.events[0].awayTeam}`}
          </span>
      </div>
      <div className="card__row">
        <span className="card__label">Over Bet Num:</span>
        <span
          className="card__result">{over.length}</span>
      </div>
      <div className="card__row">
        <span className="card__label">Over Bet Amount:</span>
        <span className="card__result">
          <span className={`badge badge-danger`}>
            {numeral(THomeBetAmount).format('0,0.00000000')}
          </span>
        </span>
      </div>
      {/* <div className="card__row">
        <span className="card__label">{t('drawBetNum')}:</span>
        <span
          className="card__result">{eventInfo.drawBets.length}</span>
      </div>
      <div className="card__row">
        <span className="card__label">{t('drawBetAmount')}:</span>
        <span className="card__result">
           <span className={`badge badge-danger`}>
                {numeral(drawBetAmount).format('0,0.00000000')}</span></span>
      </div> */}
      <div className="card__row">
        <span className="card__label">Under Bet Num:</span>
        <span
          className="card__result">{under.length}</span>
      </div>
      <div className="card__row">
        <span className="card__label">Under Bet Amount:</span>
        <span className="card__result">
          <span className="badge badge-danger">
            {numeral(TAwayBetAmount).format('0,0.00000000')}
          </span>
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

CardOverUnderEvent.propTypes = {
  eventInfo: PropTypes.object
}

export default compose(
  translate('betEvent')
)(CardOverUnderEvent);
