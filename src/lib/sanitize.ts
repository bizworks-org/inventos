// Small HTML escaping helper to prevent HTML injection when inserting
// untrusted content into HTML email bodies or templates.
export function escapeHtml(input: string): string {
  let result = String(input);
  result = result.split("&").join("&amp;");
  result = result.split("<").join("&lt;");
  result = result.split(">").join("&gt;");
  result = result.split('"').join("&quot;");
  result = result.split("'").join("&#39;");
  return result;
}
