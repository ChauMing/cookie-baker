import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter, Route } from 'react-router-dom'
import routes from './popup/routes';
import './index.less'

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
  <HashRouter>
    <App routes={routes} />
  </HashRouter>,
  document.getElementById('app')
);

if(module.hot) {
  module.hot.accept(() => {
    ReactDOM.render(
      <BrowserRouter>
        <App routes={routes} />
      </BrowserRouter>,
      document.getElementById('app')
    );
  })
}
