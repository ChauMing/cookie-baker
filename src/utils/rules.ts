// chrome.storage.sync 读写规则的底层封装
import type { Rule } from '../types';

/** 从 chrome.storage.sync 读取规则列表 */
export const getRules = (): Promise<Rule[]> => {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(({ rules = [] }: { rules?: Rule[] }) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }
      resolve(rules);
    });
  });
};

/** 将规则列表写入 chrome.storage.sync */
export const setRules = (rules: Rule[]): Promise<Rule[]> => {
  return new Promise((resolve, reject) => {
    if (!Array.isArray(rules)) {
      reject(new Error('rules must be an array'));
      return;
    }
    chrome.storage.sync.set({ rules }, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }
      resolve(rules);
    });
  });
};
