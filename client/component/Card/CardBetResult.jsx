import PropTypes from 'prop-types'
import React from 'react'

import Card from './Card'
import { dateFormat } from '../../../lib/date'
import { Link } from 'react-router-dom'

const CardBetResult = ({betResult}) => {
  const result = betResult ? betResult.result : 'Waiting For Oracle'
  const txId = betResult ? betResult.txId : ''

  if (betResult) {
    return <Card title="Bet Result" className="card--status">
      <div className="card__row">
        <span className="card__label">Result:</span>
        <span className="card__result">
               {result}
            </span>
      </div>
      <div className="card__row">
        <span className="card__label">TxId:</span>
        <span className="card__result">
               <Link to={`/tx/${ txId}`}>
                  {txId}
                </Link>
            </span>
      </div>
      <div className="card__row">
        <span className="card__label">Payout Block:</span>
        <span className="card__result">
          <Link to={`/block/${betResult.blockHeight+1}`}>{betResult.blockHeight+1}</Link>
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
  betResult: PropTypes.object
}

export default CardBetResult
