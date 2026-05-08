// List：规则列表页，展示与管理所有规则（Table 版：两列、无表头）
import { Component } from "react";
import { Link } from "react-router-dom";
import Table, { ColumnProps } from "antd/lib/table";
import Button from "antd/lib/button";
import Switch from "antd/lib/switch";
import Tooltip from "antd/lib/tooltip";

import Rule from "../rules";
import type { Rule as RuleType } from "../types";
import { parseEndpoint } from "../utils/url";

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

  /** 在新标签页打开规则中的链接：统一走 URL 解析，自动补协议 */
  openLink = (targetURL: string): void => {
    const parsed = parseEndpoint(targetURL);
    const url = parsed ? parsed.url : targetURL;
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
      <Button onClick={this.disableAll} style={{ float: "right" }}>
        disable all
      </Button>
    </header>
  );

  renderFooter = () => <div>&copy;vchauming@gmail.com</div>;

  /** 表格列定义：第一列 from→to，第二列操作
   *
   * 宽度预算（popup 总宽 600px）：
   * - 表格外框 ≈ 2px
   * - 操作列内容：edit(≈28) + del(≈22) + Switch(28) + gap 10×2 + 左右 padding 12 ≈ 110，取 120 留余量
   * - 分隔线 ≈ 1px
   * - 第一列 = 600 - 2 - 120 - 1 ≈ 477，取整为 460 留安全边距
   */
  columns: ColumnProps<RuleType>[] = [
    {
      key: "pair",
      width: 360,
      // 第一列的 render 需要拿到整行数据，不绑定具体 dataIndex
      render: (_: unknown, item: RuleType) => (
        <div className="rule-pair">
          <Tooltip
            title={item.from}
            placement="topLeft"
            overlayClassName="rule-tooltip"
          >
            <span
              className="link rule-host"
              onClick={() => this.openLink(item.from)}
            >
              {item.from}
            </span>
          </Tooltip>
          <span className="arrow-right">&gt;&gt;&gt;</span>
          <Tooltip
            title={item.to}
            placement="topLeft"
            overlayClassName="rule-tooltip"
          >
            <span
              className="link rule-host"
              onClick={() => this.openLink(item.to)}
            >
              {item.to}
            </span>
          </Tooltip>
        </div>
      ),
    },
    {
      key: "actions",
      width: 120,
      // 固定在右侧，保证空间不足时也能展示操作栏
      fixed: "right",
      className: "rule-actions-cell",
      // 操作列同样直接取整行数据
      render: (_: unknown, item: RuleType) => (
        <div className="rule-actions">
          <Link to={`/edit/${item.id}`}>edit</Link>
          <span
            className="link"
            onClick={() => {
              Rule.del(item.id).then(this.fetchRules);
            }}
          >
            del
          </span>
          <Switch
            size="small"
            checked={item.enabled}
            onChange={(checked) => {
              Rule.set({ ...item, enabled: checked }).then(this.fetchRules);
            }}
          />
        </div>
      ),
    },
  ];

  render() {
    const { state } = this;

    return (
      <div>
        {this.renderHeader()}
        {/* showHeader={false} 隐藏表头；pagination={false} 不分页；
            fixed 列必须搭配 scroll.x 才会生效 */}
        <Table<RuleType>
          className="rule-table"
          size="small"
          bordered
          rowKey="id"
          showHeader={false}
          pagination={false}
          columns={this.columns}
          dataSource={state.rules}
          footer={this.renderFooter}
          scroll={{ x: 580 }}
        />
      </div>
    );
  }
}
