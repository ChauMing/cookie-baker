// import _ from 'lodash';
// const rules = [
//   {
//     from: '123.sankuai.com',
//     to: 'localhost',
//     cookieName: '',
//     enabled: true,
//   }
// ]

function unique(arr = []) {
  let obj = {};
  return arr.filter(item => {
    if(obj[item]) return false;
    return obj[item] = true;
  })
}

function getCookie(url, name) {
  return new Promise((resolve, reject) => {
    chrome.cookies.get({ url, name }, function (cookie) {
      console.log('get cookie: ', cookie);
      if(chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      }
      if(cookie) {
        resolve(cookie);
      } else {
        reject(new Error('cookie noFound'));
      }
    })
  })
}

function getAllCookie(domain) {
  return new Promise((resolve, reject) => {
    chrome.cookies.getAll({domain}, function (cookies) {
      if(cookies) {
        return resolve(cookies);
      }
      reject(new Error('cookie 404'));
    })
  })
}

function setCookie(cookie) {
  return new Promise((resolve, reject) => [
    chrome.cookies.set(cookie, function (cookie) {
      if(cookie === null) {
        return reject(chrome.runtime.lastError)
      }
      resolve(cookie);
    })
  ])
}


function getRules() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(function ({ rules = [] }) {
      console.log('get rules: ', rules);
      if(chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError);
      }
      return resolve(rules);
    });
  })

}

const handleBeforeNavigate = (rules) => (details) => {

  if(rules.every(rule => !details.url.match(rule.to))) {
    return;
  }

  const matchRules = rules.filter(rule => details.url.match(rule.to) && rule.enabled);

  matchRules.length && matchRules.forEach(rule => {
    if(rule.cookieName === '*') {
      return getAllCookie(rule.from).then(cookies => cookies.forEach(cookie => {
        const c = {
          url: details.url,
          name: rule.rewrite && rule.rewrite[cookie.name] || cookie.name,
          value: cookie.value,
          httpOnly: true,
          path: cookie.path,
          expirationDate: cookie.expirationDate,
        };
        setCookie(c).then(console.log).catch(console.error);
    }))
    }
    getCookie(rule.from, rule.cookieName)
      .then(cookie => {
          const c = {
            url: details.url,
            name: rule.rewrite && rule.rewrite[cookie.name] || cookie.name,
            value: cookie.value,
            httpOnly: true,
            path: cookie.path,
            expirationDate: cookie.expirationDate,
          };
          setCookie(c).catch(console.error);
        })
      .catch(console.error);
  });
}

let listener = null;


getRules().then((rules) => {
  listener = handleBeforeNavigate(rules);
  chrome.webNavigation.onBeforeNavigate.addListener(
    listener,
    {
      url: unique(rules.map(rule => rule.to)).map(host => ({ hostSuffix: host }))
    }
  );
})



chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  console.log(' receive message: ', message);
  if(message !== 'reloadRules') return;
  chrome.webNavigation.onBeforeNavigate.removeListener(listener);
  getRules().then((rules) => {
    sendResponse('success')
    listener = handleBeforeNavigate(rules);
    chrome.webNavigation.onBeforeNavigate.addListener(
      listener,
      {
        url: unique(rules.map(rule => rule.to)).map(host => ({ hostSuffix: host }))
      }
    );
  }).catch((e) => {
    console.error(e);
    sendResponse('error')
  });
  return true;
})
