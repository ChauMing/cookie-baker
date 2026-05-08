// MV3 Service Worker：根据规则在导航前把 Cookie 从 from 域复制到 to 域，
// 并在 to 页面加载完成后把 from 域的 localStorage 同步过去。
import type { Rule, ReadStorageResponse } from "./types";
import { parseEndpoint, isUrlMatchRule } from "./utils/url";

/** 统一日志前缀，便于在 devtools 筛选 */
const LOG_PREFIX = "[cookie-baker]";
const log = (...args: unknown[]): void => console.log(LOG_PREFIX, ...args);
const warn = (...args: unknown[]): void => console.warn(LOG_PREFIX, ...args);
const error = (...args: unknown[]): void => console.error(LOG_PREFIX, ...args);

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
      if (cookie) resolve(cookie);
      else reject(new Error("cookie notFound"));
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
      reject(new Error("cookie 404"));
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

/** 解析 storageKeys 字段：`*` 返回通配，空串/undefined 返回 null 表示不同步 */
function parseStorageKeys(raw?: string): string[] | "*" | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed === "*") return "*";
  return trimmed
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
}

/** 等待某个 tab 完成加载（status === 'complete'），带超时 */
function waitForTabComplete(tabId: number, timeoutMs = 15000): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      reject(new Error("waitForTabComplete timeout"));
    }, timeoutMs);

    const listener = (
      updatedTabId: number,
      info: chrome.tabs.TabChangeInfo,
    ) => {
      if (updatedTabId === tabId && info.status === "complete") {
        clearTimeout(timer);
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };
    chrome.tabs.onUpdated.addListener(listener);
  });
}

/** 向指定 tab 发送消息，Promise 封装 */
function sendMessageToTab<T>(tabId: number, message: unknown): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }
      resolve(response as T);
    });
  });
}

/**
 * 通过后台打开隐藏 tab 的方式读取 from 域的 localStorage。
 * 完成后关闭临时 tab。
 */
async function readLocalStorageFromSource(
  fromUrl: string,
  keys: string[] | "*",
): Promise<ReadStorageResponse> {
  const tab = await new Promise<chrome.tabs.Tab>((resolve, reject) => {
    chrome.tabs.create({ url: fromUrl, active: false }, (t) => {
      if (chrome.runtime.lastError || !t?.id) {
        reject(chrome.runtime.lastError || new Error("create tab failed"));
        return;
      }
      resolve(t);
    });
  });

  const tabId = tab.id!;
  try {
    await waitForTabComplete(tabId);
    const res = await sendMessageToTab<{
      ok: boolean;
      data?: ReadStorageResponse;
      error?: string;
    }>(tabId, { type: "readStorage", keys });
    if (!res?.ok) throw new Error(res?.error || "readStorage failed");
    return res.data || {};
  } finally {
    chrome.tabs.remove(tabId).catch(() => undefined);
  }
}

/** 将 localStorage 写入指定目标 tab */
async function writeLocalStorageToTarget(
  tabId: number,
  data: ReadStorageResponse,
): Promise<void> {
  if (Object.keys(data).length === 0) return;
  await sendMessageToTab<{ ok: boolean; error?: string }>(tabId, {
    type: "writeStorage",
    data,
  });
}

/** 同步 Cookie：按规则将 from 域的 Cookie 写到目标 URL */
async function syncCookies(targetUrl: string, rule: Rule): Promise<void> {
  if (!rule.cookieName) return;
  const fromParsed = parseEndpoint(rule.from);
  if (!fromParsed) {
    error("invalid rule.from:", rule.from);
    return;
  }
  try {
    if (rule.cookieName === "*") {
      // 使用解析出的 host 作为 domain；为兼容带点前缀的 Cookie，直接传裸 host 即可
      const cookies = await getAllCookie(fromParsed.host);
      log(
        `sync cookies (*) from=${fromParsed.host} -> ${targetUrl}, count=${cookies.length}`,
        cookies.map((c) => ({
          name: c.name,
          domain: c.domain,
          value: c.value,
        })),
      );
      await Promise.all(
        cookies.map((c) =>
          setCookie(buildCookieDetails(targetUrl, c, rule)).catch((e) =>
            error("setCookie failed:", c.name, e),
          ),
        ),
      );
      log(`cookies written to ${targetUrl}, count=${cookies.length}`);
      return;
    }
    // 单条 Cookie 使用解析出的完整 URL 作为 get 入参
    const cookie = await getCookie(fromParsed.url, rule.cookieName);
    log(
      `sync cookie name=${rule.cookieName} from=${fromParsed.url} -> ${targetUrl}`,
      { name: cookie.name, domain: cookie.domain, value: cookie.value },
    );
    await setCookie(buildCookieDetails(targetUrl, cookie, rule));
    log(`cookie "${cookie.name}" written to ${targetUrl}`);
  } catch (e) {
    error("syncCookies error:", e);
  }
}

/**
 * 同步 localStorage：打开 from 临时 tab 读取，待 to tab 加载完成后写入。
 * tabId 为触发导航的目标 tab。
 */
async function syncLocalStorage(tabId: number, rule: Rule): Promise<void> {
  const keys = parseStorageKeys(rule.storageKeys);
  if (!keys) return;

  const fromParsed = parseEndpoint(rule.from);
  if (!fromParsed) {
    error("invalid rule.from for storage:", rule.from);
    return;
  }

  try {
    log(
      `sync localStorage from=${fromParsed.url} -> tabId=${tabId}, keys=`,
      keys,
    );
    // 并行：读取 from localStorage；等待 to 页面加载完成
    const [data] = await Promise.all([
      readLocalStorageFromSource(fromParsed.url, keys),
      waitForTabComplete(tabId).catch((e) => {
        warn("waitForTabComplete target tab:", e);
        return undefined;
      }),
    ]);
    const entries = Object.entries(data);
    log(
      `read localStorage from ${fromParsed.url}, count=${entries.length}`,
      entries.reduce<Record<string, string>>((acc, [k, v]) => {
        // 避免日志过长，value 截断到 200 字符
        acc[k] = v.length > 200 ? `${v.slice(0, 200)}... (len=${v.length})` : v;
        return acc;
      }, {}),
    );
    await writeLocalStorageToTarget(tabId, data);
    log(`localStorage written to tabId=${tabId}, count=${entries.length}`);
  } catch (e) {
    error("syncLocalStorage error:", e);
  }
}

/** 构造 webNavigation.onBeforeNavigate 的监听函数 */
const handleBeforeNavigate =
  (rules: Rule[]) =>
  (
    details: chrome.webNavigation.WebNavigationParentedCallbackDetails,
  ): void => {
    // 只处理主 frame
    if (details.frameId !== 0) return;

    const matchRules = rules.filter(
      (rule) => isUrlMatchRule(details.url, rule.to) && rule.enabled,
    );
    if (matchRules.length === 0) return;

    log(
      `navigate matched: url=${details.url}, tabId=${details.tabId}, rules=`,
      matchRules.map((r) => ({
        from: r.from,
        to: r.to,
        cookieName: r.cookieName,
        storageKeys: r.storageKeys,
      })),
    );

    matchRules.forEach((rule) => {
      // Cookie 同步（同步 API 执行）
      syncCookies(details.url, rule);
      // localStorage 同步（需要等待 tab 完成加载）
      if (rule.storageKeys && details.tabId >= 0) {
        syncLocalStorage(details.tabId, rule);
      }
    });
  };

type NavigationListener = ReturnType<typeof handleBeforeNavigate>;

let listener: NavigationListener | null = null;

/**
 * 注册导航监听器：仅对规则中 to 域的 hostSuffix 生效。
 * 这里对每条规则解析出 host，失败的规则不参与过滤（退化为不触发）。
 */
function registerListener(rules: Rule[]): void {
  listener = handleBeforeNavigate(rules);
  const hosts = unique(
    rules
      .map((rule) => parseEndpoint(rule.to)?.host)
      .filter((host): host is string => Boolean(host)),
  );
  chrome.webNavigation.onBeforeNavigate.addListener(listener, {
    url: hosts.map((host) => ({ hostSuffix: host })),
  });
  log(
    `listener registered: rules=${rules.length}, enabled=${rules.filter((r) => r.enabled).length}, hosts=`,
    hosts,
  );
}

// 初次启动时根据已保存规则注册监听器
getRules()
  .then((rules) => {
    log(`bootstrap with ${rules.length} rule(s)`);
    registerListener(rules);
  })
  .catch((e) => error("bootstrap failed:", e));

// popup 修改规则后发送 'reloadRules' 消息，收到后重新注册监听器
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message !== "reloadRules") return;

  log("reloadRules received, re-registering listener");
  if (listener) {
    chrome.webNavigation.onBeforeNavigate.removeListener(listener);
    listener = null;
  }

  getRules()
    .then((rules) => {
      registerListener(rules);
      sendResponse("success");
    })
    .catch((e) => {
      error("reloadRules failed:", e);
      sendResponse("error");
    });

  // 返回 true 以保持异步 sendResponse 通道
  return true;
});
