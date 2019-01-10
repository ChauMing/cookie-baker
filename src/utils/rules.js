export const getRules = () => {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(({ rules = [] }) => {
      if(chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError)
      }
      resolve(rules);
    })
  })
}

export const setRules = (rules) => {
  return new Promise((resolve, reject) => {
    if(!rules instanceof Array) {
      return reject(new Error('rules must a array'))
    }
    return chrome.storage.sync.set({ rules }, function () {
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError)
      }
      return resolve(rules);
    });
  });
}
