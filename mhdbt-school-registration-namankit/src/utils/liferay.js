export function getCsrfToken() {
  return window.Liferay?.authToken || "";
}
