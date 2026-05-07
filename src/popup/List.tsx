// List：规则列表页，展示与管理所有规则
import { Component } from 'react';
import { Link } from 'react-router-dom';
import List from 'antd/lib/list';
import Button from 'antd/lib/button';
import Switch from 'antd/lib/switch';

import Rule from '../rules';
import type { Rule as RuleType } from '../types';

const ListItem = List.Item;

interface ListState {
  rules: RuleType[];
}

export default class RuleListPage extends Component<{}, ListState> {
  state: ListState = {
    rules: [],
  };

  componentDidMount(): void {
    this.fetchRules();
  }

  /** 拉取规则列表并刷新页面状态 */
  fetchRules = (): void => {
    Rule.get().then((rules) => {
      if (Array.isArray(rules)) {
        this.setState({ rules });
      }
    });
  };

  /** 在新标签页打开规则中的链接 */
  openLink = (targetURL: string): void => {
    const url = /^https?/.test(targetURL) ? targetURL : `http://${targetURL}`;
    chrome.tabs.create({ url });
  };

  /** 一键禁用全部规则 */
  disableAll = (): void => {
    Rule.set(
      this.state.rules.map((it) => ({
        ...it,
        enabled: false,
      })),
    ).then(this.fetchRules);
  };

  renderHeader = () => (
    <header className="header">
      <Button type="primary">
        <Link to="/edit">add rule</Link>
      </Button>
      <Button onClick={this.disableAll} style={{ float: 'right' }}>
        disable all
      </Button>
    </header>
  );

  renderFooter = () => <div>&copy;vchauming@gmail.com</div>;

  /** 渲染单条规则 */
  renderItem = (item: RuleType) => (
    <ListItem
      actions={[
        <Link to={`/edit/${item.id}`}>edit</Link>,
        <span
          className="link"
          onClick={() => {
            Rule.del(item.id).then(this.fetchRules);
          }}
        >
          del
        </span>,
        <Switch
          size="small"
          checked={item.enabled}
          onChange={(checked) => {
            Rule.set({ ...item, enabled: checked }).then(this.fetchRules);
          }}
        />,
      ]}
    >
      <span className="link" onClick={() => this.openLink(item.from)}>
        {item.from}
      </span>
      <span className="arrow-right">&gt;&gt;&gt;</span>
      <span className="link" onClick={() => this.openLink(item.to)}>
        {item.to}
      </span>
      <span className="list-operation" />
    </ListItem>
  );

  render() {
    const { state } = this;

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
    );
  }
}
