/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 417);
/******/ })
/************************************************************************/
/******/ ({

/***/ 417:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


// import _ from 'lodash';
// const rules = [
//   {
//     from: '123.sankuai.com',
//     to: 'localhost',
//     cookieName: '',
//     enabled: true,
//   }
// ]
function unique() {
  var arr = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  var obj = {};
  return arr.filter(function (item) {
    if (obj[item]) return false;
    return obj[item] = true;
  });
}

function getCookie(url, name) {
  return new Promise(function (resolve, reject) {
    chrome.cookies.get({
      url: url,
      name: name
    }, function (cookie) {
      console.log('get cookie: ', cookie);

      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      }

      if (cookie) {
        resolve(cookie);
      } else {
        reject(new Error('cookie noFound'));
      }
    });
  });
}

function getAllCookie(domain) {
  return new Promise(function (resolve, reject) {
    chrome.cookies.getAll({
      domain: domain
    }, function (cookies) {
      if (cookies) {
        return resolve(cookies);
      }

      reject(new Error('cookie 404'));
    });
  });
}

function setCookie(cookie) {
  return new Promise(function (resolve, reject) {
    return [chrome.cookies.set(cookie, function (cookie) {
      if (cookie === null) {
        return reject(chrome.runtime.lastError);
      }

      resolve(cookie);
    })];
  });
}

function getRules() {
  return new Promise(function (resolve, reject) {
    chrome.storage.sync.get(function (_ref) {
      var _ref$rules = _ref.rules,
          rules = _ref$rules === void 0 ? [] : _ref$rules;
      console.log('get rules: ', rules);

      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError);
      }

      return resolve(rules);
    });
  });
}

var handleBeforeNavigate = function handleBeforeNavigate(rules) {
  return function (details) {
    if (rules.every(function (rule) {
      return !details.url.match(rule.to);
    })) {
      return;
    }

    var matchRules = rules.filter(function (rule) {
      return details.url.match(rule.to) && rule.enabled;
    });
    matchRules.length && matchRules.forEach(function (rule) {
      if (rule.cookieName === '*') {
        return getAllCookie(rule.from).then(function (cookies) {
          return cookies.forEach(function (cookie) {
            var c = {
              url: details.url,
              name: rule.rewrite && rule.rewrite[cookie.name] || cookie.name,
              value: cookie.value,
              httpOnly: true,
              path: cookie.path,
              expirationDate: cookie.expirationDate
            };
            setCookie(c).then(console.log).catch(console.error);
          });
        });
      }

      getCookie(rule.from, rule.cookieName).then(function (cookie) {
        var c = {
          url: details.url,
          name: rule.rewrite && rule.rewrite[cookie.name] || cookie.name,
          value: cookie.value,
          httpOnly: true,
          path: cookie.path,
          expirationDate: cookie.expirationDate
        };
        setCookie(c).catch(console.error);
      }).catch(console.error);
    });
  };
};

var listener = null;
getRules().then(function (rules) {
  listener = handleBeforeNavigate(rules);
  chrome.webNavigation.onBeforeNavigate.addListener(listener, {
    url: unique(rules.map(function (rule) {
      return rule.to;
    })).map(function (host) {
      return {
        hostSuffix: host
      };
    })
  });
});
chrome.runtime.onMessage.addListener(function (message) {
  console.log(' receive message: ', message);
  if (message !== 'reloadRules') return;
  chrome.webNavigation.onBeforeNavigate.removeListener(listener);
  getRules().then(function (rules) {
    listener = handleBeforeNavigate(rules);
    chrome.webNavigation.onBeforeNavigate.addListener(listener, {
      url: unique(rules.map(function (rule) {
        return rule.to;
      })).map(function (host) {
        return {
          hostSuffix: host
        };
      })
    });
  });
  return true;
});

/***/ })

/******/ });