// 规则业务层：封装规则的增删改查并通知 background 刷新监听器
import type { Rule } from './types';
import { getRules, setRules } from './utils/rules';

/** 通知 background 重新加载规则 */
const notifyReload = (): Promise<void> =>
  new Promise((resolve, reject) => {
    chrome.runtime.sendMessage('reloadRules', () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }
      resolve();
    });
  });

/** 规则内存缓存，用于编辑时合并回写 */
let cacheRules: Rule[] = [];

// 启动时拉取一次用于缓存
getRules()
  .then((rules) => {
    cacheRules = rules;
  })
  .catch(() => {
    cacheRules = [];
  });

export default {
  /** 查询规则：传入 id 返回单条，否则返回全量列表 */
  get(id?: string): Promise<Rule | Rule[] | undefined> {
    return getRules().then((rules) => {
      cacheRules = rules;
      if (id) {
        return rules.find((r) => r.id === id);
      }
      return rules;
    });
  },

  /** 新增/更新规则：支持单条或整表覆盖 */
  set(rule: Rule | Rule[]): Promise<Rule[]> {
    let rules: Rule[] = [];

    if (Array.isArray(rule)) {
      rules = rule;
    } else {
      if (rule.id) {
        // 更新已有规则
        for (let i = 0; i < cacheRules.length; i++) {
          if (cacheRules[i].id === rule.id) {
            cacheRules[i] = { ...cacheRules[i], ...rule };
            break;
          }
        }
      } else {
        // 新建规则：以时间戳生成 id，并置顶插入
        rule.id = Date.now().toString(36);
        cacheRules.unshift(rule);
      }
      rules = cacheRules;
    }

    return setRules(rules).then(async () => {
      await notifyReload();
      return rules;
    });
  },

  /** 删除规则：按 id 过滤后写回并通知 background 刷新 */
  del(id: string): Promise<Rule[]> {
    const next = cacheRules.filter((r) => r.id !== id);
    cacheRules = next;
    return setRules(next).then(async () => {
      await notifyReload();
      return next;
    });
  },
};
