
import Component from '../../core/Component';
import PropTypes from 'prop-types';
import React from 'react';
import { Table, Thead, Tbody, Tr, Th, Td } from 'react-super-responsive-table'

/**
 * Will use material icons to render.
 * @param {Object} props The props with the name.
 */
const TableHeader = (props) => {
    const cells = props.cols.map((col, idx) => {
      if (typeof col === 'object') {
        col = col.title;
      }

      return (
        <Th key={ idx } >{ col }</Th>
      )
    });

    return (
      <Thead>
        <Tr>
          { cells }
        </Tr>
      </Thead>
    );
};

TableHeader.propTypes = {
  cols: PropTypes.array
};

export default TableHeader;
