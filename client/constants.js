
export const COIN = 'COIN';
export const COINS = 'COINS';
export const ERROR = 'ERROR';
export const TXS = 'TXS';
export const WATCH_ADD = 'WATCH_ADD';
export const WATCH_REMOVE = 'WATCH_REMOVE';

export const API_BASE = location.origin;
export const PAGINATION_PAGE_SIZE = [
  { label: '10', value: 10 },
  { label: '25', value: 25 },
  { label: '50', value: 50 },
];

export const FILTER_EVENTS_OPTIONS = [
  { label: 'All', value: 'All' },
  // { label: 'Sports', value: 'Sports' },
  { label: 'Baseball', value: 'Baseball' },
  { label: 'Football', value: 'Football' },
  { label: 'Basketball', value: 'Basketball' },
  { label: 'Hockey', value: 'Hockey' },
  { label: 'Soccer', value: 'Soccer' },
  { label: 'Mixed Martial Arts', value: 'Mixed Martial Arts' },
  { label: 'Rugby Union', value: 'Rugby Union' },
  { label: 'Esports', value: 'Esports' },
];

export default {
  COIN,
  COINS,
  ERROR,
  PAGINATION_PAGE_SIZE,
  TXS,
  WATCH_ADD,
  WATCH_REMOVE,
  FILTER_EVENTS_OPTIONS,
  API_BASE,
};
