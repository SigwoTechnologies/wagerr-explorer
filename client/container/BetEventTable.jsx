import React, { Component } from 'react';
import sortBy from 'lodash/sortBy';
import numeral from 'numeral';
import { date24Format } from '../../lib/date';
import Table from '../component/Table';
import { Link } from 'react-router-dom';

// actions
import PropTypes from 'prop-types';
import Actions, { getBetEventInfo, getBetTotals } from '../core/Actions';
import { compose } from 'redux';
import { translate } from 'react-i18next';
import { connect } from 'react-redux';

class BetEventTable extends Component {
  static propTypes = {
    match: PropTypes.object.isRequired,
    getBetEventInfo: PropTypes.func.isRequired,
    getBetActions: PropTypes.func.isRequired,
    getBetTotals: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);

    this.state = {
      eventId: '',
      eventInfo: [],
      betActions: [],
      loading: true,
      error: null,
    }
  };

  componentDidMount() {
    this.setState({
      eventId: this.props.match.params.eventId,
    });
    this.getBetData();
    // this.getTheTotals();
  };

  componentDidUpdate(prevProps) {
    const { params: { eventId } } = this.props.match
    if (prevProps.match.params.eventId !== eventId) {
      this.setState({
        eventId: this.props.match.params.eventId,
      });
      this.getBetData();
      // this.getTheTotals();
    }
  };

  // getTheTotals = () => {
  //   this.setState({ loading: true }, () => {
  //     Promise.all([
  //       this.props.getBetTotals(this.state.eventId),
  //     ]).then((res) => {
  //       console.log('###############');
  //       console.log(res[0].results[0]);
  //       console.log('###############');
  //       this.setState({
  //         points: res[0].results[0].points,
  //         overOdds: res[0].results[0].overOdds,
  //         underOdds: res[0].results[0].underOdds,
  //         loading: false,
  //       });
  //     }).catch((err) => {
  //       console.log(err);
  //     })
  //   })
  // }

  getBetData = () => {
    this.setState({loading: true}, () => {
      Promise.all([
        this.props.getBetEventInfo(this.state.eventId),
        this.props.getBetActions(this.state.eventId),
      ]).then((res) => {
        sortBy(res[0].events,['blockHeight']).forEach(event =>{
          res[1].actions.filter(action => { return event.blockHeight < action.blockHeight}).forEach(
            action =>{
              if (action.betChoose.includes('Home')) {
                action.odds = action.homeOdds / 10000
              }else if (action.betChoose.includes('Away')) {
                action.odds = action.awayOdds / 10000
              } else{
                action.odds = action.drawOdds / 10000
              }
            })
        this.setState({
          eventInfo: res[0], // 7 days at 5 min = 2016 coins
          betActions: res[1].actions,
          loading: false,
        })
      })

    })
    .catch((err) => console.log(err))
  })}

  render() {
    // if (!!this.state.error) {
    //   return this.renderError(this.state.error)
    // } else if (this.state.loading) {
    //   return this.renderLoading()
    // }
    const { t } = this.props.data;

    const topOneCols = [
      {key: 'createdAt', title: t('time')},
      {key: 'homeOdds', title: t('homeOdds')},
      {key: 'drawOdds', title: t('drawOdds')},
      {key: 'awayOdds', title: t('awayOdds')},
      {key: 'txId', title: t('txId')},
    ]

    // const topTwoCols = [
    //   {key: 'createdAt', title: t('time')},
    //   {key: 'homeOdds', title: t('homeOdds')},
    //   {key: 'drawOdds', title: t('spread')},
    //   {key: 'awayOdds', title: t('awayOdds')},
    //   {key: 'txId', title: t('txId')},
    // ]

    const topThreeCols = [
      {key: 'createdAt', title: t('time')},
      {key: 'points', title: t('points')},
      {key: 'overOdds', title: t('home odds')},
      {key: 'underOdds', title: t('away odds')},
      {key: 'txId', title: t('txId')},
    ]

    const bottomOneCols = [
      {key: 'createdAt', title: t('time')},
      {key: 'bet', title: t('bet')},
      {key: 'odds', title: t('odds')},
      {key: 'value', title: t('value')},
      {key: 'txId', title: t('txId')},
    ]

    const bottomTwoCols = [
      {key: 'createdAt', title: t('time')},
      {key: 'homeOdds', title: t('homeOdds')},
      {key: 'awayOdds', title: t('awayOdds')},
      {key: 'spread', title: t('spread')},
      {key: 'txId', title: t('txId')},
    ]

    // const bottomThreeCols = [
    //   {key: 'createdAt', title: t('time')},
    //   {key: 'bet', title: t('bet')},
    //   {key: 'o/u', title: t('o/u')},
    //   {key: 'odds', title: t('odds')},
    //   {key: 'value', title: t('value')},
    //   {key: 'txId', title: t('txId')},
    // ]

    return (
      <div className="col-sm-12 col-md-12">
      {
        this.props.data.activeTab == 1 &&
        <div>
          <Table
            cols={topOneCols}
            data={sortBy(this.props.data.eventInfo.events.map((event) => {
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
          <Table
            cols={bottomOneCols}
            data={sortBy(this.props.data.betActions.map((action) => {
              return {
                ...action,
                createdAt: date24Format(action.createdAt),
                bet: action.betChoose.replace('Money Line - ', ''),
                odds: action.odds,
                value: action.betValue
                  ? (<span
                    className="badge badge-danger">-{numeral(action.betValue).format('0,0.0000')} WGR</span>) : '',
                txId: (
                  <Link to={`/tx/${ action.txId }`}>{action.txId}</Link>
                )
              }
            }), ['createdAt'])}
          />
      </div>
      }
      {
        this.props.data.activeTab == 2 &&
        <div>
            {/* <Table
              cols={topTwoCols}
              data={sortBy(this.props.data.eventInfo.events.map((event) => {
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
            /> */}
            <Table
              cols={bottomTwoCols}
              data={sortBy(this.props.data.betSpreads.map((action) => {
                return {
                  ...action,
                  createdAt: date24Format(action.createdAt),
                  homeOdds: action.homeOdds / 10000,
                  awayOdds: action.awayOdds / 10000,
                  spread: action.homePoints,
                  // odds: action.odds,
                  // value: action.betValue
                  //   ? (<span
                  //     className="badge badge-danger">-{numeral(action.betValue).format('0,0.0000')} WGR</span>) : '',
                  txId: (
                    <Link to={`/tx/${ action.txId }`}>{action.txId}</Link>
                  )
                }
              }), ['createdAt'])}
            />
        </div>
      }
      {
        this.props.data.activeTab == 3 &&
        <div>
          <Table
            cols={topThreeCols}
            data={sortBy(this.props.data.betTotals.map((action) => {
              return {
                ...action,
                createdAt: date24Format(action.createdAt),
                points: action.points,
                overOdds: action.overOdds / 10000,
                underOdds: action.underOdds / 10000,
                txId: (
                  <Link to={`/tx/${ action.txId }`}>{action.txId}</Link>
                )
              }
            }), ['createdAt'])}
          />
          {/* <Table
            cols={bottomThreeCols}
            data={sortBy(this.props.data.betActions.map((action) => {
              return {
                ...action,
                createdAt: date24Format(action.createdAt),
                bet: '',
                odds: action.odds,
                value: action.betValue
                  ? (<span
                    className="badge badge-danger">-{numeral(action.betValue).format('0,0.0000')} WGR</span>) : '',
                txId: (
                  <Link to={`/tx/${ action.txId }`}>{action.txId}</Link>
                )
              }
            }), ['createdAt'])}
          /> */}
      </div>
      }
      </div>
    );
  }
}

const mapDispatch = dispatch => ({
  getBetEventInfo: query => Actions.getBetEventInfo(query),
  getBetActions: query => Actions.getBetActions(query),
  getBetTotals: query => Actions.getBetTotals(query),
});

// export default BetEventTable;

export default compose(
  translate('betEvent'),
  connect(null, mapDispatch),
)(BetEventTable)