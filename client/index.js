
import 'babel-polyfill';
import './theme.scss';
import { createStore } from 'redux';
import Promise from 'bluebird';
import { Provider } from 'react-redux';
import React from 'react';
import { render } from 'react-dom';

import App from './App';
import Reducers from './core/Reducers';
import i18n from './i18n/i18n';
import { I18nextProvider } from 'react-i18next';

// Setup the redux store.
const store = createStore(Reducers);

render(
  (<Provider store={ store }>
    <I18nextProvider i18n={i18n}>
      <App/>
    </I18nextProvider>
  </Provider>),
  document.getElementById('react-app')
);
