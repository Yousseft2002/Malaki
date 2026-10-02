export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Shared branded wrapper. Inline styles only — email clients ignore <style>. */
export function layout(title: string, body: string): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;background:#EDE5D3;color:#0B2A22;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6">
<table role="presentation" width="100%" style="border-collapse:collapse"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" style="max-width:560px;border-collapse:collapse">
<tr><td style="background:#0B3A2E;padding:24px;text-align:center">
<span style="font-family:Georgia,serif;letter-spacing:6px;font-size:22px;color:#C9A24A">MALAKI</span></td></tr>
<tr><td style="background:#F6F1E6;padding:32px 24px">${body}</td></tr>
</table></td></tr></table></body></html>`;
}
