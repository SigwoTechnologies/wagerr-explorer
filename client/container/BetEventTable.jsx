import React, { Component } from 'react';
import sortBy from 'lodash/sortBy';
import numeral from 'numeral';
import { date24Format } from '../../lib/date';
import Table from '../component/Table';
import { Link } from 'react-router-dom';

class BetEventTable extends Component {
  componentDidMount() {
    this.getBetEventTotals();
  }

  getBetEventTotals = () => {
    console.log('--------------');
    console.log('getBetEventTotals has been fired!');
    console.log('--------------');
  }

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
      {key: 'drawOdds', title: t('spread')},
      {key: 'awayOdds', title: t('awayOdds')},
      {key: 'txId', title: t('txId')},
    ]
    const topThreeCols = [
      {key: 'createdAt', title: t('time')},
      {key: 'homeOdds', title: t('over odds')},
      {key: 'drawOdds', title: t('o/u')},
      {key: 'awayOdds', title: t('under odds')},
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
      {key: 'sread', title: t('spread')},
      {key: 'odds', title: t('odds')},
      {key: 'value', title: t('value')},
      {key: 'txId', title: t('txId')},
    ]

    const bottomThreeCols = [
      {key: 'createdAt', title: t('time')},
      {key: 'bet', title: t('bet')},
      {key: 'o/u', title: t('o/u')},
      {key: 'odds', title: t('odds')},
      {key: 'value', title: t('value')},
      {key: 'txId', title: t('txId')},
    ]

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
            <Table
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
            />
            <Table
              cols={bottomTwoCols}
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
        this.props.data.activeTab == 3 &&
        <div>
          <Table
            cols={topThreeCols}
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
            cols={bottomThreeCols}
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
      </div>
    );
  }
}

export default BetEventTable;