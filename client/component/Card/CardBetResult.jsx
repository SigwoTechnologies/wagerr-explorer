import PropTypes from 'prop-types'
import React from 'react'

import Card from './Card'
import { Link } from 'react-router-dom'
import numeral from 'numeral'
import { compose } from 'redux'
import { translate } from 'react-i18next'

const CardBetResult = ({eventInfo, t}) => {
  if (eventInfo.results.length !== 0) {
    const results = eventInfo.results
    const homeBetAmount = eventInfo.homeBets.reduce((acc, bet) => acc + bet.betValue, 0.0)
    const awayBetAmount = eventInfo.awayBets.reduce((acc, bet) => acc + bet.betValue, 0.0)
    const drawBetAmount = eventInfo.drawBets.reduce((acc, bet) => acc + bet.betValue, 0.0)
    let winningBetAmount
    let winningOdds
    if (eventInfo.events[0].homeTeam === results[0].result) {
      winningBetAmount = homeBetAmount
      winningOdds = eventInfo.events[0].homeOdds / 10000
    } else if (eventInfo.events[0].awayTeam === results[0].result) {
      winningBetAmount = awayBetAmount
      winningOdds = eventInfo.events[0].awayOdds / 10000
    } else if ('DRW' === results[0].result) {
      winningBetAmount = drawBetAmount
      winningOdds = eventInfo.events[0].drawOdds / 10000
    }
    const betAmount = homeBetAmount + awayBetAmount + drawBetAmount
    const payoutAmount = (winningBetAmount * winningOdds - (winningBetAmount * winningOdds - winningBetAmount) * 0.06)
    const supplyChange = payoutAmount - betAmount
    return <Card title={t('betResult')} className="card--status">
      {results.map((resultItem) => <div key={resultItem.txId}>
        <div className="card__row">
          <span className="card__label">{t('result')}:</span>
          <span className="card__result">
               {resultItem.result}
            </span>
        </div>
        <div className="card__row">
          <span className="card__label">{t('txId')}:</span>
          <span className="card__result">
        <Link to={`/tx/${ resultItem.txId}`}>
      {resultItem.txId}
        </Link>
        </span>
        </div>
        <div className="card__row">
          <span className="card__label">{t('payoutBlock')}:</span>
          <span className="card__result">
        <Link to={`/block/${resultItem.blockHeight + 1}`}>{resultItem.blockHeight + 1}</Link>
        </span>
        </div>
      </div>)}


      <div className="card__row">
        <span className="card__label">{t('betAmount')}:</span>
        <span className="card__result">
          <span className={`badge badge-danger`}>
            {numeral(betAmount).format('0,0.0000')}</span>
        </span>
      </div>
      <div className="card__row">
        <span className="card__label">{t('payoutAmount')}:</span>
        <span className="card__result">
          <span className={`badge badge-success`}>
            {numeral(payoutAmount).format('0,0.0000')}</span>
        </span>
      </div>
      <div className="card__row">
        <span className="card__label">{t('supplyChange')}:</span>
        <span className="card__result">
        <span className={`badge badge-${ supplyChange < 0 ? 'danger' : 'success' }`}>
                {numeral(supplyChange).format('0,0.0000')}
              </span>
          </span>
      </div>
    </Card>
  } else {
    return <Card title="Bet Result" className="card--status">
      <div className="card__row">
        <span className="card__label">{t('result')}:</span>
        <span className="card__result">
              {t('waitingForOracle')}
            </span>
      </div>
    </Card>
  }

}

CardBetResult.propTypes = {
  eventInfo: PropTypes.object
}

export default compose(
  translate('betEvent')
)(CardBetResult);
