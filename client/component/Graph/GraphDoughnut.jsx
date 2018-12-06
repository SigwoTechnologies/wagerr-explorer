
import Chart from 'chart.js';
import Component from '../../core/Component';
import isEqual from 'lodash/isEqual';
import PropTypes from 'prop-types';
import React from 'react';

export default class GraphDoughnut extends Component {
  static defaultProps = {
    colors: 'rgba(0,255,0,1)',
    data: [],
    labels: []
  };

  static propTypes = {
    colors: PropTypes.array.isRequired,
    data: PropTypes.array.isRequired,
    height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    labels: PropTypes.array.isRequired,
    width: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
  };

  constructor(props) {
    super(props);

    this.chart = null;
    this.id = this.randomString();
  };

  componentDidMount() {
    const el = document.getElementById(this.id);

    // Change the clip area for the graph to avoid
    // peak and valley cutoff.
    Chart.canvasHelpers.clipArea = (ctx, clipArea) => {
      ctx.save();
      ctx.beginPath();
      ctx.rect(
        clipArea.left,
        clipArea.top - 5,
        clipArea.right - clipArea.left,
        clipArea.bottom + 5
      );
      ctx.clip();
    };

    this.chart = new Chart(el, this.getConfig());
  };

  componentDidUpdate(prevProps) {
    if (!isEqual(this.props.data, prevProps.data)) {
      const config = this.getConfig();
      this.chart.config.data = config.data;
      this.chart.update();
    }
  };

  componentWillUnmount() {
    this.chart.destroy();
  };

  getConfig = () => {
    return {
      type: 'doughnut',
      data: {
        labels: this.props.labels,
        datasets: [{
          backgroundColor: this.props.colors,
          borderWidth: 3,
          data: this.props.data,
        }]
      },
      options: {
        layout: {
          padding: {
            bottom: 5,
            left: 0,
            right: 0,
            top: 5
          }
        },
        maintainAspectRatio: false,
        responsive: true,
        legend: {
          display: true,
          position: 'right'
        },
      }
    };
  };

  render() {
    return (
      <div
        className={ `${ this.props.className ? this.props.className : '' }` }
        style={{ height: this.props.height, width: this.props.width }}>
        <canvas id={ this.id } />
      </div>
    );
  };
}
