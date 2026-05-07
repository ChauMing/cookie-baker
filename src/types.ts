// 规则类型定义：描述 Cookie 从 from 域转移至 to 域的单条配置
export interface Rule {
  /** 规则唯一标识，保存时若缺省会以 Date.now() 生成 */
  id: string;
  /** 来源域名（Cookie 读取源） */
  from: string;
  /** 目标域名或 URL 片段（匹配导航 URL 时触发） */
  to: string;
  /** 要同步的 Cookie 名，`*` 表示来源域下的全部 Cookie */
  cookieName: string;
  /** 是否启用 */
  enabled: boolean;
  /** 可选：按原 Cookie 名改写为新名，键为原名，值为新名 */
  rewrite?: Record<string, string>;
}
