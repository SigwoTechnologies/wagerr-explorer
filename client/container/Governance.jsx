import Actions from '../core/Actions'
import Component from '../core/Component'
import { connect } from 'react-redux'
import { date24Format } from '../../lib/date'
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
import CardProposalCycle from '../component/Card/CardProposalCycle'
import _ from 'lodash'
import { getSubsidy } from '../../lib/blockchain'

class Governance extends Component {
  static propTypes = {
    getCurrentPPs: PropTypes.func.isRequired
  }

  constructor (props) {
    super(props)
    this.debounce = null
    this.state = {
      cols: [
        {key: 'name', title: 'Name'},
        {key: 'createdAt', title: 'Date'},
        {key: 'url', title: 'Detail'},
        {key: 'totalPayment', title: 'Budget'},
        {key: 'payementPeriod', title: 'PAYMENT PERIOD'},
        {key: 'votes', title: 'Votes'},
        {key: 'status', title: 'Status'},
      ],
      error: null,
      loading: true,
      totalAllocated: 0,
      totalBudget: 0,
      currentBlock: 0,
      nextSuperBlock:0,
      pps: [],
      pages: 0,
      page: 1,
      size: 10
    }
  };

  componentDidMount () {
    this.getCurrentPPs()
  };

  componentWillUnmount () {
    if (this.debounce) {
      clearTimeout(this.debounce)
      this.debounce = null
    }
  };

  getCurrentPPs = () => {
    this.setState({loading: true}, () => {
      if (this.debounce) {
        clearTimeout(this.debounce)
      }
      this.debounce = setTimeout(() => {
        this.props
          .getCurrentPPs({
            limit: this.state.size,
            skip: (this.state.page - 1) * this.state.size
          })
          .then(({pps, totalAllocated,nextSuperBlock, totalBudget,pages}) => {
            if (this.debounce) {
              this.setState({pps,totalAllocated,nextSuperBlock, totalBudget, pages, loading: false})
            }
          })
          .catch(error => this.setState({error, loading: false}))
      }, 800)
    })
  }
  handlePage = page => this.setState({page}, this.getCurrentPPs)
  handleSize = size => this.setState({size, page: 1}, this.getCurrentPPs)
  withHttp = url => !/^https?:\/\//i.test(url) ? `http://${url}` : url;

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
        <div className="row">
          <div className="col-md-6 col-lg-6">
            <CardProposalCycle currentBlock={this.state.currentBlock}
                                nextSuperBlock={this.state.nextSuperBlock}
                                totalBudget={this.state.totalBudget}
                               totalAllocated={this.state.totalAllocated}
                               proposalsNum={this.state.pps.length}
            ></CardProposalCycle>
          </div>
        </div>
        <HorizontalRule
          select={select}
          title="Current Proposals"/>
        <Table
          cols={this.state.cols}
          data={sortBy(this.state.pps.map((pp) => {
            const created = moment(pp.createdAt).utc()
            const isEpoch = created.unix() === 0
            return {
              ...pp,
              createdAt: <span>{`${date24Format(pp.createdAt)}`}</span>,
              status: ((pp.yeas - pp.nays) * 10 > pp.masternodeCount) ? <span
                className="badge badge-success">Pass</span> : <span className="badge badge-danger">Fail</span>,
              votes: <span>{`Yes: ${pp.yeas}, No: ${pp.nays}`}</span>,
              url: <a target="_blank" href={this.withHttp(pp.url)}>View</a>,
              totalPayment: <span>{`${pp.totalPayment} WGR`}</span>,
              payementPeriod: <span>{`${pp.monthlyPayment} WGR /month`}</span>
            }
          }), ['status'])}/>
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
  getCurrentPPs: query => Actions.getCurrentPPs(query)
})
export default connect(null, mapDispatch)(Governance)
