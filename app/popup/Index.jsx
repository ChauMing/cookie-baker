import React, { Component } from 'react';
import { Route } from 'react-router-dom'


export default class App extends Component {
  state = {
    rules: []
  }

  componentDidMount() {
    chrome.storage.sync.get(function ({ rules = [] }) {
      if(chrome.runtime.lastError) {
        return console.log(chrome.runtime.lastError);
      }
      return this.setState({ rules });
    });
  }

  storageRules = () => {
    const rules = this.state.rules;
    chrome.storage.sync.set({ rules }, function () {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
      }
      chrome.runtime.sendMessage('reloadRules');
    });
  }



  render() {
    const props = this.props;

    return (
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
    )
  }
}

