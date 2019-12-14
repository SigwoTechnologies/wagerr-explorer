import React, { Component } from 'react';
import sortBy from 'lodash/sortBy';
import numeral from 'numeral';
import { date24Format } from '../../lib/date';
import Table from '../component/Table';
import { Link } from 'react-router-dom';

// actions
import PropTypes from 'prop-types';
import Actions from '../core/Actions';
import { compose } from 'redux';
import { translate } from 'react-i18next';
import { connect } from 'react-redux';

class LottoEventTable extends Component {
  static propTypes = {
    match: PropTypes.object.isRequired,
    getLottoEventInfo: PropTypes.func.isRequired,
    getLottoBets: PropTypes.func.isRequired,
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
    const MoneyLineBetData = []// this.props.data.betActions;
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
      });
    });
  };

  getBetData = () => {
    this.setState({loading: true}, () => {
      Promise.all([
        this.props.getLottoEventInfo(this.state.eventId),
        this.props.getLottoBets(this.state.eventId),
      ]).then((res) => {
        sortBy(res[0].events,['blockHeight']).forEach(event =>{
          res[1].results.filter(action => { return event.blockHeight < action.blockHeight});

          this.setState({
            eventInfo: res[0], // 7 days at 5 min = 2016 coins
            betActions: res[1].results,
            // opObject: res[2].results.opObject,
            loading: false,
          });
        });
    })
    .catch((err) => console.log('LottoEventTable.jsx', err))
  })};


  render() {
    const { t } = this.props.data;

    const topOneCols = [
      {key: 'createdAt', title: t('time')},
      {key: 'homeOdds', title: t('betAmount')},
      {key: 'drawOdds', title: t('drawOdds')},
      {key: 'awayOdds', title: t('awayOdds')},
      {key: 'txId', title: t('txId')},
    ]

    const bottomOneCols = [
      {key: 'createdAt', title: t('time')},
      {key: 'value', title: t('Bet Amount')},
      {key: 'txId', title: t('txId')},
    ]


    return (
      <div className="col-sm-12 col-md-12 col-lg-12">
      {
        this.props.data.activeTab == 1 &&
        <div>
          <Table
            cols={bottomOneCols}
            data={sortBy(this.state.betActions.map((action) => {
              return {
                ...action,
                createdAt: date24Format(action.createdAt),
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
      </div>
    );
  }
}

const mapDispatch = dispatch => ({
  getLottoEventInfo: query => Actions.getLottoEventInfo(query),
  getLottoBets: query => Actions.getLottoBets(query),
});

// export default LottoEventTable;

export default compose(
  translate('lottoEvent'),
  connect(null, mapDispatch),
)(LottoEventTable)
