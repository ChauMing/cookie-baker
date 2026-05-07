// Edit：规则编辑页，支持新建与编辑
import React, { Component } from 'react';
import { RouteComponentProps } from 'react-router-dom';

import Input from 'antd/lib/input';
import Button from 'antd/lib/button';
import Form from 'antd/lib/form';
import Divider from 'antd/lib/divider';

import Rule from '../rules';
import Header from './components/Header';
import type { Rule as RuleType } from '../types';

const FormItem = Form.Item;

type EditParams = { id?: string };

type EditProps = RouteComponentProps<EditParams>;

interface EditState {
  rule: RuleType;
  error?: Partial<Record<keyof RuleType, string>>;
}

export default class EditPage extends Component<EditProps, EditState> {
  state: EditState = {
    rule: {
      id: '',
      from: '',
      to: '',
      cookieName: '',
      enabled: true,
    },
  };

  componentDidMount(): void {
    const { id } = this.props.match.params;
    if (id) {
      Rule.get(id).then((rule) => {
        if (rule && !Array.isArray(rule)) {
          this.setState({ rule });
        }
      });
    }
  }

  /** 校验规则（占位：保留原逻辑） */
  check = (): boolean => true;

  /** 根据字段名取出对应校验错误信息 */
  error = (key: keyof RuleType): string | undefined => {
    return this.state.error && this.state.error[key];
  };

  /** 提交表单：保存规则并跳转回列表页 */
  submit = (): void => {
    if (!this.check()) return;
    const { rule } = this.state;
    Rule.set(rule).then(() => {
      this.props.history.push('/list');
    });
  };

  /** 统一的字段更新处理，避免每个 Input 重复写 setState */
  handleChange =
    (field: keyof Pick<RuleType, 'from' | 'to' | 'cookieName'>) =>
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      const value = e.target.value;
      this.setState((prev) => ({
        rule: { ...prev.rule, [field]: value },
      }));
    };

  render() {
    const { props, state } = this;
    const { rule } = state;

    return (
      <div>
        <Header>
          <Button onClick={props.history.goBack}>&lt;back</Button>
        </Header>
        <Divider style={{ margin: 0 }} />
        <Form className="edit-form">
          <FormItem
            className="edit-form-item"
            validateStatus={this.error('from') ? 'error' : undefined}
            help={this.error('from')}
          >
            <Input
              value={rule.from}
              onChange={this.handleChange('from')}
              placeholder="input cookie from"
            />
          </FormItem>
          <FormItem
            className="edit-form-item"
            validateStatus={this.error('to') ? 'error' : undefined}
            help={this.error('to')}
          >
            <Input
              value={rule.to}
              onChange={this.handleChange('to')}
              placeholder="input cookie to"
            />
          </FormItem>
          <FormItem
            className="edit-form-item"
            validateStatus={this.error('cookieName') ? 'error' : undefined}
            help={this.error('cookieName')}
          >
            <Input
              value={rule.cookieName}
              onChange={this.handleChange('cookieName')}
              placeholder="cookieName"
            />
          </FormItem>
          <Button type="primary" onClick={this.submit}>
            OK
          </Button>
        </Form>
      </div>
    );
  }
}
