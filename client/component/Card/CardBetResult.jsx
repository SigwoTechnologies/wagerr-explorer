import PropTypes from 'prop-types'
import React from 'react'

import Card from './Card'
import { Link } from 'react-router-dom'
import numeral from 'numeral'
import { compose } from 'redux'
import { translate } from 'react-i18next'

const CardBetResult = ({eventInfo, data, t}) => {
  if (eventInfo.results.length !== 0) {
    const results = eventInfo.results
    let totalBet = 0
    let totalMint = 0

    // Money Line

    let MoneyLineBets = { home: [], away: [], draw: [] };

    eventInfo.homeBets.map((event) => {
      if (event.betChoose == 'Money Line - Home Win') {
        MoneyLineBets.home.push(event);
      }
    });
    
    eventInfo.awayBets.map((event) => {
      if (event.betChoose == 'Money Line - Away Win') {
        MoneyLineBets.away.push(event);
      }
    });
    
    eventInfo.drawBets.map((event) => {
      if (event.betChoose == 'Money Line - Draw') {
        MoneyLineBets.draw.push(event);
      }
    });

    const MLHomeBetAmount = MoneyLineBets.home.reduce((acc, bet) => acc + bet.betValue, 0.0);
    const MLAwayBetAmount = MoneyLineBets.away.reduce((acc, bet) => acc + bet.betValue, 0.0);
    const MLDrawBetAmount = MoneyLineBets.draw.reduce((acc, bet) => acc + bet.betValue, 0.0);

    totalBet += MLHomeBetAmount + MLAwayBetAmount + MLDrawBetAmount;

    // Spreads
    let SpreadsBets = { home: [], away: [], draw: [] };

    eventInfo.homeBets.map((event) => {
      if (event.betChoose.includes('Spreads - Home')) {
        SpreadsBets.home.push(event);
      }
    });
    eventInfo.awayBets.map((event) => {
      if (event.betChoose.includes('Spreads - Away')) {
        SpreadsBets.away.push(event);
      }
    });
    
    eventInfo.drawBets.map((event) => {
      if (event.betChoose.includes('Spreads - Draw')) {
        MoneyLineBets.draw.push(event);
      }
    });

    const SHomeBetAmount = SpreadsBets.home.reduce((acc, bet) => acc + bet.betValue, 0.0);
    const SAwayBetAmount = SpreadsBets.away.reduce((acc, bet) => acc + bet.betValue, 0.0);
    const SDrawBetAmount = SpreadsBets.draw.reduce((acc, bet) => acc + bet.betValue, 0.0);

    totalBet +=  SHomeBetAmount + SAwayBetAmount + SDrawBetAmount;

    // Over / Under
    let over = [];
    let under = [];

    data.betActions.map((event) => {
      if (event.betChoose.includes('Totals - Over')) {
        over.push(event);
      } else if (event.betChoose.includes('Totals - Under')) {
        under.push(event);
      }
    });

    const THomeBetAmount = over.reduce((acc, bet) => acc + bet.betValue, 0.0);
    const TAwayBetAmount = under.reduce((acc, bet) => acc + bet.betValue, 0.0);
    
    totalBet += THomeBetAmount + TAwayBetAmount;

    // End of calculations here
  
    if (eventInfo.results.length > 0) {
      eventInfo.results.forEach(result =>{
        let startIndex = 2
        if (result.payoutTx.vout[1].address === result.payoutTx.vout[2].address) {
          startIndex = 3
        }
        for (let i = startIndex; i < result.payoutTx.vout.length - 1; i++) {
          totalMint += result.payoutTx.vout[i].value
        }
      })
    }

    const supplyChange = totalMint - totalBet
    const resultDisplay = (resultData) => {
      const { transaction } = resultData;
      // return `${resultData.result}  | \n\n Home ${transaction.homeScore / 10} Away ${transaction.awayScore / 10}`;
      let resultSection;
      if (transaction.homeScore > transaction.awayScore) {
        resultSection = (
          <span>
            {`${resultData.result}`} <br />
            <strong>{`Home ${transaction.homeScore / 10} `}</strong>
            {`Away ${transaction.awayScore / 10}`}
          </span>
        );
      } else if (transaction.homeScore < transaction.awayScore) {
        resultSection = (
          <span>
            {resultData.result} <br />
            {`Home ${transaction.homeScore / 10} `}
            <strong>{`Away ${transaction.awayScore / 10}`}</strong>
          </span>
        );
      } else {
        resultSection = (
          <span>
            {resultData.result} <br />
            {`Home ${transaction.homeScore / 10} `}
            {`Away ${transaction.awayScore / 10}`}
          </span>
        );
      }

      return resultSection;
    };

    return <Card title={t('betResult')} className="card--status">
      {results.map((resultItem) => <div key={resultItem.txId}>
        <div className="card__row">
          <span className="card__label">{t('result')}:</span>
          <span className="card__result">
            {resultDisplay(resultItem)}
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
        <span className="card__label">{t('payoutAmount')}:</span>
        <span className="card__result">
          <span className={`badge badge-success`}>
            {numeral(totalMint).format('0,0.00000000')}</span>
        </span>
      </div>
      <div className="card__row">
        <span className="card__label">{t('supplyChange')}:</span>
        <span className="card__result">
        <span className={`badge badge-${ supplyChange < 0 ? 'danger' : 'success' }`}>
                {numeral(supplyChange).format('0,0.00000000')}
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
