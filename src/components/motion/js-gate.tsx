/**
 * Inline script for the root layout (next/script, strategy "beforeInteractive")
 * that marks <html data-js> before hydration. Reveal styles only hide content
 * under [data-js], so the site stays fully visible without JavaScript.
 */
export const JS_GATE_SCRIPT = "document.documentElement.setAttribute('data-js','')";
