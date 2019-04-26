
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
    const decryption = await Actions.getOpCode(this.props.tx.address);
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

  renderDecryption = () => (
    <div>
      <h3>Event</h3>
      <hr />
      <div><b>Type: </b><span>{this.state.decryption.sport} - {this.state.decryption.tournament}</span></div>
      <div><b>Game: </b><span>{this.state.decryption.homeTeam} vs {this.state.decryption.awayTeam}</span></div>
      {this.state.decryption.eventId ? (
        <div><b>Event ID: </b><Link to={`/bet/event/${this.state.decryption.eventId}`}>{this.state.decryption.eventId}</Link></div>
      ) : null}
      <br />
      <br />
      <h3>Odds</h3>
      <hr />
      <div><b>Home: </b><span>{this.state.decryption.homeOdds / 10000}</span></div>
      <div><b>Away: </b><span>{this.state.decryption.awayOdds / 10000}</span></div>
      <div><b>Draw: </b><span>{this.state.decryption.drawOdds / 10000}</span></div>
    </div>
  );

  render() {
    const { buttonLabel, className, tx } = this.props;
    if (!buttonLabel || !className) {
      return false;
    }

    return (
      <React.Fragment>
          <span className="link-btn" onClick={this.toggle}>{buttonLabel}</span>
          <Modal isOpen={this.state.modal} toggle={this.toggle} className={className}>
            <ModalHeader toggle={this.toggle}>{this.state.decryption ? this.state.decryption.homeTeam : 'Home Team'} vs {this.state.decryption ? this.state.decryption.awayTeam : 'Away Team'}</ModalHeader>
            <ModalBody>
              {this.state.decryption ? this.renderDecryption() : null}
            </ModalBody>
            <ModalFooter>
              <Button color="secondary" onClick={this.toggle}>Close</Button>
            </ModalFooter>
          </Modal>
        </React.Fragment>
    );
  };
}
