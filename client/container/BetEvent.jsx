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

class BetEvent extends Component {
  static propTypes = {
    getBetEvents: PropTypes.func.isRequired
  }

  constructor (props) {
    super(props)
    this.debounce = null
    this.state = {
      cols: [
        {key: 'time', title: 'Time'},
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
    this.getBetEvents()
  };

  componentWillUnmount () {
    if (this.debounce) {
      clearTimeout(this.debounce)
      this.debounce = null
    }
  };

  getBetEvents = () => {
    this.setState({loading: true}, () => {
      if (this.debounce) {
        clearTimeout(this.debounce)
      }

      this.debounce = setTimeout(() => {
        this.props
          .getBetEvents({
            limit: this.state.size,
            skip: (this.state.page - 1) * this.state.size
          })
          .then(({events, pages}) => {
            if (this.debounce) {
              this.setState({events, pages, loading: false})
            }
          })
          .catch(error => this.setState({error, loading: false}))
      }, 800)
    })
  }

  handlePage = page => this.setState({page}, this.getBetEvents)

  handleSize = size => this.setState({size, page: 1}, this.getBetEvents)

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
          cols={this.state.cols}
          data={sortBy(this.state.events.map((event) => {
            return {
              ...event,
              time: moment.unix(parseInt(event.starting)).utc().format('MMM Do YYYY, HH:mm:ss'),
              name: event.name,
              round: event.round,
              homeTeam: event.teams[0].name,
              awayTeam: event.teams[1].name,
              homeOdds: parseInt(event.teams[0].odds)/10000,
              drawOdds: parseInt(event.teams[2].odds)/10000,
              awayOdds: parseInt(event.teams[1].odds)/10000,
              txId: (
                <Link to={`/tx/${ event.txId }`}>
                  {event.txId}
                </Link>
              ),
            }
          }), ['id'])}/>
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
  getBetEvents: query => Actions.getBetEvents(query)
})

export default connect(null, mapDispatch)(BetEvent)
