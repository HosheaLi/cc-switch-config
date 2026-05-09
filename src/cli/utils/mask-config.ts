/**
 * 共享配置脱敏工具
 *
 * 对 settings.json 中的 ANTHROPIC_AUTH_TOKEN 进行脱敏后再渲染 diff。
 */

import { maskApiKey } from '../../lib/security/api-key.js';

/**
 * 脱敏配置对象中的 API key，用于 diff 展示。
 * 仅处理 ANTHROPIC_AUTH_TOKEN，其他字段透传。
 */
export function maskApiKeyInConfig<T extends Record<string, unknown>>(config: T): T {
  if (!config.env || typeof config.env !== 'object') return config;

  const env = config.env as Record<string, string>;
  if (env.ANTHROPIC_AUTH_TOKEN) {
    return {
      ...config,
      env: { ...env, ANTHROPIC_AUTH_TOKEN: maskApiKey(env.ANTHROPIC_AUTH_TOKEN) },
    };
  }
  return config;
}
