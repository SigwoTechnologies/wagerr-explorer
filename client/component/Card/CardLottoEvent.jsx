import PropTypes from 'prop-types'
import React from 'react'
import { Link } from 'react-router-dom'
import Card from './Card'
import { timeStamp24Format } from '../../../lib/date'
import numeral from 'numeral'
import { compose } from 'redux'
import { translate } from 'react-i18next'
import moment from 'moment'
import connect from 'react-redux/es/connect/connect'

const CardLottoEvent = ({eventInfo, betActions, t}) => {

  if (eventInfo) {
    const betActionsValue = betActions.reduce((acc, bet) => acc + bet.betValue, 0.0);
    const eventDate = moment(new Date(eventInfo.events[0].createdAt)).utc().format('YYYY-MM-DD HH:mm:ss');

    return <Card title={t('Weekly Lotto')} className="card--status">
      <div className="card__row">
        <span className="card__label">Start Time:</span>
        {eventDate}
      </div>
      <div className="card__row">
        <span className="card__label">Event Id:</span>
        <span
          className="card__result">{eventInfo.events[0].eventId}</span>
      </div>
      <div className="card__row">
        <span className="card__label">Ticket Count:</span>
        <span
          className="card__result">{betActions.length}</span>
      </div>
      <div className="card__row">
        <span className="card__label">Bet Amount:</span>
        <span className="card__result"> <span className={`badge badge-danger`}>
                {numeral(betActionsValue).format('0,0.00000000')}</span></span>
      </div>
    </Card>
  } else {
    return <Card title="Weekly Lotto" className="card--status">
      <div className="card__row">
        {t('cantFindEvent')}
      </div>
    </Card>
  }

}

CardLottoEvent.propTypes = {
  eventInfo: PropTypes.object
}

export default compose(
  translate('lottoEvent')
)(CardLottoEvent);
