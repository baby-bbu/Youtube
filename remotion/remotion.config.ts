import { existsSync } from 'node:fs';
import { Config } from '@remotion/cli/config';

// In sandboxed environments Remotion cannot download its own browser. It also needs
// a headless-shell binary (full Chromium no longer supports the old headless mode).
// Set REMOTION_BROWSER=/path/to/headless_shell, or rely on the Playwright copy below.
const PLAYWRIGHT_HEADLESS_SHELL =
  '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';

const browser =
  process.env.REMOTION_BROWSER ??
  (existsSync(PLAYWRIGHT_HEADLESS_SHELL) ? PLAYWRIGHT_HEADLESS_SHELL : undefined);

if (browser) {
  Config.setBrowserExecutable(browser);
}
