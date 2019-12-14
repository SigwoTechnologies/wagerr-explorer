import PropTypes from 'prop-types'
import React from 'react'

import Card from './Card'
import { Link } from 'react-router-dom'
import numeral from 'numeral'
import { compose } from 'redux'
import { translate } from 'react-i18next'

const getClosestValue = (approxValue, vout, full) => {
  let currentDifference;
  let record = {};

  for (let x = 0; x < vout.length; x += 1) {
    const thisVout = vout[x];

    if (thisVout.address && thisVout.address !== 'NON_STANDARD') {
      if (currentDifference === undefined) {
        record = thisVout;
        currentDifference = Math.abs(approxValue - thisVout.value);
      } else {
        const difference = Math.abs(approxValue - thisVout.value);
    
        if (currentDifference > difference) {
          currentDifference = difference;
          record = thisVout;
        }
      }
    }
  }

  if (full)  {
    return record;
  }
  return record.value;
};

const getResultCompilation = (eventInfo, betActions) => {
  const results = eventInfo.results;
  let totalBet = 0;
  let totalMint = 0;

  const betActionsValue = betActions.reduce((acc, bet) => acc + bet.betValue, 0.0);

  totalBet = betActionsValue;

  let payoutBlock;
  let address;
  let prizeAmount = 0;
  let OraclePortion = 0;
  let payoutTx = {};
  let vout;

  // End of calculations here

  if (results.length > 0) {
    /*eventInfo.results.forEach(result =>{
      let startIndex = 2
      if (result.payoutTx.vout[1].address === result.payoutTx.vout[2].address) {
        startIndex = 3
      }
      for (let i = startIndex; i < result.payoutTx.vout.length - 1; i++) {
        totalMint += result.payoutTx.vout[i].value
      }
    })*/
    payoutTx  = results[0].payoutTx || { };
    payoutBlock = payoutTx.blockHeight;
    prizeAmount = totalBet * 0.80;
    OraclePortion = totalBet * 0.02;

    if (payoutTx.vout) {
      vout = payoutTx.vout;

      const PrizeObject = getClosestValue(prizeAmount, vout, true);
      address = PrizeObject.address;
      prizeAmount = PrizeObject.value;
    }
  }

  const supplyChange =  totalBet * 0.18;

  return { address, supplyChange, OraclePortion, prizeAmount, payoutBlock, payoutTx, totalBet, vout, };
};

const CardBetResult = ({eventInfo, data, t}) => {
  if (eventInfo.results.length !== 0) {
    const {
      supplyChange,
      OraclePortion,
      prizeAmount,
      payoutBlock,
      payoutTx,
      totalBet,
      address,
    } = getResultCompilation(eventInfo, data.betActions);

    return <Card title={t('Lotto Result')} className="card--status">
      {eventInfo.results.map((resultItem) => <div key={resultItem.txId}>
        <div className="card__row">
          <span className="card__label">{t('Winning Address')}:</span>
          <span className="card__result">
            <strong>
              {address}
            </strong>
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
            {numeral(totalBet).format('0,0.00000000')}</span>
        </span>
      </div>
      <div className="card__row">
        <span className="card__label">{t('Prize Amount')}:</span>
        <span className="card__result">
          <span className={`badge badge-success`}>
            {numeral(prizeAmount).format('0,0.00000000')}</span>
        </span>
      </div>
      <div className="card__row">
        <span className="card__label">{t('Oracle Portion')}:</span>
        <span className="card__result">
          <span className={`badge badge-success`}>
            {numeral(OraclePortion).format('0,0.00000000')}</span>
        </span>
      </div>
      <div className="card__row">
        <span className="card__label">{t('supplyChange')}:</span>
        <span className="card__result">
        <span className={'badge badge-danger'}>
                {numeral(supplyChange).format('0,0.00000000')}
              </span>
          </span>
      </div>
    </Card>
  } else {
    return <Card title="Bet Result" className="card--status">
      <div className="card__row">
        <span className="card__label">{t('Lotto Result')}:</span>
        <span className="card__result">
              {t('Lotto Pending')}
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
