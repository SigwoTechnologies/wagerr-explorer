import Actions from '../core/Actions'
import Component from '../core/Component'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import moment from 'moment'
import PropTypes from 'prop-types'
import React from 'react'
import sortBy from 'lodash/sortBy'

import HorizontalRule from '../component/HorizontalRule'
import Pagination from '../component/Pagination'
import Table from '../component/SuperTable'
import Select from '../component/Select'

import Icon from '../component/Icon';

import _ from 'lodash'

import { PAGINATION_PAGE_SIZE, FILTER_EVENTS_OPTIONS } from '../constants'
import { timeStamp24Format } from '../../lib/date'
import numeral from 'numeral'
import { compose } from 'redux'
import { translate } from 'react-i18next'

class BetEventList extends Component {
  static defaultProps = {
    placeholder: 'Find team names, event ids, sports or tournaments.',
  }

  static propTypes = {
    getBetEventsInfo: PropTypes.func.isRequired,
    getBetQuery: PropTypes.func.isRequired,
    placeholder: PropTypes.string.isRequired,
  }

  constructor(props) {
    super(props)
    const { t } = props;

    this.debounce = null
    this.state = {
      error: null,
      loading: true,
      events: [],
      pages: 0,
      page: 1,
      size: 50,
      filterBy: 'All',
      search: '',
    }
  };

  componentDidMount() {
    this.getBetEventsInfo()
  };

  componentWillUnmount() {
    if (this.debounce) {
      clearTimeout(this.debounce)
      this.debounce = null
    }
  };

  getBetEventsInfo = () => {
    this.setState({ loading: true }, () => {
      if (this.debounce) {
        clearTimeout(this.debounce)
      }

      const searchValue = this.state.search;

      let getMethod = this.props.getBetEventsInfo;

      const params = {
        limit: this.state.size,
        skip: (this.state.page - 1) * this.state.size
      };

      if (this.state.filterBy !== 'All') {
        getMethod = this.props.getBetQuery;
        params.sport = this.state.filterBy;
      }


      if (this.state.search) {
        getMethod = this.props.getBetQuery;
        params.search = this.state.search;
      }

      this.debounce = setTimeout(() => {
        getMethod(params)
          .then(({ data, pages }) => {
            if (this.debounce) {
              data.map(item => {
                let totalBet = 0;
                let totalMint = 0;
                item.actions.forEach(action => totalBet += action.betValue)
                if (item.results) {
                  item.results.forEach(result => {
                    let startIndex = 2
                    if (
                      result.payoutTx.vout[1] &&
                      result.payoutTx.vout[2] &&
                      result.payoutTx.vout[1].address === result.payoutTx.vout[2].address
                    ) {
                      startIndex = 3
                    }
                    for (let i = startIndex; i < result.payoutTx.vout.length - 1; i++) {
                      totalMint += result.payoutTx.vout[i].value
                    }
                  })
                }
                item.totalBet = totalBet
                item.totalMint = totalMint
              })
              this.setState({ events: data, pages, loading: false })
            }
          })
          .catch(error => this.setState({ error, loading: false }))
      }, 800)
    })
  }

  handleKeyPress = (ev) => {
    if (ev.key === 'Enter') {
      ev.preventDefault();

      this.getBetEventsInfo();
    }
  };

  handleChange = (e) => {
    this.setState({
      search: e.target.value,
    });
  }

  handleFilterBy = value => this.setState({filterBy: value}, () => {
    this.setState({
      search: '',
    }, () => {
      this.getBetEventsInfo()
    });
  });

  handlePage = page => this.setState({ page }, this.getBetEventsInfo)
  
  handleSize = size => this.setState({size, page: 1})


  TestMyFilter = (data, type) => {
    let results = [];
    if (type === 'All') {
      results = data;
    } else {
      results = data.filter((event) => {
        return event.events[0].transaction.sport === type
      });
    }
    return results;
  }

  render () {
    const { props } = this;

    const { t } = props;
    const cols = [
      { key: 'start', title: t('startingnow') },
      { key: 'event', title: t('eventId') },
      { key: 'name', title: t('name') },
      // {key: 'round', title: t('round')},
      { key: 'homeTeam', title: t('homeTeam') },
      { key: 'awayTeam', title: t('awayTeam') },
      { key: 'homeOdds', title: '1' },
      { key: 'drawOdds', title: 'x' },
      { key: 'awayOdds', title: '2' },
      { key: 'supplyChange', title: t('supplyChange') },
      { key: 'betAmount', title: t('betAmount') },
      { key: 'betStatus', title: t('betStatus') },
      { key: 'seeDetail', title: t('detail') },
    ]
    if (!!this.state.error) {
      return this.renderError(this.state.error)
    } else if (this.state.loading) {
      return this.renderLoading()
    }
    const selectOptions = PAGINATION_PAGE_SIZE
    const selectFilterOptions = FILTER_EVENTS_OPTIONS

    const select = (
      <Select
        onChange={value => this.handleSize(value)}
        selectedValue={this.state.size}
        options={selectOptions} />
    )

    const filterSport = (
      <Select
        onChange={value => this.handleFilterBy(value)}
        selectedValue={this.state.filterBy}
        options={selectFilterOptions} />
    );

    const searchBar = (
      <div className="animated fadeIn" style={{ width: '100%' }}>
        <div className={ `search ${ props.className ? props.className : '' }` }>
          <input
            className="search__input"
            onKeyPress={ e => this.handleKeyPress(e) }
            onChange={ e => this.handleChange(e) }
            placeholder={ props.placeholder }
            value={this.state.search}
          />
          <Icon name="search" className="search__icon" />
        </div>
      </div>
    );

    return (
      <div>
        {searchBar}
        <HorizontalRule
          select={select}
          filterSport={filterSport}
          title={t('title')}/>
        <Table
          className={'table-responsive table--for-betevents'}
          cols={cols}
          data={this.state.events.map((event) => {
            const betAmount = event.actions.reduce((acc, action) => {
              return acc + action.betValue
            }, 0.0
            )
            let betStatus = t('open')
            const eventTime = parseInt(event.events[0].timeStamp);
            const eventData = event.events[0];

            if ((eventTime - (20 * 60 * 1000)) < Date.now()) {
              betStatus = t('waitForStart')
              if (eventTime < Date.now()) {
                betStatus = t('started')
                if (event.results.length === 0) {
                  betStatus = <span className={`badge badge-warning`}>{t('waitingForOracle')}</span>
                }
                if (event.results.length > 0) {
                  for (const result of event.results) {
                    const awayVsHome = result.transaction ? (result.transaction.awayScore - result.transaction.homeScore) : 0;
                    let outcome;
                    if (awayVsHome > 0) {
                      // outcome = 'Away Win';
                      outcome = eventData.awayTeam;
                    }

                    if (awayVsHome < 0) {
                      // outcome = 'Home Win';
                      outcome = eventData.homeTeam;
                    }

                    if (awayVsHome === 0) {
                      outcome = 'Draw';
                    }

                    if (result.result && result.result.includes('Refund')) {
                      outcome = 'Refund';
                    }

                    if (outcome) {
                      betStatus = <span className={`badge badge-info`}>{outcome}</span>
                    }
                  }
                }
                if (event.results.length > 1) {
                  for (const result of event.results) {
                    if (result.result.indexOf('REFUND') !== -1) {
                      betStatus = <span className={`badge badge-info`}>REFUND</span>
                    }
                  }
                }
              }
            }
            let homeOdds = (event.events[event.events.length - 1].homeOdds / 10000)
            let drawOdds = (event.events[event.events.length - 1].drawOdds / 10000)
            let awayOdds = (event.events[event.events.length - 1].awayOdds / 10000)
            if (event.events.length > 1) {
              const lastHomeOdds = (event.events[event.events.length - 2].homeOdds / 10000)
              const lastDrawOdds = (event.events[event.events.length - 2].drawOdds / 10000)
              const lastAwayOdds = (event.events[event.events.length - 2].awayOdds / 10000)
              if (homeOdds > lastHomeOdds) {
                homeOdds = homeOdds + ' ↑'
              } else if (homeOdds < lastHomeOdds) {
                homeOdds = homeOdds + ' ↓'
              }
              if (drawOdds > lastDrawOdds) {
                drawOdds = drawOdds + ' ↑'
              } else if (drawOdds < lastDrawOdds) {
                drawOdds = drawOdds + ' ↓'
              }
              if (awayOdds > lastAwayOdds) {
                awayOdds = awayOdds + ' ↑'
              } else if (awayOdds < lastAwayOdds) {
                awayOdds = awayOdds + ' ↓'
              }
            }
            return {
              ...event,
              start: <Link to={`/bet/event/${encodeURIComponent(event.events[0].eventId)}`}>
                {timeStamp24Format(event.events[0].timeStamp)} </Link>
              ,
              event: (
                <Link to={`/bet/event/${encodeURIComponent(event.events[0].eventId)}`}>
                  {event.events[0].eventId}
                </Link>
              ),
              name: <Link to={`/bet/event/${encodeURIComponent(event.events[0].eventId)}`}>
                {event.events[0].league}</Link>,
              round: <Link to={`/bet/event/${encodeURIComponent(event.events[0].eventId)}`}>
              </Link>,
              homeTeam: <Link to={`/bet/event/${encodeURIComponent(event.events[0].eventId)}`}>{event.events[0].homeTeam}</Link>,
              awayTeam: <Link to={`/bet/event/${encodeURIComponent(event.events[0].eventId)}`}>{event.events[0].awayTeam}</Link>,
              homeOdds: homeOdds,
              drawOdds: drawOdds,
              awayOdds: awayOdds,
              supplyChange: <span className={`badge badge-${event.totalMint - event.totalBet < 0 ? 'danger' : 'success'}`}>
                {numeral(event.totalMint - event.totalBet).format('0,0.00')}
              </span>,
              betAmount: <span className={`badge badge-danger`}>{numeral(betAmount).format('0,0.00')}</span>,
              betStatus: betStatus,
              seeDetail: <Link to={`/bet/event/${encodeURIComponent(event.events[0].eventId)}`}>{t('seeDetail')}</Link>
            }
          })} />
        <Pagination
          current={this.state.page}
          className="float-right"
          onPage={this.handlePage}
          total={this.state.pages} />
        <div className="clearfix" />
      </div>
    )
  };
}

const mapDispatch = dispatch => ({
  getBetEventsInfo: query => Actions.getBetEventsInfo(query),
  getBetQuery: query => Actions.getBetQuery(query),
})

export default compose(
  connect(null, mapDispatch),
  translate('betEventList'),
)(BetEventList);
