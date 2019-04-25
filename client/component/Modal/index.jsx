
import Component from 'core/Component';
import PropTypes from 'prop-types';
import React from 'react';

import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
// import axios from 'axios';

export default class BetModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      modal: false
    };
  }

  static propTypes = {
    buttonLabel: PropTypes.string,
    className: PropTypes.string,
  };

  componentDidMount() {
    const { address } = this.props.tx;
    console.log(address);
    // axios.get(`/api/bet/actions`)
    //   .then((req, res) => {
    //     console.log(res);
    //   })
    //   .catch((error) => {
    //     console.log(error);
    // });
  };

  componentWillUnmount() {
  };

  toggle = () => {
    this.setState(prevState => ({
      modal: !prevState.modal
    }));
  }

  render() {
    const { buttonLabel, className, tx } = this.props;

    console.log('tx', tx);

    if (!buttonLabel || !className) {
      return false;
    }

    return (
      <React.Fragment>
          <span className="link-btn" onClick={this.toggle}>{buttonLabel}</span>
          <Modal isOpen={this.state.modal} toggle={this.toggle} className={className}>
            <ModalHeader toggle={this.toggle}>Transaction Report</ModalHeader>
            <ModalBody>
              <h5>TX Details</h5>
              <p><b>id:</b> {tx._id}</p>
              <p><b>Address:</b> {tx.address}</p>
              <p><b>N:</b> {tx.address}</p>
              <p><b>Value:</b> {tx.value}</p>
            </ModalBody>
            <ModalFooter>
              <Button color="secondary" onClick={this.toggle}>Close</Button>
            </ModalFooter>
          </Modal>
        </React.Fragment>
    );
  };
}
