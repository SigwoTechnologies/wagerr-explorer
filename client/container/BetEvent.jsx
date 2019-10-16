import Component from '../core/Component';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React from 'react';

import { TabContent, TabPane, Nav, NavItem, NavLink, Button, Row, Col } from 'reactstrap';
import classnames from 'classnames';

import CardEarnings from '../component/Card/CardEarnings';
import CardExchanges from '../component/Card/CardExchanges';
import CardLinks from '../component/Card/CardLinks';
import CardROI from '../component/Card/CardROI';
import HorizontalRule from '../component/HorizontalRule';
import Actions from '../core/Actions';
import numeral from 'numeral';
import { date24Format } from '../../lib/date';
import Table from '../component/Table';
import { Link } from 'react-router-dom';
import sortBy from 'lodash/sortBy';
import moment from 'moment/moment';
import config from '../../config';
import Card from '../component/Card';
import CardBetEvent from '../component/Card/CardBetEvent';
import CardBetResult from '../component/Card/CardBetResult';
import { compose } from 'redux';
import { translate } from 'react-i18next';
import CardMoneyLineEvent from '../component/Card/CardMoneyLineEvent';
import CardSpreadEvent from '../component/Card/CardSpreadEvent';
import CardOverUnderEvent from '../component/Card/CardOverUnderEvent';
import BetEventTable from '../container/BetEventTable';


class BetEvent extends Component {
  static propTypes = {
    match: PropTypes.object.isRequired,
    getBetEventInfo: PropTypes.func.isRequired,
    getBetActions: PropTypes.func.isRequired,
    getBetspreads: PropTypes.func.isRequired,
    getBetTotals: PropTypes.func.isRequired,
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
        this.props.getBetEventInfo(this.state.eventId),
        this.props.getBetActions(this.state.eventId),
        this.props.getBetspreads(this.state.eventId),
        this.props.getBetTotals(this.state.eventId),
      ]).then((res) => {
        sortBy(res[0].events,['blockHeight']).forEach(event => {
          res[1]
            .actions
              .filter(action => {
                return event.blockHeight < action.blockHeight}).forEach(
            action =>{
              if (action.betChoose.includes('Home')) {
                action.odds = action.homeOdds / 10000
              } else if (action.betChoose.includes('Away')) {
                action.odds = action.awayOdds / 10000
              } else {
                action.odds = action.drawOdds / 10000
              }
            })
        this.setState({
          eventInfo: res[0], // 7 days at 5 min = 2016 coins
          betActions: res[1].actions,
          betSpreads: res[2].results,
          betTotals: res[3].results,
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
    // const cols = [
    //   {key: 'createdAt', title: t('time')},
    //   {key: 'bet', title: t('bet')},
    //   {key: 'odds', title: t('odds')},
    //   {key: 'value', title: t('value')},
    //   {key: 'txId', title: t('txId')},
    // ]
    // const oddsCols = [
    //   {key: 'createdAt', title: t('time')},
    //   {key: 'homeOdds', title: t('homeOdds')},
    //   {key: 'drawOdds', title: t('drawOdds')},
    //   {key: 'awayOdds', title: t('awayOdds')},
    //   {key: 'txId', title: t('txId')},
    // ]
    const tableData = {
      t: t,
      eventInfo: this.state.eventInfo,
      activeTab: this.state.activeTab,
      betActions: this.state.betActions,
      betSpreads: this.state.betSpreads,
      betTotals: this.state.betTotals,
    };

    return (
      <div>
        <HorizontalRule title="Bet Event Info"/>
        <div className="betevents-tab">
          <Nav tabs>
            <NavItem>
              <NavLink
                className={classnames({ active: this.state.activeTab === '1' })}
                onClick={() => { this.toggle('1'); }}
              >
                Money Line
              </NavLink>
            </NavItem>
            <NavItem>
                <NavLink
                  className={classnames({ active: this.state.activeTab === '2' })}
                  onClick={() => { this.toggle('2'); }}
                >
                  Spread
                </NavLink>
              </NavItem>
            <NavItem>
              <NavLink
                className={classnames({ active: this.state.activeTab === '3' })}
                onClick={() => { this.toggle('3'); }}
              >
                Over/Under
              </NavLink>
            </NavItem>
          </Nav>
          <TabContent activeTab={this.state.activeTab}>
            <TabPane tabId="1">
              <Row>
                <Col sm="12">
                  <div className="row">
                    <div className="col-sm-12 col-md-6">
                      <CardMoneyLineEvent eventInfo={this.state.eventInfo}/>
                    </div>
                    <div className="col-sm-12 col-md-6">
                      <CardBetResult eventInfo={this.state.eventInfo} data={tableData} />
                    </div>
                  </div>
                </Col>
              </Row>
              <Row>
                <BetEventTable match={this.props.match} data={tableData} />
              </Row>
            </TabPane>
            <TabPane tabId="2">
              <Row>
                <Col sm="12">
                  <div className="row">
                    <div className="col-sm-12 col-md-6">
                      <CardSpreadEvent eventInfo={this.state.eventInfo}/>
                    </div>
                    <div className="col-sm-12 col-md-6">
                      <CardBetResult eventInfo={this.state.eventInfo} data={tableData}/>
                    </div>
                  </div>
                </Col>
              </Row>
              <Row>
                <BetEventTable match={this.props.match} data={tableData} />
              </Row>
            </TabPane>
            <TabPane tabId="3">
              <Row>
                <div className="col-sm-12 col-md-6">
                  <CardOverUnderEvent eventInfo={this.state.eventInfo} data={tableData}/>
                </div>
                <div className="col-sm-12 col-md-6">
                  <CardBetResult eventInfo={this.state.eventInfo} data={tableData}/>
                </div>
              </Row>
              <Row>
                <BetEventTable match={this.props.match} data={tableData} />
              </Row>
            </TabPane>
          </TabContent>
        </div>
        {/* <div className="row">
          <div className="col-sm-12 col-md-6">
            <CardBetEvent eventInfo={this.state.eventInfo}/>
          </div>
          <div className="col-sm-12 col-md-6">
            <CardBetResult eventInfo={this.state.eventInfo}/>
          </div>
        </div> */}
        {/* <div className="row">
          <div className="col-sm-12 col-md-12">
            <Table
              cols={oddsCols}
              data={sortBy(this.state.eventInfo.events.map((event) => {
                return {
                  ...event,
                  createdAt: date24Format(event.createdAt),
                  homeOdds: event.homeOdds / 10000,
                  drawOdds: event.drawOdds / 10000,
                  awayOdds: event.awayOdds / 10000,
                  txId: (
                    <Link to={`/tx/${ event.txId }`}>{event.txId}</Link>
                  )
                }
              }), ['createdAt'])}
            />
          </div>
        </div> */}
        {/* <div className="row">
          <div className="col-sm-12 col-md-12">
            <Table
              cols={cols}
              data={sortBy(this.state.betActions.map((action) => {
                return {
                  ...action,
                  createdAt: date24Format(action.createdAt),
                  bet: action.betChoose.replace('Money Line - ', ''),
                  odds: action.odds,
                  value: action.betValue
                    ? (<span
                      className="badge badge-danger">-{numeral(action.betValue).format('0,0.00000000')} WGR</span>) : '',
                  txId: (
                    <Link to={`/tx/${ action.txId }`}>{action.txId}</Link>
                  )
                }
              }), ['createdAt'])}
            />
          </div>
        </div> */}
      </div>
    )
  };
}

const mapDispatch = dispatch => ({
  getBetEventInfo: query => Actions.getBetEventInfo(query),
  getBetActions: query => Actions.getBetActions(query),
  getBetspreads: query => Actions.getBetspreads(query),
  getBetTotals: query => Actions.getBetTotals(query),
})

export default compose(
  translate('betEvent'),
  connect(null, mapDispatch),
)(BetEvent);
