// MV3 Service Worker：根据规则在导航前把 Cookie 从 from 域复制到 to 域
import type { Rule } from './types';

/** 数组去重：基于字符串键保留首次出现的元素 */
function unique(arr: string[] = []): string[] {
  const seen: Record<string, boolean> = {};
  return arr.filter((item) => {
    if (seen[item]) return false;
    seen[item] = true;
    return true;
  });
}

/** 读取单条 Cookie */
function getCookie(url: string, name: string): Promise<chrome.cookies.Cookie> {
  return new Promise((resolve, reject) => {
    chrome.cookies.get({ url, name }, (cookie) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }
      if (cookie) {
        resolve(cookie);
      } else {
        reject(new Error('cookie notFound'));
      }
    });
  });
}

/** 读取指定域下所有 Cookie */
function getAllCookie(domain: string): Promise<chrome.cookies.Cookie[]> {
  return new Promise((resolve, reject) => {
    chrome.cookies.getAll({ domain }, (cookies) => {
      if (cookies) {
        resolve(cookies);
        return;
      }
      reject(new Error('cookie 404'));
    });
  });
}

/** 写入单条 Cookie */
function setCookie(
  cookie: chrome.cookies.SetDetails,
): Promise<chrome.cookies.Cookie | null> {
  return new Promise((resolve, reject) => {
    chrome.cookies.set(cookie, (result) => {
      if (result === null) {
        reject(chrome.runtime.lastError);
        return;
      }
      resolve(result);
    });
  });
}

/** 从 chrome.storage.sync 读取规则列表 */
function getRules(): Promise<Rule[]> {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(({ rules = [] }: { rules?: Rule[] }) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }
      resolve(rules);
    });
  });
}

/** 根据源 Cookie 与规则构造一条待写入的 Cookie 详情 */
function buildCookieDetails(
  targetUrl: string,
  cookie: chrome.cookies.Cookie,
  rule: Rule,
): chrome.cookies.SetDetails {
  return {
    url: targetUrl,
    name: (rule.rewrite && rule.rewrite[cookie.name]) || cookie.name,
    value: cookie.value,
    // 保留原 Cookie 的 httpOnly 属性，避免覆盖导致前端无法读取
    httpOnly: cookie.httpOnly,
    path: cookie.path,
    expirationDate: cookie.expirationDate,
  };
}

/** 构造 webNavigation.onBeforeNavigate 的监听函数 */
const handleBeforeNavigate =
  (rules: Rule[]) =>
  (details: chrome.webNavigation.WebNavigationParentedCallbackDetails): void => {
    if (rules.every((rule) => !details.url.match(rule.to))) {
      return;
    }

    const matchRules = rules.filter(
      (rule) => details.url.match(rule.to) && rule.enabled,
    );

    matchRules.forEach((rule) => {
      // 通配：将来源域所有 Cookie 全量同步
      if (rule.cookieName === '*') {
        getAllCookie(rule.from)
          .then((cookies) => {
            cookies.forEach((cookie) => {
              setCookie(buildCookieDetails(details.url, cookie, rule)).catch(
                console.error,
              );
            });
          })
          .catch(console.error);
        return;
      }

      // 单条 Cookie 同步
      getCookie(rule.from, rule.cookieName)
        .then((cookie) => {
          return setCookie(buildCookieDetails(details.url, cookie, rule));
        })
        .catch(console.error);
    });
  };

type NavigationListener = ReturnType<typeof handleBeforeNavigate>;

let listener: NavigationListener | null = null;

/** 注册导航监听器：仅对规则中 to 域的 hostSuffix 生效 */
function registerListener(rules: Rule[]): void {
  listener = handleBeforeNavigate(rules);
  chrome.webNavigation.onBeforeNavigate.addListener(listener, {
    url: unique(rules.map((rule) => rule.to)).map((host) => ({ hostSuffix: host })),
  });
}

// 初次启动时根据已保存规则注册监听器
getRules()
  .then((rules) => {
    registerListener(rules);
  })
  .catch(console.error);

// popup 修改规则后发送 'reloadRules' 消息，收到后重新注册监听器
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message !== 'reloadRules') return;

  if (listener) {
    chrome.webNavigation.onBeforeNavigate.removeListener(listener);
    listener = null;
  }

  getRules()
    .then((rules) => {
      registerListener(rules);
      sendResponse('success');
    })
    .catch((e) => {
      console.error(e);
      sendResponse('error');
    });

  // 返回 true 以保持异步 sendResponse 通道
  return true;
});
