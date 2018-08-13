import PropTypes from 'prop-types'
import React from 'react'

import Card from './Card'
import { dateFormat } from '../../../lib/date'
import { Link } from 'react-router-dom'
import numeral from 'numeral'

const CardBetResult = ({eventInfo}) => {
  const result = eventInfo.result ? eventInfo.result : 'Waiting For Oracle'

  if (result) {
    const homeBetAmount = eventInfo.homeBets.reduce((acc, bet) => acc + bet.betValue, 0.0)
    const awayBetAmount = eventInfo.awayBets.reduce((acc, bet) => acc + bet.betValue, 0.0)
    const drawBetAmount = eventInfo.drawBets.reduce((acc, bet) => acc + bet.betValue, 0.0)
    let winningBetAmount
    let winningOdds
    if (eventInfo.events[0].homeTeam === result.result) {
      winningBetAmount = homeBetAmount
      winningOdds = eventInfo.events[0].homeOdds / 10000
    } else if (eventInfo.events[0].awayTeam === result.result) {
      winningBetAmount = awayBetAmount
      winningOdds = eventInfo.events[0].awayOdds / 10000
    } else if ('DRW' === result.result) {
      winningBetAmount = drawBetAmount
      winningOdds = eventInfo.events[0].drawOdds / 10000
    }
    const betAmount = homeBetAmount + awayBetAmount + drawBetAmount
    const payoutAmount = (winningBetAmount * winningOdds - (winningBetAmount * winningOdds - winningBetAmount) * 0.06)
    const supplyChange = payoutAmount - betAmount
    return <Card title="Bet Result" className="card--status">
      <div className="card__row">
        <span className="card__label">Result:</span>
        <span className="card__result">
               {result.result}
            </span>
      </div>
      <div className="card__row">
        <span className="card__label">TxId:</span>
        <span className="card__result">
               <Link to={`/tx/${ result.txId}`}>
                  {result.txId}
                </Link>
            </span>
      </div>
      <div className="card__row">
        <span className="card__label">Payout Block:</span>
        <span className="card__result">
          <Link to={`/block/${result.blockHeight + 1}`}>{result.blockHeight + 1}</Link>
            </span>
      </div>
      <div className="card__row">
        <span className="card__label">Bet Amount:</span>
        <span className="card__result">
          <span className={`badge badge-danger`}>
            {numeral(betAmount).format('0,0.0000')}</span>
        </span>
      </div>
      <div className="card__row">
        <span className="card__label">Payout Amount:</span>
        <span className="card__result">
          <span className={`badge badge-success`}>
            {numeral(payoutAmount).format('0,0.0000')}</span>
        </span>
      </div>
      <div className="card__row">
        <span className="card__label">Supply Change:</span>
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
        <span className="card__label">Result:</span>
        <span className="card__result">
              Waiting For Oracle
            </span>
      </div>
    </Card>
  }

}

CardBetResult.propTypes = {
  eventInfo: PropTypes.object
}

export default CardBetResult
