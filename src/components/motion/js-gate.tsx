/**
 * Inline script that marks <html data-js> before first paint. Reveal styles
 * only hide content under [data-js], so the site stays fully visible if
 * JavaScript is unavailable.
 */
export function JsGate() {
  return <script dangerouslySetInnerHTML={{ __html: "document.documentElement.setAttribute('data-js','')" }} />;
}
