
import Component from 'core/Component';
import PropTypes from 'prop-types';
import React from 'react';

import { Table, Thead, Tbody, Tr, Th, Td } from 'react-super-responsive-table'
import 'react-super-responsive-table/dist/SuperResponsiveTableStyle.css'

import TableHeader from './TableHeader';

export default class TableWrapper extends Component {
  static defaultProps = {
    cols: [],
    data: [],
    hasDivider: true,
  };

  static propTypes = {
    cols: PropTypes.array,
    data: PropTypes.array,
    max: PropTypes.number,
    hasDivider: PropTypes.bool,
  };

  componentDidMount() {
  };

  componentWillUnmount() {
  };

  getBody() {
    const { data } = this.props;
    const keys = this.getKeys();

    const rows = data.map((row, idx) => {
      const cells = keys.map((col, i) => {
        return (
          <Td key={ i }>{ row[col] }</Td>
        )
      });

      return (
        <Tr key={ idx }>
          { cells }
        </Tr>
      )
    })

    return (
      <Tbody>
        { rows }
      </Tbody>
    );
  }

  getKeys() {
    const { cols } = this.props;

    const keys = cols.map(col => {
      return (typeof col === 'object') ? col.key : col;
    })

    return keys;
  }

  render() {
    const { props } = this;

    if (!props.data.length) {
      return false;
    }

    return (
      <div className="super-table">
          <Table className={ `${ this.props.hasDivider ? 'table--has-divider' : '' } ${ this.props.className || 'animated fadeIn' }` }>
            <TableHeader cols={ props.cols } />
            { this.getBody() }
          </Table>
      </div>
    );
  };
}
