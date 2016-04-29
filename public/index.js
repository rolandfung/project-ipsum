import React from 'react';
import { render } from 'react-dom';
import App from './components/App.js';
import Login from './components/Login.js';
import AllApps from './components/AllApplications.js';
import { Provider } from 'react-redux';
import configureStore from './ipsumStore.js';
import { browserHistory, Router, Route, IndexRoute } from 'react-router';
import { syncHistoryWithStore } from 'react-router-redux';
import MainPage from './components/MainPage.js';

const store = configureStore();
const history = syncHistoryWithStore(browserHistory, store);

// GET ASYNC DATA HERE BEFORE RENDER, THEN CALL RENDER

render(
  <Provider store={store}>
    <Router history={history} store={store}>

      <Route path="/login" component={Login} />

      <Route path="/" component={App} >
        <IndexRoute component={MainPage} />
        <Route path="/allApps" component={AllApps} />
      </Route>

    </Router>
  </Provider>,
  document.getElementById('app')
);
