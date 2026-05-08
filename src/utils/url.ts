// 统一的 URL 解析工具：允许用户在 from/to 字段里直接粘贴完整 URL，
// 也兼容只填域名或 `host/path` 的旧写法。
//
// 下游（Cookie/webNavigation 过滤/localStorage 注入）对格式要求不同：
//   - chrome.cookies.get/set 需要完整 URL
//   - chrome.cookies.getAll 需要 domain
//   - webNavigation 监听需要 hostSuffix（host，不含端口）
//   - hostSuffix 匹配也可以用于判断 URL 是否命中某条规则
// 因此这里把解析结果一次性拆好，供各处按需取用。

export interface ParsedEndpoint {
  /** 规范化后的完整 URL，用于 chrome.cookies / chrome.tabs.create */
  url: string;
  /** URL 的 origin（协议 + host + port），用于 localStorage 同 origin 判断 */
  origin: string;
  /** 主机名（不含端口），用于 chrome.cookies.getAll 与 hostSuffix 匹配 */
  host: string;
  /** 路径（不含 query/hash），当用户填了路径时保留，供 Cookie 的 path 使用 */
  path: string;
  /** 原始输入值，未能成功解析时用于兜底 */
  raw: string;
}

/**
 * 解析 from/to 字段。支持以下输入形式：
 *   - `https://a.example.com/path`
 *   - `http://localhost:3000`
 *   - `passport.example.com`
 *   - `passport.example.com/login`
 * 解析失败时返回 null，调用方按需兜底。
 */
export function parseEndpoint(raw: string): ParsedEndpoint | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // 若未带协议则默认补 https，方便 URL 构造函数解析
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const u = new URL(candidate);
    return {
      url: u.toString(),
      origin: u.origin,
      host: u.hostname,
      path: u.pathname || '/',
      raw,
    };
  } catch {
    return null;
  }
}

/** 判断导航 URL 是否命中规则：优先按 host 匹配，其次回落到原字符串包含 */
export function isUrlMatchRule(navUrl: string, ruleTo: string): boolean {
  const parsed = parseEndpoint(ruleTo);
  if (parsed) {
    try {
      const nav = new URL(navUrl);
      // host 严格相等或以 ruleHost 结尾（支持子域通配）
      if (nav.hostname === parsed.host) return true;
      if (nav.hostname.endsWith(`.${parsed.host}`)) return true;
      // 若规则里带了 path，则要求导航 URL 的 path 以其开头
      if (parsed.path && parsed.path !== '/') {
        return (
          (nav.hostname === parsed.host ||
            nav.hostname.endsWith(`.${parsed.host}`)) &&
          nav.pathname.startsWith(parsed.path)
        );
      }
      return false;
    } catch {
      return false;
    }
  }
  // 解析失败走原字符串 match 兜底
  return !!navUrl.match(ruleTo);
}
