
import Component from 'core/Component';
import PropTypes from 'prop-types';
import React from 'react';

import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

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
  };

  componentWillUnmount() {
  };

  toggle = () => {
    this.setState(prevState => ({
      modal: !prevState.modal
    }));
  }

  render() {
    const { buttonLabel, className } = this.props;

    if (!buttonLabel || !className) {
      return false;
    }

    return (
      <React.Fragment>
          <span className="link-btn" onClick={this.toggle}>{buttonLabel}</span>
          <Modal isOpen={this.state.modal} toggle={this.toggle} className={className}>
            <ModalHeader toggle={this.toggle}>Modal title</ModalHeader>
            <ModalBody>
              Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
            </ModalBody>
            <ModalFooter>
              <Button color="primary" onClick={this.toggle}>Do Something</Button>{' '}
              <Button color="secondary" onClick={this.toggle}>Cancel</Button>
            </ModalFooter>
          </Modal>
        </React.Fragment>
    );
  };
}
