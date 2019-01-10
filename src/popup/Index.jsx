import React, { Component } from 'react';
import { Route, Redirect } from 'react-router-dom'


export default class App extends Component {
  render() {
    const props = this.props;
    return (
      <div>
        <Route
          exact
          path={props.match.url}
          render={() => <Redirect to="/list" />}
        />
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
    )
  }
}

