export const USER_FRIENDLY_ERROR_MESSAGE =
  "Something went wrong. Please try again.";

/** Maps any error to a short, user-safe message. Log the original separately. */
export function toUserFriendlyError(_error?: unknown): string {
  return USER_FRIENDLY_ERROR_MESSAGE;
}
