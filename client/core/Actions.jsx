
import fetchWorker from '../../lib/fetch.worker';
import promise from 'bluebird';
import {
  COIN,
  COINS,
  ERROR,
  TXS,
  WATCH_ADD,
  WATCH_REMOVE
} from '../constants';

const promises = new Map();
const worker = new fetchWorker();

worker.onerror = (err) => {
  console.log(err);
  return err;
};

worker.onmessage = (ev) => {
  const p = promises.get(ev.data.type);
  if (!p) {
    return false;
  }

  if (ev.data.error) {
    p.reject(ev.data.error);
    promises.delete(ev.data.type);
    return false;
  }

  p.resolve(ev.data.data);
  return true;
};

const getFromWorker = (type, resolve, reject, query = null) => {
  promises.set(type, { resolve, reject });
  worker.postMessage({ query, type });
  return true;
};

export const getAddress = (query) => {
  return new promise((resolve, reject) => {
    return getFromWorker('address', resolve, reject, query);
  });
};

export const getBlock = (query) => {
  return new promise((resolve, reject) => {
    return getFromWorker('block', resolve, reject, query);
  });
};

export const getCoinHistory = (dispatch, query) => {
  return new promise((resolve, reject) => {
    return getFromWorker(
      'coins',
      (payload) => {
        if (payload && payload.length) {
          dispatch({ payload: payload[0], type: COIN });
        }
        dispatch({ payload, type: COINS });
        resolve(payload);
      },
      (payload) => {
        dispatch({ payload, type: ERROR });
        reject(payload);
      },
      query
    );
  });
};

export const getCoinsWeek = () => {
  return new promise((resolve, reject) => {
    return getFromWorker('coins-week', resolve, reject);
  });
};

export const getIsBlock = (query) => {
  return new promise((resolve, reject) => {
    return getFromWorker('is-block', resolve, reject, query);
  });
};

export const getMNs = (query) => {
  return new promise((resolve, reject) => {
    return getFromWorker('mns', resolve, reject, query);
  });
};

export const getPeers = () => {
  return new promise((resolve, reject) => {
    return getFromWorker(
      'peers',
      (peers) => {
        resolve(peers);
      },
      reject
    );
  });
};

export const getTop100 = () => {
  return new promise((resolve, reject) => {
    return getFromWorker('top-100', resolve, reject);
  });
};

export const getTX = (query) => {
  return new promise((resolve, reject) => {
    return getFromWorker('tx', resolve, reject, query);
  });
};

export const getTXLatest = (dispatch, query) => {
  return new promise((resolve, reject) => {
    return getFromWorker(
      'txs-latest',
      (payload) => {
        if (dispatch) {
          dispatch({ payload, type: TXS });
        }
        resolve(payload);
      },
      (payload) => {
        if (dispatch) {
          dispatch({ payload, type: ERROR });
        }
        reject(payload);
      },
      query
    );
  });
};

export const getTXs = (dispatch, query) => {
  return new promise((resolve, reject) => {
    return getFromWorker(
      'txs',
      (payload) => {
        if (dispatch) {
          dispatch({ payload, type: TXS });
        }
        resolve(payload);
      },
      (payload) => {
        if (dispatch) {
          dispatch({ payload, type: ERROR });
        }
        reject(payload);
      },
      query
    );
  });
};

export const getTXsWeek = () => {
  return new promise((resolve, reject) => {
    return getFromWorker('txs-week', resolve, reject);
  });
};

export const setTXs = (dispatch, txs) => {
  dispatch({ payload: txs, type: TXS });
};

export const setWatch = (dispatch, term) => {
  dispatch({ payload: term, type: WATCH_ADD });
};

export const removeWatch = (dispatch, term) => {
  dispatch({ payload: term, type: WATCH_REMOVE });
};

export const getListEvents = (query) => {
  return new promise((resolve, reject) => {
    return getFromWorker('listevents', resolve, reject, query);
  });
};

export const getBetActionsWeek = () => {
  return new promise((resolve, reject) => {
    return getFromWorker('betactions-week', resolve, reject);
  });
};
export const getBetEvents = (query) => {
  return new promise((resolve, reject) => {
    return getFromWorker('betevents', resolve, reject, query);
  });
};
export const getBetQuery = (query) => {
  return new promise((resolve, reject) => {
    return getFromWorker('beteventquery', resolve, reject, query);
  });
};
export const getBetActions = (query) => {
  return new promise((resolve, reject) => {
    return getFromWorker('betactions', resolve, reject, query);
  });
};
export const getBetResults = (query) => {
  return new promise((resolve, reject) => {
    return getFromWorker('betresults', resolve, reject, query);
  });
};
export const getBetspreads = (query) => {
  return new promise((resolve, reject) => {
    return getFromWorker('betspreads', resolve, reject, query);
  });
};export const getBetTotals = (query) => {
  return new promise((resolve, reject) => {
    return getFromWorker('bettotals', resolve, reject, query);
  });
};
export const getBetEventInfo = (query) => {
  return new promise((resolve, reject) => {
    return getFromWorker('beteventinfo', resolve, reject, query);
  });
};

export const getLottoEventInfo = (query) => {
  return new promise((resolve, reject) => {
    return getFromWorker('lottoeventinfo', resolve, reject, query);
  });
};

export const getBetEventsInfo = (query) => {
  return new promise((resolve, reject) => {
    return getFromWorker('beteventsinfo', resolve, reject, query);
  });
};
export const getCurrentPPs = (query) => {
  return new promise((resolve, reject) => {
    return getFromWorker('currentpps', resolve, reject, query);
  });
};
export const getBetPerWeek = () => {
  return new promise((resolve, reject) => {
    return getFromWorker('betperweek', resolve, reject);
  });
};
export const getOpCode = (query) => {
  return new promise((resolve, reject) => {
    return getFromWorker('opcode', resolve, reject, query);
  });
};

export const getLottoEvents = (query) => {
  return new promise((resolve, reject) => {
    return getFromWorker('lottoevents', resolve, reject, query);
  });
};

export const getLottoBets = (query) => {
  return new promise((resolve, reject) => {
    return getFromWorker('lottobets', resolve, reject, query);
  });
};

export const getLottoResults = (query) => {
  return new promise((resolve, reject) => {
    return getFromWorker('lottoresults', resolve, reject, query);
  });
};

export default {
  getAddress,
  getBlock,
  getCoinHistory,
  getCoinsWeek,
  getIsBlock,
  getMNs,
  getPeers,
  getTop100,
  getTX,
  getTXLatest,
  getTXs,
  getTXsWeek,
  setTXs,
  getListEvents,
  getBetActionsWeek,
  getBetEvents,
  getBetQuery,
  getBetActions,
  getBetResults,
  getBetEventInfo,
  getBetEventsInfo,
  getCurrentPPs,
  getBetPerWeek,
  setWatch,
  removeWatch,
  getOpCode,
  getBetspreads,
  getBetTotals,
  getLottoBets,
  getLottoEvents,
  getLottoResults,
  getLottoEventInfo,
};
