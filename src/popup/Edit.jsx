import React, { Component } from 'react';
import { Link } from 'react-router-dom'

import Input from 'antd/lib/input';
import Button from 'antd/lib/button';
import Form from 'antd/lib/form';
import Divider from 'antd/lib/divider';

import Rule from '../rules';
import Header from './components/Header';
const FormItem = Form.Item;

export default class App extends Component {
  state = {
    rule: {
      id: '',
      from: '',
      to: '',
      cookieName: '',
      enabled: true,
    },
  }

  componentDidMount = () => {
    const { id } = this.props.match.params;
    if(id) {
      Rule.get(id).then(rule => {
        this.setState({rule})
      });
    }
  };

  check = () => {
    return true;
  }

  error = (key) => {
    return this.state.error && this.state.error[key];
  }

  submit = () => {
    if(!this.check()) {
      return;
    }
    const { rule } = this.state;
    Rule.set(rule).then(() => {
      this.props.history.push('/list');
    });
  }

  render() {
    const { props, state } = this;
    const { rule } = state;

    return (
      <div>
        <Header>
          <Button
            onClick={props.history.goBack}
          >&lt;back</Button>
        </Header>
        <Divider style={{margin: 0}} />
        <Form className="edit-form">
          <FormItem
            className="edit-form-item"
            validateStatus={this.error('from')}
            help={this.error('from')}>
            <Input
              value={state.rule.from}
              onChange={e => {
                const from = e.target.value;
                console.log(from);

                this.setState({
                  rule: {
                    ...rule,
                    from
                  }
                })
              }}
              placeholder="input cookie from"
            />
          </FormItem>
          <FormItem
            className="edit-form-item"
            validateStatus={this.error('to')}
            help={this.error('to')}>
            <Input
              value={state.rule.to}
              onChange={e => {
                const to = e.target.value;
                this.setState({
                  rule: {
                    ...rule,
                    to
                  }
                })
              }}
              placeholder="input cookie to"
            />
          </FormItem>
          <FormItem
            className="edit-form-item"
            validateStatus={this.error('cookieName')}
            help={this.error('cookieName')}>
            <Input
              value={state.rule.cookieName}
              onChange={e => {
                const cookieName = e.target.value;
                this.setState({
                  rule: {
                    ...rule,
                    cookieName
                  }
                })
              }}
              placeholder="cookieName"
            />
          </FormItem>
          <Button type="primary" onClick={this.submit}>OK</Button>
        </Form>
      </div>
    )
  }
}

