import Component from '../core/Component'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import React from 'react'

import CardEarnings from '../component/Card/CardEarnings'
import CardExchanges from '../component/Card/CardExchanges'
import CardLinks from '../component/Card/CardLinks'
import CardROI from '../component/Card/CardROI'
import HorizontalRule from '../component/HorizontalRule'
import Actions, { getBetEventInfo } from '../core/Actions'
import numeral from 'numeral'
import { dateFormat } from '../../lib/date'
import Table from '../component/Table'
import { Link } from 'react-router-dom'
import sortBy from 'lodash/sortBy'
import moment from 'moment/moment'
import config from '../../config'
import Card from '../component/Card'
import CardBetEvent from '../component/Card/CardBetEvent'
import CardBetResult from '../component/Card/CardBetResult'

class BetEvent extends Component {
  static propTypes = {
    match: PropTypes.object.isRequired,
    getBetEventInfo: PropTypes.func.isRequired,
    getBetActions: PropTypes.func.isRequired,
    getBetResults: PropTypes.func.isRequired,
  }

  constructor (props) {
    super(props)
    this.state = {
      eventId: '',
      eventInfo: [],
      betActions: [],
      betResults: [],
      loading: true,
      error: null,
      cols: [
        {key: 'createdAt', title: 'Time'},
        {key: 'bet', title: 'Bet'},
        {key: 'value', title: 'Value'},
        {key: 'txId', title: 'TX ID'}
      ]
    }
  };

  componentDidMount () {
    this.setState({
      eventId: this.props.match.params.eventId,
    })
    this.getBetData()
  };

  componentDidUpdate (prevProps) {
    const {params: {eventId}} = this.props.match
    if (prevProps.match.params.eventId !== eventId) {
      this.setState({
        eventId: this.props.match.params.eventId,
      })
      this.getBetData()
    }
  };

  getBetData = () => {
    this.setState({loading: true}, () => {
      Promise.all([
        this.props.getBetEventInfo(this.state.eventId),
        this.props.getBetActions(this.state.eventId),
        this.props.getBetResults(this.state.eventId),
      ]).then((res) => {
        this.setState({
          eventInfo: res[0], // 7 days at 5 min = 2016 coins
          betActions: res[1].actions,
          betResults: res[2].results,
          loading: false,
        })
      })

    })
  }

  render () {
    if (!!this.state.error) {
      return this.renderError(this.state.error)
    } else if (this.state.loading) {
      return this.renderLoading()
    }
    return (
      <div>
        <HorizontalRule title="Bet Event Info"/>
        <div className="row">
          <div className="col-sm-12 col-md-6">
            <CardBetEvent eventInfo={this.state.eventInfo}/>
          </div>
          <div className="col-sm-12 col-md-6">
            <CardBetResult betResult={this.state.betResults[0]}/>
          </div>
        </div>
        <div className="row">
          <div className="col-sm-12 col-md-12">
            <Table
              cols={this.state.cols}
              data={sortBy(this.state.betActions.map((action) => {
                return {
                  ...action,
                  createdAt: dateFormat(action.createdAt),
                  bet: action.betChoose,
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
        </div>
      </div>
    )
  };
}

const mapDispatch = dispatch => ({
  getBetEventInfo: query => Actions.getBetEventInfo(query),
  getBetActions: query => Actions.getBetActions(query),
  getBetResults: query => Actions.getBetResults(query)
})

export default connect(null, mapDispatch)(BetEvent)
