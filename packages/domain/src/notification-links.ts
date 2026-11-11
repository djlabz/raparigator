import type { AccountNotificationItem } from "@sigillus/contracts";

export const DEFAULT_NOTIFICATION_HREF = "/conta#profile-workflow";

export function notificationHref(notification: Pick<AccountNotificationItem, "href">): string {
  return notification.href ?? DEFAULT_NOTIFICATION_HREF;
}
