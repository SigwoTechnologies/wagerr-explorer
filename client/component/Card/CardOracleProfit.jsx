
import Component from '../../core/Component';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import React from 'react';
import config from '../../../config';

import Card from './Card';
import CountUp from '../CountUp';
import numeral from 'numeral'

export default class CardOracleProfit extends Component {
  static defaultProps = {
    oracleProfitPerSecond: 0,
    btc: 0.0,
    usd: 0.0,
    online: 0,
  };

  static propTypes = {
    oracleProfitPerSecond: PropTypes.number,
    btc: PropTypes.number.isRequired,
    usd: PropTypes.number.isRequired,
    online: PropTypes.number.isRequired,
  };

  render() {
    const profitPerDay = this.props.oracleProfitPerSecond * 60 * 60 * 24 / this.props.online;
    const profitPerDayBtc = profitPerDay * this.props.btc;
    const profitPerDayUsd = profitPerDay * this.props.usd;

    const profitPerWeek = profitPerDay * 7;
    const profitPerWeekBtc = profitPerWeek * this.props.btc;
    const profitPerWeekUsd = profitPerWeek * this.props.usd;

    const profitPerMonth = (profitPerDay * 365.25) / 12;
    const profitPerMonthBtc = profitPerMonth * this.props.btc;
    const profitPerMonthyUsd = profitPerMonth * this.props.usd;

    const profitPerYear = (profitPerDay * 365.25);
    const profitPerYearyBtc = profitPerYear * this.props.btc;
    const profitPerYearUsd = profitPerYear * this.props.usd;

    return (
      <div className="animated fadeInUp">
      <Card title="Estimated Oracle Earnings(COIN/BTC/USD)" className="card--status" >
        <div className="card__row">
          <span className="card__label-small">DAILY</span>
          <span className="card__result">{numeral(profitPerDay).format('0,0.00')} WGR / {numeral(profitPerDayBtc).format('0,0.0000')} BTC / {numeral(profitPerDayUsd).format('0,0.00')} USD </span>
        </div>
        <div className="card__row">
          <span className="card__label-small">WEEKLY</span>
          <span className="card__result">{numeral(profitPerWeek).format('0,0.00')} WGR / {numeral(profitPerWeekBtc).format('0,0.0000')} BTC / {numeral(profitPerWeekUsd).format('0,0.00')} USD </span>
        </div>
        <div className="card__row">
          <span className="card__label-small">MONTYLY</span>
          <span className="card__result">{numeral(profitPerMonth).format('0,0.00')} WGR / {numeral(profitPerMonthBtc).format('0,0.0000')} BTC / {numeral(profitPerMonthyUsd).format('0,0.00')} USD </span>
        </div>
        <div className="card__row">
          <span className="card__label-small">YEARLY</span>
          <span className="card__result">{numeral(profitPerYear).format('0,0.00')} WGR / {numeral(profitPerYearyBtc).format('0,0.0000')} BTC / {numeral(profitPerYearUsd).format('0,0.00')} USD </span>
        </div>
        <div className="card__row">
          <span  style={{color:"rgba(0, 0, 0,.5)"}} className="card__label">* Estimates based on current block subsidy and active masternodes</span>
        </div>
      </Card>
      </div>
    );
  };
}
