import Actions from '../core/Actions'
import Component from '../core/Component'
import { connect } from 'react-redux'
import { dateFormat } from '../../lib/date'
import { Link } from 'react-router-dom'
import moment from 'moment'
import PropTypes from 'prop-types'
import React from 'react'
import sortBy from 'lodash/sortBy'

import HorizontalRule from '../component/HorizontalRule'
import Pagination from '../component/Pagination'
import Table from '../component/Table'
import Select from '../component/Select'

import { PAGINATION_PAGE_SIZE } from '../constants'

class BetEventList extends Component {
  static propTypes = {
    getAllBetEvents: PropTypes.func.isRequired
  }

  constructor (props) {
    super(props)
    this.debounce = null
    this.state = {
      cols: [
        {key: 'block', title: 'Block'},
        {key: 'start', title: 'Start'},
        {key: 'eventId', title: 'Id'},
        {key: 'name', title: 'Name'},
        {key: 'round', title: 'Round'},
        {key: 'homeTeam', title: 'Home'},
        {key: 'awayTeam', title: 'Away'},
        {key: 'homeOdds', title: '1'},
        {key: 'drawOdds', title: 'x'},
        {key: 'awayOdds', title: '2'},
        {key: 'txId', title: 'TX ID'},
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
    this.getAllBetEvents()
  };

  componentWillUnmount () {
    if (this.debounce) {
      clearTimeout(this.debounce)
      this.debounce = null
    }
  };

  getAllBetEvents = () => {
    this.setState({loading: true}, () => {
      if (this.debounce) {
        clearTimeout(this.debounce)
      }

      this.debounce = setTimeout(() => {
        this.props
          .getAllBetEvents({
            limit: this.state.size,
            skip: (this.state.page - 1) * this.state.size
          })
          .then(({events, pages}) => {
            console.log(events)
            if (this.debounce) {
              this.setState({events, pages, loading: false})
            }
          })
          .catch(error => this.setState({error, loading: false}))
      }, 800)
    })
  }

  handlePage = page => this.setState({page}, this.getAllBetEvents)

  handleSize = size => this.setState({size, page: 1}, this.getAllBetEvents)

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
          className={'table--for-betevents'}
          cols={this.state.cols}
          data={sortBy(this.state.events.map((event) => {
            return {
              ...event,
              block: (<Link to={`/block/${ event.blockHeight }`}>{event.blockHeight}</Link>),
              start: <Link to={`/bet/event/${ encodeURIComponent(event.eventId) }`}>
                {moment.unix(event.timeStamp).format('MM/DD/YYYY HH:mm:ss')} </Link>
              ,
              eventId: (
                <Link to={`/bet/event/${ encodeURIComponent(event.eventId) }`}>
                  {event.eventId}
                </Link>
              ),
              name: <Link to={`/bet/event/${ encodeURIComponent(event.eventId) }`}>
                {event.league}</Link>,
              round: <Link to={`/bet/event/${ encodeURIComponent(event.eventId) }`}>
                {event.info}</Link>,
              homeTeam: <Link to={`/bet/event/${ encodeURIComponent(event.eventId) }`}>{event.homeTeam}</Link>,
              awayTeam: <Link to={`/bet/event/${ encodeURIComponent(event.eventId) }`}>{event.awayTeam}</Link>,
              homeOdds: event.homeOdds > 10000 ? event.homeOdds / 10000 : event.homeOdds,
              drawOdds: event.drawOdds > 10000 ? event.drawOdds / 10000 : event.drawOdds,
              awayOdds: event.awayOdds > 10000 ? event.awayOdds / 10000 : event.awayOdds,
              txId: (
                <Link to={`/tx/${ event.txId }`}>
                  {event.txId}
                </Link>
              ),
            }
          }), ['block']).reverse()}/>
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
  getAllBetEvents: query => Actions.getAllBetEvents(query)
})

export default connect(null, mapDispatch)(BetEventList)
