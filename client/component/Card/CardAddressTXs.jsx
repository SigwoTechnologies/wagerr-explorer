
import Component from '../../core/Component';
import { date24Format } from '../../../lib/date';
import { Link } from 'react-router-dom';
import numeral from 'numeral';
import PropTypes from 'prop-types';
import React from 'react';

import Table from '../Table';

export default class CardAddressTXs extends Component {
  static defaultProps = {
    address: '',
    txs: []
  };

  static propTypes = {
    address: PropTypes.string.isRequired,
    txs: PropTypes.array.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      cols: [
        { key: 'txId', title: 'Transaction ID' },
        { key: 'amount', title: 'Amount' },
        { key: 'createdAt', title: 'Time' },
      ]
    };
  };

  render() {
    return (
      <div className="animated fadeIn">
      <Table
        cols={ this.state.cols }
        data={ this.props.txs.map((tx) => {
          let inAmount = 0.0;
          let outAmount = 0.0;
          tx.vin.forEach((vin) => {
            if (vin.address && vin.address === this.props.address) {
              inAmount += vin.value;
            }
          });
          tx.vout.forEach((vout) => {
            if (vout.address === this.props.address) {
              outAmount += vout.value;
            }
          });
          let isSpent = inAmount > outAmount
          let amount = outAmount - inAmount
          return ({
            ...tx,
            amount: (
              <span
                className={ `badge badge-${ isSpent ? 'danger' : 'success' }` }>
                { numeral(amount).format('0,0.00000000') } WGR
              </span>
            ),
            createdAt: date24Format(tx.createdAt),
            txId: (
              <Link to={ `/tx/${ tx.txId }` }>{ tx.txId }</Link>
            )
          });
        }) } />
        </div>
    );
  };
}
