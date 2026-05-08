// 内容脚本：注入所有页面，提供读写当前 origin 下 localStorage 的能力
import type { StorageMessage, ReadStorageResponse } from './types';

/** 读取 localStorage：keys === '*' 时返回全部；否则按 keys 列表读取 */
function readStorage(keys: string[] | '*'): ReadStorageResponse {
  const result: ReadStorageResponse = {};
  if (keys === '*') {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key != null) {
        const value = localStorage.getItem(key);
        if (value != null) {
          result[key] = value;
        }
      }
    }
    return result;
  }
  keys.forEach((key) => {
    const value = localStorage.getItem(key);
    if (value != null) {
      result[key] = value;
    }
  });
  return result;
}

/** 批量写入 localStorage */
function writeStorage(data: Record<string, string>): void {
  Object.entries(data).forEach(([key, value]) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      // 单个写入失败不影响其他 key
      console.error('[cookie-baker] writeStorage failed:', key, e);
    }
  });
}

// 监听 background 发来的消息
chrome.runtime.onMessage.addListener(
  (message: StorageMessage, _sender, sendResponse) => {
    try {
      if (message.type === 'readStorage') {
        sendResponse({ ok: true, data: readStorage(message.keys) });
        return;
      }
      if (message.type === 'writeStorage') {
        writeStorage(message.data);
        sendResponse({ ok: true });
        return;
      }
    } catch (e) {
      sendResponse({ ok: false, error: String(e) });
    }
  },
);
