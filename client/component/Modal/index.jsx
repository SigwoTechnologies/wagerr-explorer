
import Component from 'core/Component';
import PropTypes from 'prop-types';
import React from 'react';
import { Link } from 'react-router-dom';
import _ from 'lodash';

import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import Actions from '../../core/Actions';

export default class BetModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      modal: false,
      decryption: {},
    };
  }

  static propTypes = {
    buttonLabel: PropTypes.string,
    className: PropTypes.string,
  };

  componentDidMount() {
    this.axiosCall();
  };

  axiosCall = async () => {
    const decryption = await Actions.getOpCode(this.props.address);
    this.setState({
      decryption,
    });
  };

  componentWillUnmount() {
  };

  toggle = () => {
    this.setState(prevState => ({
      modal: !prevState.modal
    }));
  };

  renderDecryptionOne = (decryption) => (
    <div>
      <div className="text-center">
        <h3>
          <b>{decryption.homeTeam}</b>
          <span> vs </span>
          <b>{decryption.awayTeam}</b>
        </h3>
        {decryption.tournament}
        {' - '}
        {decryption.sport}
        {decryption.eventId ? (
          <span>
            {' - '}
            <span>Event </span>
            <Link to={`/bet/event/${decryption.eventId}`}>#{decryption.eventId}</Link>
          </span>
        ) : null}
      </div>
      <br />
      <br />
      <div className="row">
        <div className="col text-center">
          <h4><b>{decryption.homeTeam || 'Home'}</b></h4>
        </div>
        <div className="col text-center">
          <h4><b>Draw</b></h4>
        </div>
        <div className="col text-center">
          <h4><b>{decryption.awayTeam || 'Away'}</b></h4>
        </div>
      </div>
      <div className="divider my-3"></div>
      <div className="row">
        <div className="col text-center">
          <div className="badge badge-success">{decryption.homeOdds / 10000}</div>
        </div>
        <div className="col text-center">
          <div className="badge badge-danger">{(decryption.drawOdds / 10000) || 0}</div>
        </div>
        <div className="col text-center">
          <div className="badge badge-success">{decryption.awayOdds / 10000}</div>
        </div>
      </div>
    </div>
  );

  formatScores = (score) => (score / 10000)

  outcomeMapping = () => ({
    1: 'Money Line - Home Win',
    2: 'Money Line - Away Win',
    3: 'Money Line - Draw',
    4: 'Spreads - Home',
    5: 'Spreads - Away',
    6: 'Totals - Over',
    7: 'Totals - Under',
  });

  renderDecryptionTwo = (decryption) => (
    <div>
      <div className="text-center">
        {decryption.eventId ? (
          <span>
            <span>Event </span>
            <Link to={`/bet/event/${decryption.eventId}`}>#{decryption.eventId}</Link>
          </span>
        ) : null}
      </div>
      <br />
      <br />
      <div className="row">
        <div className="col text-center">
          <h4>Home</h4>
          <h4><b>{decryption.homeScore}</b></h4>
        </div>
        <div className="col text-center">
          <h4>Away</h4>
          <h4><b>{decryption.awayScore}</b></h4>
        </div>
      </div>
    </div>
  );

  peerlessUpdateOdds = (decryption) => (
    <div>
      <div className="row">
        <div className="col text-center">
          <h4><b>{decryption.homeTeam || 'Home'}</b></h4>
        </div>
        <div className="col text-center">
          <h4><b>Draw</b></h4>
        </div>
        <div className="col text-center">
          <h4><b>{decryption.awayTeam || 'Away'}</b></h4>
        </div>
      </div>
      <div className="divider my-3"></div>
      <div className="row">
        <div className="col text-center">
          <div className="badge badge-success">{this.formatScores(decryption.homeOdds)}</div>
        </div>
        <div className="col text-center">
          <div className="badge badge-danger">{this.formatScores(decryption.drawOdds)}</div>
        </div>
        <div className="col text-center">
          <div className="badge badge-success">{this.formatScores(decryption.awayOdds)}</div>
        </div>
      </div>
    </div>
  );

  peerlessBet = (decryption) => (
    <div>
      <div className="row text-center">
        <div className="col text-center">
          <div className="badge badge-danger">{this.outcomeMapping()[decryption.outcome]}</div>
        </div>
      </div>
    </div>
  );

  peerlessTotalsMarket = (decryption) => (
    <div>
      <div className="row">
        <div className="col text-center">
          <h4><b>Over</b></h4>
        </div>
        <div className="col text-center">
          <h4><b>Spread Points</b></h4>
        </div>
        <div className="col text-center">
          <h4><b>Under</b></h4>
        </div>
      </div> 
      <br />
      <div className="divider my-3"></div>
      <div className="row">
        <div className="col text-center">
          <div className="badge badge-success">{this.formatScores(decryption.homeOdds)}</div>
        </div>
        <div className="col text-center">
        <div className="badge badge-warning">{(decryption.spreadPoints) / 10}</div>
        </div>
        <div className="col text-center">
          <div className="badge badge-danger">{this.formatScores(decryption.awayOdds)}</div>
        </div>
      </div>
    </div>
  );

  renderBody = (data) => {
    if (data.txType === 'peerlessUpdateOdds') {
      return this.peerlessUpdateOdds(data);
    }

    if (data.txType === 'peerlessBet') {
      return this.peerlessBet(data);
    }

    if (data.txType === 'peerlessTotalsMarket') {
      return this.peerlessTotalsMarket(data);
    }

    const rawData = _.cloneDeep(data);
    delete rawData.prefix;
    delete rawData.txType;
    delete rawData.eventId;
    delete rawData.type;
    delete rawData.opCode;
    delete rawData.version;
    return (
      <div className="row">
        <div className="col text-center">
          {JSON.stringify(rawData)}
        </div>
      </div>
    );
  }

  renderTransaction = (decryption) => (
    <div>
      <div className="text-center">
        {decryption.eventId ? (
          <span>
            <span>Event </span>
            <Link to={`/bet/event/${decryption.eventId}`}>#{decryption.eventId}</Link>
          </span>
        ) : null}
      </div>
      <br />
      <br />
      {this.renderBody(decryption)}
    </div>
  )

  render() {
    const { buttonLabel, className, address } = this.props;
    const { modal, decryption } = this.state;
    const { homeTeam, awayTeam } = decryption;
    if (!address) {
      return false;
    }

    console.log(this.state);

    const getTransactionType = (tx) => {
      if (tx === 'peerlessUpdateOdds') return 'Event Update';

      if (tx === 'peerlessResult') return 'Event Result';

      if (tx === 'peerlessBet') return 'Bet';

      if (tx === 'peerlessEvent') return 'Event';

      if (tx === 'peerlessSpreadsMarket') return 'Market Spreads';

      if (tx === 'peerlessTotalsMarket') return 'Market Totals';

      if (tx === 'chainGamesLottoEvent') return 'Lotto Event';

      if (tx === 'chainGamesLottoBet') return 'Lotto Bet';

      if (tx === 'chainGamesLottoResult') return 'Lotto Result';

      return tx;
    };

    return (
      <React.Fragment>
        <span className="link-btn" onClick={this.toggle}>{buttonLabel}</span>
        <Modal isOpen={modal} toggle={this.toggle} className={className}>
          <ModalHeader toggle={this.toggle}>
            <div>
              {decryption.homeTeam
                ? (<div>Event: {homeTeam} vs {awayTeam}</div>)
                : (<div>{getTransactionType(decryption.txType)}</div>)}
            </div>
          </ModalHeader>
          <ModalBody>
            {decryption.homeTeam
              ? this.renderDecryptionOne(decryption)
              : this.renderTransaction(decryption)}
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onClick={this.toggle}>Close</Button>
          </ModalFooter>
        </Modal>
      </React.Fragment>
    );
  };
}
