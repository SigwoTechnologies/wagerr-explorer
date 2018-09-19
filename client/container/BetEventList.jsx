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
import Table from '../component/Table'
import Select from '../component/Select'
import _ from 'lodash'

import { PAGINATION_PAGE_SIZE } from '../constants'
import { timeStamp24Format } from '../../lib/date'
import numeral from 'numeral'

class BetEventList extends Component {
  static propTypes = {
    getBetEventsInfo: PropTypes.func.isRequired
  }

  constructor (props) {
    super(props)
    this.debounce = null
    this.state = {
      cols: [
        {key: 'start', title: 'Start'},
        {key: 'event', title: 'Id'},
        {key: 'name', title: 'Name'},
        {key: 'round', title: 'Round'},
        {key: 'homeTeam', title: 'Home'},
        {key: 'awayTeam', title: 'Away'},
        {key: 'homeOdds', title: '1'},
        {key: 'drawOdds', title: 'x'},
        {key: 'awayOdds', title: '2'},
        {key: 'betNum', title: 'Bet Num'},
        {key: 'betAmount', title: 'Bet Amount'},
        {key: 'betStatus', title: 'Bet Status'},
        {key: 'seeDetail', title: 'Detail'},
      ],
      error: null,
      loading: true,
      events: [],
      pages: 0,
      page: 1,
      size: 10
    }
  };

  componentDidMount () {
    this.getBetEventsInfo()
  };

  componentWillUnmount () {
    if (this.debounce) {
      clearTimeout(this.debounce)
      this.debounce = null
    }
  };

  getBetEventsInfo = () => {
    this.setState({loading: true}, () => {
      if (this.debounce) {
        clearTimeout(this.debounce)
      }

      this.debounce = setTimeout(() => {
        this.props
          .getBetEventsInfo({
            limit: this.state.size,
            skip: (this.state.page - 1) * this.state.size
          })
          .then(({data, pages}) => {
            if (this.debounce) {
              this.setState({events:data, pages, loading: false})
            }
          })
          .catch(error => this.setState({error, loading: false}))
      }, 800)
    })
  }

  handlePage = page => this.setState({page}, this.getBetEventsInfo)

  handleSize = size => this.setState({size, page: 1}, this.getBetEventsInfo)

  render () {
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
          title="Bet Events"/>
        <Table
          className={'table-responsive table--for-betevents'}
          cols={this.state.cols}
          data={sortBy(this.state.events.map((event) => {
            const betNum = event.actions.length
            const betAmount = event.actions.reduce((acc, action) => {
                  return acc+ action.betValue
              },0.0
            )
            let betStatus = 'OPEN'
            if (event.events[0].timeStamp*1000 + 20 * 60 * 1000< Date.now()) {
              betStatus = 'WAITING FOR START'
              if (event.events[0].timeStamp*1000< Date.now()) {
                betStatus = 'STARTED'
                if (event.results.length === 0) {
                  betStatus = <span className={ `badge badge-warning` }>{'WAITING FOR ORACLE'}</span>
                }
                if (event.results.length > 0) {
                  betStatus = <span className={ `badge badge-info` }>{event.results[0].result}</span>
                }
              }
            }
            let homeOdds = (event.events[event.events.length -1].homeOdds / 10000)
            let drawOdds = (event.events[event.events.length -1].drawOdds / 10000)
            let awayOdds = (event.events[event.events.length -1].awayOdds / 10000)
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
              start: <Link to={`/bet/event/${ encodeURIComponent(event.events[0].eventId) }`}>
                {timeStamp24Format(event.events[0].timeStamp)} </Link>
              ,
              event: (
                <Link to={`/bet/event/${ encodeURIComponent(event.events[0].eventId) }`}>
                  {event.events[0].eventId}
                </Link>
              ),
              name: <Link to={`/bet/event/${ encodeURIComponent(event.events[0].eventId) }`}>
                {event.events[0].league}</Link>,
              round: <Link to={`/bet/event/${ encodeURIComponent(event.events[0].eventId) }`}>
                {event.events[0].info}</Link>,
              homeTeam: <Link to={`/bet/event/${ encodeURIComponent(event.events[0].eventId) }`}>{event.events[0].homeTeam}</Link>,
              awayTeam: <Link to={`/bet/event/${ encodeURIComponent(event.events[0].eventId) }`}>{event.events[0].awayTeam}</Link>,
              homeOdds: homeOdds,
              drawOdds: drawOdds,
              awayOdds: awayOdds,
              betNum: betNum,
              betAmount:  <span className={ `badge badge-danger` }>{ numeral(betAmount).format('0,0.0000') }</span>,
              betStatus: betStatus,
              seeDetail:  <Link to={`/bet/event/${ encodeURIComponent(event.events[0].eventId) }`}>See Detail</Link>
            }
          }),['timeStamp'])}/>
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
  getBetEventsInfo: query => Actions.getBetEventsInfo(query)
})

export default connect(null, mapDispatch)(BetEventList)
