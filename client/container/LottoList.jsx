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
import _ from 'lodash'

import { PAGINATION_PAGE_SIZE } from '../constants'
import { timeStamp24Format } from '../../lib/date'
import numeral from 'numeral'
import { compose } from 'redux'
import { translate } from 'react-i18next'

const getClosestValue = (approxValue, vout, full) => {
  let currentDifference;
  let record = {};

  for (let x = 0; x < vout.length; x += 1) {
    const thisVout = vout[x];

    if (thisVout.address && thisVout.address !== 'NON_STANDARD') {
      if (currentDifference === undefined) {
        record = thisVout;
        currentDifference = Math.abs(approxValue - thisVout.value);
      } else {
        const difference = Math.abs(approxValue - thisVout.value);
    
        if (currentDifference > difference) {
          currentDifference = difference;
          record = thisVout;
        }
      }
    }
  }

  if (full)  {
    return record;
  }
  return record.value;
};

const getResultCompilation = (eventInfo, results, betActions) => {
  let totalBet = 0
  let totalMint = 0

  const betActionsValue = betActions.reduce((acc, bet) => acc + bet.betValue, 0.0);

  totalBet = betActionsValue;

  let payoutBlock;
  let address = 'Pending';
  let prizeAmount = 0;
  let OraclePortion = 0;
  let payoutTx = {};
  let vout;


  // End of calculations here

  if (results.length > 0) {
    payoutTx  = results[0].payoutTx || { };
    payoutBlock = payoutTx.blockHeight;
    prizeAmount = totalBet * 0.80;
    OraclePortion = totalBet * 0.02;

    if (payoutTx.vout) {
      vout = payoutTx.vout;

      const PrizeObject = getClosestValue(prizeAmount, vout, true);
      address = PrizeObject.address;
      prizeAmount = PrizeObject.value;
    }
  }

  const supplyChange =  totalBet * 0.18;
  return { address, supplyChange, OraclePortion, prizeAmount, payoutBlock, payoutTx, totalBet, vout, };
};

class LottoList extends Component {
  static propTypes = {
    getLottoEvents: PropTypes.func.isRequired
  }

  constructor (props) {
    super(props)
    const { t } = props;

    this.debounce = null
    this.state = {
      error: null,
      loading: true,
      events: [],
      pages: 0,
      page: 1,
      size: 50
    }
  };

  componentDidMount () {
    this.getLottoEvents()
  };

  componentWillUnmount () {
    if (this.debounce) {
      clearTimeout(this.debounce)
      this.debounce = null
    }
  };

  getLottoEvents = () => {
    this.setState({loading: true}, () => {
      if (this.debounce) {
        clearTimeout(this.debounce)
      }

      this.debounce = setTimeout(() => {
        this.props
          .getLottoEvents({
            limit: this.state.size,
            skip: (this.state.page - 1) * this.state.size
          })
          .then(({data, pages}) => {
            if (this.debounce) {
              data.map(item =>{
                let totalBet = 0;
                let totalMint = 0;
                item.actions.forEach(action => {
                  totalBet += action.betValue
                })
                if (item.results) {
                  item.results.forEach(result =>{
                    if (result.payoutTx) {
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
                    }
                  })
                }
                item.totalBet = totalBet
                item.totalMint = totalMint
              })
              this.setState({events:data, pages, loading: false})
            }
          })
          .catch(error => this.setState({error, loading: false}))
      }, 800)
    })
  }

  handlePage = page => this.setState({page}, this.getLottoEvents)

  handleSize = size => this.setState({size, page: 1}, this.getLottoEvents)

  render () {
    const { t } = this.props;
    const cols = [
      {key: 'start', title: t('start')},
      {key: 'event', title: t('id')},
      // {key: 'name', title: t('name')},
      // {key: 'round', title: t('round')},
      {key: 'betAmount', title: t('Bet Amount')},
      {key: 'prizeAmount', title: t('Prize Amount')},
      {key: 'supplyChange', title: t('Supply Change')},
      // {key: 'betAmount', title: t('betAmount')},
      {key: 'lottoStatus', title: t('Lotto Status')},
      // {key: 'seeDetail', title: t('detail')},
      {key: 'winningAddress', title: t('Winning Address')},
      {key: 'details', title: t('Detail')},
    ]
    if (!!this.state.error) {
      return this.renderError(this.state.error)
    } else if (this.state.loading) {
      return this.renderLoading()
    }
    const selectOptions = PAGINATION_PAGE_SIZE

    const select = (
      <Select
        onChange={value => this.handleSize(value)}
        selectedValue={this.state.size}
        options={selectOptions}/>
    )

    return (
      <div>
        <HorizontalRule
          select={select}
          title={t('title')}/>
        <Table
          className={'table-responsive table--for-lotto'}
          cols={cols}
          data={this.state.events.map((event) => {
            // console.log(event);
            const betAmount = event.actions.reduce((acc, action) => {
                  return acc+ action.betValue
              },0.0
            )

            
            let betStatus = t('open')
            const eventTime = parseInt(event.events[0].timeStamp);
            const eventData = event.events[0];
            if ((eventTime - (20 * 60 * 1000)) < Date.now()) {
              betStatus = t('waitForStart')
              if (eventTime < Date.now()) {
                betStatus = t('started')
                if (event.results.length === 0) {
                  betStatus = <span className={ `badge badge-warning` }>{t('waitingForOracle')}</span>
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

            const eventDate = moment(new Date(event.events[0].createdAt)).utc().format('YYYY-MM-DD HH:mm:ss');
            const {
              supplyChange,
              OraclePortion,
              prizeAmount,
              payoutBlock,
              payoutTx,
              totalBet,
              vout,
              address,
            } = getResultCompilation(event.events[0], event.results, event.actions);

            return {
              ...event,
              start: <Link to={`/lotto/event/${ encodeURIComponent(event.events[0].eventId) }`}>
                {eventDate} </Link>
              ,
              event: (
                <Link to={`/lotto/event/${ encodeURIComponent(event.events[0].eventId) }`}>
                  {event.events[0].eventId}
                </Link>
              ),
              name: <Link to={`/lotto/event/${ encodeURIComponent(event.events[0].eventId) }`}>
                {event.events[0].league}</Link>,
              supplyChange:         <span className={'badge badge-danger'}>
                {numeral(-supplyChange).format('0,0.00')}
              </span>,
              betAmount:  <span className={ `badge badge-danger` }>{ numeral(totalBet).format('0,0.00') }</span>,
              lottoStatus: <span className={ `badge badge-${ event.results.length > 0 ? 'success' : 'warning' }` }>
                {event.results.length > 0 ? 'COMPLETED' : 'PENDING'}
              </span>,
              prizeAmount: <span className={ `badge badge-success` }>{ numeral(prizeAmount).format('0,0.00') }</span>,
              winningAddress: <strong>{address}</strong>,
              details:  <Link to={`/lotto/event/${ encodeURIComponent(event.events[0].eventId) }`}>See Detail</Link>
            }
          })}/>
        <Pagination
          current={this.state.page}
          className="float-right"
          onPage={this.handlePage}
          total={this.state.pages}/>
        <div className="clearfix"/>
      </div>
    )
  };
}

const mapDispatch = dispatch => ({
  getLottoEvents: query => Actions.getLottoEvents(query)
})

export default compose(
  connect(null, mapDispatch),
  translate('LottoList'),
)(LottoList);
