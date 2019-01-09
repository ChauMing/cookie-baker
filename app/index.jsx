import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter, Route } from 'react-router-dom'
import routes from './popup/routes';

const App = (props) => (
  <div>
    {
      props.routes.map(route => (
        <Route
          exact={route.exact || false}
          path={route.path}
          key={route.path}
          render={props => <route.component {...props} routes={route.routes}/>}
        />
      ))
    }
  </div>
);

ReactDOM.render(
  <BrowserRouter>
    <App routes={routes} />
  </BrowserRouter>,
  document.getElementById('app')
);