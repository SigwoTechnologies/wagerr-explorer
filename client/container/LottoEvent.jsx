import Component from '../core/Component';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React from 'react';

import { TabContent, TabPane, Nav, NavItem, NavLink, Button, Row, Col } from 'reactstrap';

import HorizontalRule from '../component/HorizontalRule';
import Actions from '../core/Actions';
import sortBy from 'lodash/sortBy';
import CardLottoResult from '../component/Card/CardLottoResult';
import { compose } from 'redux';
import { translate } from 'react-i18next';
import CardLottoEvent from '../component/Card/CardLottoEvent';
import LottoEventTable from '../container/LottoEventTable';


class LottoEvent extends Component {
  static propTypes = {
    match: PropTypes.object.isRequired,
    getLottoEventInfo: PropTypes.func.isRequired,
  };

  constructor (props) {
    super(props)

    this.state = {
      eventId: '',
      eventInfo: [],
      betActions: [],
      betSpreads: [],
      betTotals: [],
      loading: true,
      error: null,
      activeTab: '1',
    };
    this.toggle = this.toggle.bind(this);
  };

  componentDidMount () {
    this.setState({
      eventId: this.props.match.params.eventId,
    });
    this.getBetData();
  };

  componentDidUpdate (prevProps) {
    const {params: {eventId}} = this.props.match
    if (prevProps.match.params.eventId !== eventId) {
      this.setState({
        eventId: this.props.match.params.eventId,
      });
      this.getBetData();
    };
  };

  getBetData = () => {
    this.setState({loading: true}, () => {
      Promise.all([
        this.props.getLottoEventInfo(this.state.eventId),
        this.props.getLottoBets(this.state.eventId),
      ]).then((res) => {
        console.log('This is the event data');
        console.log(res);
        sortBy(res[0].events,['blockHeight']).forEach(event => {
          res[1]
            .results
              .filter(action => {
                return event.blockHeight < action.blockHeight}).forEach(
            action =>{

            })
        this.setState({
          eventInfo: res[0], // 7 days at 5 min = 2016 coins
          betActions: res[1].results,
          loading: false,
        })
      })

    })
    .catch((err) => console.log(err))
  })}

  toggle(tab) {
    if (this.state.activeTab !== tab) {
      this.setState({
        activeTab: tab
      });
    }
  }

  render () {
    if (!!this.state.error) {
      return this.renderError(this.state.error)
    } else if (this.state.loading) {
      return this.renderLoading()
    }
    const { t } = this.props;

    const tableData = {
      t: t,
      eventInfo: this.state.eventInfo,
      activeTab: this.state.activeTab,
      betActions: this.state.betActions,
    };

    return (
      <div>
        <HorizontalRule title="Bet Event Info"/>
        <div className="betevents-tab">
          <TabContent activeTab={this.state.activeTab}>
            <TabPane tabId="1">
              <Row>
                <Col sm="12">
                  <div className="row">
                    <div className="col-sm-12 col-md-6">
                      <CardLottoEvent eventInfo={this.state.eventInfo} betActions={this.state.betActions}/>
                    </div>
                    <div className="col-sm-12 col-md-6">
                      <CardLottoResult eventInfo={this.state.eventInfo} data={tableData}  />
                    </div>
                  </div>
                </Col>
              </Row>
              <Row>
                <LottoEventTable match={this.props.match} data={tableData} />
              </Row>
            </TabPane>
          </TabContent>
        </div>
      </div>
    )
  };
}

const mapDispatch = dispatch => ({
  getLottoEventInfo: query => Actions.getLottoEventInfo(query),
  getLottoBets: query => Actions.getLottoBets(query),
})

export default compose(
  translate('LottoEvent'),
  connect(null, mapDispatch),
)(LottoEvent);
