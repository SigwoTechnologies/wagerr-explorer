
import Component from 'core/Component';
import PropTypes from 'prop-types';
import React from 'react';
import { Link } from 'react-router-dom';

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
          ONE
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

  render() {
    const { buttonLabel, className, address } = this.props;
    const { modal, decryption } = this.state;
    const { homeTeam, awayTeam } = decryption;
    if (!address) {
      return false;
    }

    return (
      <React.Fragment>
        <span className="link-btn" onClick={this.toggle}>{buttonLabel}</span>
        <Modal isOpen={modal} toggle={this.toggle} className={className}>
          <ModalHeader toggle={this.toggle}>
            <div>
              {decryption.homeTeam
                ? (<div>{homeTeam} vs {awayTeam}</div>)
                : (<div>Bet Results</div>)}
            </div>
          </ModalHeader>
          <ModalBody>
            {decryption.homeTeam
              ? this.renderDecryptionOne(decryption)
              : this.renderDecryptionTwo(decryption)}
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onClick={this.toggle}>Close</Button>
          </ModalFooter>
        </Modal>
      </React.Fragment>
    );
  };
}
