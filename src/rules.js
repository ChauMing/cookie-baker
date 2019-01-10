import { getRules, setRules } from './utils/rules';

let cacheRules = [];

getRules().then(rules => {
  cacheRules = rules;
});

export default {
  get: (id) => getRules().then((rules) => {
    cacheRules = rules;
    if(id) {
      for (let i = 0; i < rules.length; i++) {
        const rule = rules[i];
        if(rule.id === id) {
          return rule;
        }
      }
    }
    return rules;
  }),
  set: (rule) => {
    let rules = [];

    if(rule instanceof Array) {
      rules = rule;
    } else {
      if(rule.id) {
        for (let i = 0; i < cacheRules.length; i++) {
          const r = cacheRules[i];

          if(r.id === rule.id) {
            cacheRules[i] =  Object.assign({}, r , rule);
            break;
          }
        }
      } else {
        rule.id = Date.now().toString(36);
        cacheRules.unshift(rule);
      }
      rules = cacheRules;
    }

    return new Promise((resolve, reject) => {
      setRules(rules).then(() => {
        chrome.runtime.sendMessage('reloadRules', () => {
          if(chrome.runtime.lastError) {
            return reject(chrome.runtime.lastError)
          }
          resolve(rules);
        });
      });
    });


  },
  del: (id) => {
    return setRules(cacheRules.filter(r => r.id !== id))
  }
}
