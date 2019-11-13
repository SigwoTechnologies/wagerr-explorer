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
    getBetspreads: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);

    this.state = {
      eventId: '',
      eventInfo: [],
      betActions: [],
      loading: true,
      error: null,
      MoneyLine: [],
      Totals: [],
      Spreads: [],
    }
  };

  componentDidMount() {
    this.setState({
      eventId: this.props.match.params.eventId,
    });
    this.getBetData();
    this.sortBetData();
  };

  componentDidUpdate(prevProps) {
    const { params: { eventId } } = this.props.match
    if (prevProps.match.params.eventId !== eventId) {
      this.setState({
        eventId: this.props.match.params.eventId,
      });
      this.getBetData();
      this.sortBetData();
    }
  };

  sortBetData = () => {
    // Money Line Data
    const MoneyLineBetData = this.props.data.betActions;
    let MoneyLine = [];
    let Totals = [];
    let Spreads = [];
    MoneyLineBetData.forEach((action) => {
      if (action.betChoose.includes('Money Line')) {
        MoneyLine.push(action);
      } else if (action.betChoose.includes('Totals')) {
        Totals.push(action);
      } else if (action.betChoose.includes('Spreads')) {
        Spreads.push(action);
      };
      this.setState({
        MoneyLine,
        Totals,
        Spreads,
      });
    });
  };

  getBetData = () => {
    this.setState({loading: true}, () => {
      Promise.all([
        this.props.getBetEventInfo(this.state.eventId),
        this.props.getBetActions(this.state.eventId),
        this.props.getBetTotals(this.state.eventId),
        this.props.getBetspreads(this.state.eventId),
      ]).then((res) => {
        sortBy(res[0].events,['blockHeight']).forEach(event =>{
          res[1].actions.filter(action => { return event.blockHeight < action.blockHeight}).forEach(
            action => {
              if (action.betChoose.includes('Home')) {
                action.odds = action.homeOdds / 10000
              } else if (action.betChoose.includes('Away')) {
                action.odds = action.awayOdds / 10000
              } else {
                action.odds = action.drawOdds / 10000
              }
            });
          this.setState({
            eventInfo: res[0], // 7 days at 5 min = 2016 coins
            betActions: res[1].actions,
            betTotals: res[2].results,
            betSpreads: res[3].results,
            opObject: res[2].results.opObject,
            loading: false,
          });
        });
    })
    .catch((err) => console.log('BetEventTable.jsx', err))
  })};


  render() {
    const { t } = this.props.data;

    const topOneCols = [
      {key: 'createdAt', title: t('time')},
      {key: 'homeOdds', title: t('homeOdds')},
      {key: 'drawOdds', title: t('drawOdds')},
      {key: 'awayOdds', title: t('awayOdds')},
      {key: 'txId', title: t('txId')},
    ]

    const topTwoCols = [
      {key: 'createdAt', title: t('time')},
      {key: 'homeOdds', title: t('homeOdds')},
      {key: 'spread', title: 'spread'},
      {key: 'awayOdds', title: t('awayOdds')},
      {key: 'txId', title: t('txId')},
    ]

    const topThreeCols = [
      {key: 'createdAt', title: t('time')},
      {key: 'overOdds', title: 'over odds'},
      {key: 'overUnder', title: 'o/u'},
      {key: 'underOdds', title: 'under odds'},
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
      {key: 'bet', title: t('bet')},
      {key: 'spread', title: 'spread'},
      {key: 'odds', title: t('odds')},
      {key: 'value', title: t('value')},
      {key: 'txId', title: t('txId')},
    ]

    const bottomThreeCols = [
      {key: 'createdAt', title: t('time')},
      {key: 'bet', title: t('bet')},
      {key: 'overUnder', title: 'o/u'},
      {key: 'odds', title: t('odds')},
      {key: 'value', title: t('value')},
      {key: 'txId', title: t('txId')},
    ]

    // console.log('AAAAAAAA', this.props.data.eventInfo.events)
    // console.log('BBBBBBB', this.state.MoneyLine)
    // console.log('CCCCCCCC', this.props.data.betSpreads)
    // console.log('DDDDDDDDDD', this.state.Spreads)
    // console.log('EEEEEEEE', this.props.data.betTotals)
    // console.log('FFFFFFFF', this.state.Totals)

    const displayNum = (num, divider) => {
      const value = num > 0 ? `+${num / divider}` : `${num / divider}`;
      
      return value;
    };

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
            data={sortBy(this.state.MoneyLine.map((action) => {
              return {
                ...action,
                createdAt: date24Format(action.createdAt),
                bet: action.betChoose.replace('Money Line - ', ''),
                odds: action.odds,
                value: action.betValue
                  ? (<span
                    className="badge badge-danger">-{numeral(action.betValue).format('0,0.00000000')} WGR</span>) : 'd',
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
            <Table
              cols={topTwoCols}
              data={sortBy(this.props.data.betSpreads.map((action) => {
                return {
                  ...action,
                  createdAt: date24Format(action.createdAt),
                  homeOdds: action.homeOdds / 10000,
                  spread: `${displayNum(action.homePoints, 10)}/${displayNum(action.awayPoints, 10)}`,
                  awayOdds: action.awayOdds / 10000,
                  txId: (
                    <Link to={`/tx/${ action.txId }`}>{action.txId}</Link>
                  )
                }
              }), ['createdAt'])}
            />
            <Table
              cols={bottomTwoCols}
              data={sortBy(this.state.Spreads.map((action) => {
                const betChoose = action.betChoose.replace('Spreads - ', '');
                const spreadNum = Math.abs(parseInt(action.spreadAwayPoints, 10)) / 10;

                return {
                  ...action,
                  createdAt: date24Format(action.createdAt),
                  bet: betChoose, // `${action.homeOdds / 10000}/${action.awayOdds / 10000}`,
                  spread: betChoose == 'Away' ? displayNum(action.spreadAwayPoints, 10) : displayNum(action.spreadHomePoints, 10),
                  odds: betChoose == 'Away' ? action.spreadAwayOdds / 10000 : action.spreadHomeOdds / 10000,
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
                overOdds: action.overOdds / 10000,
                overUnder: action.points / 10,
                underOdds: action.underOdds / 10000,
                txId: (
                  <Link to={`/tx/${ action.txId }`}>{action.txId}</Link>
                )
              }
            }), ['createdAt'])}
          />
          <Table
            cols={bottomThreeCols}
            data={sortBy(this.state.Totals.map((action) => {
              return {
                ...action,
                createdAt: date24Format(action.createdAt),
                bet: action.betChoose.replace('Money Line - ', ''),
                // overUnder: ((action.homeOdds / action.awayOdds + action.homeOdds) * 100).toFixed(1),
                overUnder: (action.points / 10).toFixed(1),
                odds: action.betChoose.includes('Over') ? action.overOdds / 10000 : action.underOdds / 10000,
                value: action.betValue
                  ? (<span className="badge badge-danger">-{numeral(action.betValue).format('0,0.00000000')} WGR</span>) : '',
                txId: (
                  <Link to={`/tx/${ action.txId }`}>{action.txId}</Link>
                )
              }
            }), ['createdAt'])}
          />
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
  getBetspreads: query => Actions.getBetspreads(query),
});

// export default BetEventTable;

export default compose(
  translate('betEvent'),
  connect(null, mapDispatch),
)(BetEventTable)
