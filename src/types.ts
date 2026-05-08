// 规则类型定义：描述 Cookie / localStorage 从 from 域转移至 to 域的单条配置
export interface Rule {
  /** 规则唯一标识，保存时若缺省会以 Date.now() 生成 */
  id: string;
  /** 来源域名（Cookie/localStorage 读取源，需能通过 http(s)://<from> 访问） */
  from: string;
  /** 目标域名或 URL 片段（匹配导航 URL 时触发） */
  to: string;
  /** 要同步的 Cookie 名，`*` 表示来源域下的全部 Cookie，留空表示不同步 Cookie */
  cookieName: string;
  /** 要同步的 localStorage key，逗号分隔，`*` 表示全部；留空表示不同步 localStorage */
  storageKeys?: string;
  /** 是否启用 */
  enabled: boolean;
  /** 可选：按原 Cookie 名改写为新名，键为原名，值为新名 */
  rewrite?: Record<string, string>;
}

/** content script 与 background 之间的消息协议 */
export type StorageMessage =
  | { type: 'readStorage'; keys: string[] | '*' }
  | { type: 'writeStorage'; data: Record<string, string> };

/** readStorage 的响应：key -> value 字典 */
export type ReadStorageResponse = Record<string, string>;
