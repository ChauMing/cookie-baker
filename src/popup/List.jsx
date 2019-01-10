import React, { Component } from 'react';
import { Link } from 'react-router-dom'
import List from 'antd/lib/list';
import Button from 'antd/lib/button';
import Switch from 'antd/lib/switch';

import Rule from '../rules';

const ListItem = List.Item;

export default class App extends Component {
  state = {
    rules: []
  }

  componentDidMount = () => {
    this.fetchRules();
  }

  fetchRules = () => {
    Rule.get().then(rules => {
      this.setState({rules});
    });
  }


  openLink = (targetURL) => {
    let url = '';
    if (/^https?/.test(targetURL)) {
      url = targetURL;
    } else {
      url += 'http://'+targetURL;
    }
    chrome.tabs.create({
      url,
    });
  }

  disableAll = () => {
    Rule.set(this.state.rules.map(it => ({
      ...it,
      enabled: false,
    }))).then(this.fetchRules);
  }

  renderHeader = () => {
    return (
      <header className="header">
        <Button type="primary">
          <Link to="/edit">add rule</Link>
        </Button>
        <Button onClick={this.disableAll} style={{float: "right"}}>disable all</Button>
      </header>
    )
  }
  renderFooter = () => {
    return <div>&copy;vchauming@gmail.com</div>
  }


  renderItem = (item) => {
    return (
      <ListItem
        actions={[
          <Link to={`/edit/${item.id}`}>edit</Link>,
          <span
            className="link"
            onClick={() => { Rule.del(item.id);this.fetchRules(); }}
          >del</span>,
          <Switch
            size="small"
            checked={item.enabled}
            onChange={checked => {
              Rule.set(Object.assign({}, item, { enabled: checked }))
              this.fetchRules();
            }}
          />
        ]}
      >
        <span className="link" onClick={() => this.openLink(item.from)}>
          {item.from}
        </span>
        <span className="arrow-right">>>></span>
        <span className="link" onClick={() => this.openLink(item.to)}>
          {item.to}
        </span>
        <span className="list-operation">

        </span>
      </ListItem>
    )
  }

  render() {
    const {props, state} = this;

    return (
      <div>
        {this.renderHeader()}

        <List
          size="small"
          footer={this.renderFooter()}
          bordered
          dataSource={state.rules}
          renderItem={this.renderItem}
        />
      </div>
    )
  }
}

