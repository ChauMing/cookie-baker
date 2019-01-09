import React, { Component } from 'react';
import PropTypes from 'prop-types'
import { 
  Input,
  Button,
} from 'antd';

export default class Rule extends Component {

  state = {
    rule: {
      from: '',
      to: '',
      cookieName: '*',
    }
  }

  static propTypes = {
    rule: PropTypes.shape({
      from: PropTypes.string,
      to: PropTypes.string,
      cookieName: PropTypes.string
    }),
    onDelete: PropTypes.func,
    onSave: PropTypes.func,
  }

  onChange = (key) => (e) => {
    const rule = this.state.rule;
    rule[key] = e.target.value;
    this.setState({ rule });
  }

  onSave = () => {
    this.props.onSave(this.state.rule);
  }
  
  render() {
    this.state.rule = this.props.rule;
    const rule = this.state.rule;

    return (
      <div className="rule-row">
        <Input
          className="rule-input rule-from"
          size="small"
          value={rule.from}
          placeholder="from"
          onChange={this.onChange('from')}
        />
        <Input
          className="rule-input rule-to"
          size="small"
          value={rule.to}
          placeholder="to"
          onChange={this.onChange('to')}
        />
        <Input
          className="rule-input rule-cookieName"
          size="small"
          value={rule.cookieName}
          placeholder="cookieName"
          onChange={this.onChange('cookieName')}
        />
        <Button 
          size="small"
          onClick={this.props.onDelete}
        >
          删除
        </Button>
        <Button 
          size="small"
          onClick={this.onSave}
        >
          保存
        </Button>
      </div>
    )
  }
}