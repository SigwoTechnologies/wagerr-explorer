import Component from '../../core/Component'
import PropTypes from 'prop-types'
import React from 'react'

import Card from './Card'
import GraphDoughnut from '../Graph/GraphDoughnut'
import moment from 'moment'

export default class CardProposalCycle extends Component {
  static defaultProps = {
    currentBlock: 0,
    totalBudget: 0,
    totalAllocated: 0,
    nextSuperBlock: 0,
    proposalsNum: 0
  }

  static propTypes = {
    currentBlock: PropTypes.number.isRequired,
    totalBudget: PropTypes.number.isRequired,
    totalAllocated: PropTypes.number.isRequired,
    nextSuperBlock: PropTypes.number.isRequired,
    proposalsNum: PropTypes.number.isRequired,
  }

  render () {
    return (
      <div className="animated fadeInUp">
        <Card title="Budget Status">
              <div className="card__row">
                <span className="card__label">TOTAL BUDGET:</span>
                <span className="card__result card__result--status">{this.props.totalBudget} WGR</span>
              </div>
              <div className="card__row">
                <span className="card__label">ALLOCATED:</span>
                <span className="card__result">{this.props.totalAllocated} WGR</span>
              </div>
              <div className="card__row">
                <span className="card__label">TOTAL PROPOSALS:</span>
                <span className="card__result">{this.props.proposalsNum}</span>
              </div>
              <div className="card__row">
                <span className="card__label">NEXT SUPERBLOCK:</span>
                <span className="card__result">{this.props.nextSuperBlock} ({moment().utc().add(this.props.nextSuperBlock-this.props.currentBlock, 'seconds').fromNow()})</span>
              </div>
        </Card>
      </div>
    )
  };
}
