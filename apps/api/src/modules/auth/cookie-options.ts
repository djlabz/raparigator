import type { AppConfig } from "../../config";

export function cookieOptions(config: AppConfig) {
  return {
    useSecureCookies: config.isProduction,
    ...(config.COOKIE_DOMAIN
      ? { crossSubDomainCookies: { enabled: true, domain: config.COOKIE_DOMAIN } }
      : {}),
  };
}
