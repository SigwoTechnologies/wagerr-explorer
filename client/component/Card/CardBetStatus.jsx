
import Component from '../../core/Component';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import React from 'react';
import config from '../../../config';

import Card from './Card';
import CountUp from '../CountUp';
import numeral from 'numeral'

export default class CardBetStatus extends Component {
  static defaultProps = {
    totalBet: 0,
    totalMint: 0.0
  };

  static propTypes = {
    totalBet: PropTypes.number.isRequired,
    totalMint: PropTypes.number.isRequired
  };

  render() {

    return (
      <div className="animated fadeInUp">
      <Card title="Bet Status" className="card--status" >
        <div className="card__row">
          <span className="card__label-small">TOTAL BET:</span>
          <span>{numeral(this.props.totalBet).format('0,0.00000000')} WGR</span>
        </div>
        <div className="card__row">
          <span className="card__label-small">TOTAL MINT:</span>
          <span>{numeral(this.props.totalMint).format('0,0.00000000')} WGR</span>
        </div>
        <div className="card__row">
          <span className="card__label-small">NET SUPPLY CHANGE:</span>
          <span>{numeral(this.props.totalMint - this.props.totalBet).format('0,0.00000000')} WGR</span>
        </div>
      </Card>
      </div>
    );
  };
}
