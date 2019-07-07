
import Component from '../../core/Component';
import numeral from 'numeral';
import PropTypes from 'prop-types';
import qrcode from 'qrcode';
import React from 'react';
import config from '../../../config';
import BetModal from '../Modal';

export default class CardAddress extends Component {
  static defaultProps = {
    address: '',
    balance: 0.0,
    received: 0.0,
    sent: 0.0,
    staked: 0.0,
    txs: []
  };

  static propTypes = {
    address: PropTypes.string.isRequired,
    balance: PropTypes.number.isRequired,
    received: PropTypes.number.isRequired,
    txs: PropTypes.array.isRequired,
  };

  componentDidMount() {
    if (!!this.props.address) {
      this.drawQRCode();
    }
  };

  componentDidUpdate(prevProps) {
    if (!!this.props.address
      && this.props.address !== prevProps.address) {
      this.drawQRCode();
    }
  };

  drawQRCode = () => {
    const el = document.getElementById('qr-code');
    qrcode.toCanvas(el, this.props.address, { width: 220 }, (err) => {
      if (err) {
        console.log(err);
      }
    });
  };

  render() {
    return (
      <div className="animated fadeIn">
        <div className="row">
          <div className="col-md-12 col-lg-8">
            <div className="card--address">
              <div className="card__row">
                <span className="card__label card--address-wallet">
                  {this.props.address === config.coin.oracle_payout_address ? 'Oracle Wallet Address:' : 'Wallet Address:'}
                </span>
                <span className="card__result card--address-hash">
                  { this.props.address }
                  {/* <BetModal buttonLabel={this.props.address} className="test" /> */}
                </span>
              </div>
              <div className="card__row">
                <span className="card__label">
                  Sent:
                </span>
                <span className="card__result">
                  -{ numeral(this.props.sent).format('0,0.000000000000') } WGR
                </span>
              </div>
              <div className="card__row">
                <span className="card__label">
                  Staked:
                </span>
                <span className="card__result">
                  { numeral(this.props.staked).format('0,0.00000000') } WGR
                </span>
              </div>
              <div className="card__row">
                <span className="card__label">
                  Received:
                </span>
                <span className="card__result">
                  +{ numeral(this.props.received).format('0,0.00000000') } WGR
                </span>
              </div>
              <div className="card__row">
                <span className="card__label">
                  Balance:
                </span>
                <span className="card__result">
                  { numeral(this.props.balance).format('0,0.00000000') } WGR
                </span>
              </div>
            </div>
          </div>
          <div className="col-md-12 col-lg-4 text-right">
            <canvas id="qr-code" />
          </div>
        </div>
      </div>
    );
  };
}
