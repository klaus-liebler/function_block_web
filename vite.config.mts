import { defineConfig } from 'vite'
// Geteiltes Plugin wie in labathome/sensact: inlined JS+CSS in eine einzige index.html und entfernt
// Leerzeichen (auch in Lit-Templates). Zusaetzlich liegt eine Brotli-Kopie daneben -- als
// index.html.br, damit Webserver sie vorkomprimiert ausliefern koennen (nginx: brotli_static on).
import { singleFileFirmwareAssetPlugin } from "@klaus-liebler/vite-firmware-single-file"
import { execSync } from "node:child_process"
import fs from "node:fs"

// Build-Infos fuer den Footer. Der Editor selbst liegt in npm-packages/@klaus-liebler/flowchart,
// deshalb ist dessen Git-Stand der aussagekraeftige.
function flowchartGitHash(): string {
  try {
    const hash = execSync("git -C ../npm-packages log -1 --format=%h -- @klaus-liebler/flowchart", { encoding: "utf8" }).trim();
    const dirty = execSync("git -C ../npm-packages status --porcelain -- @klaus-liebler/flowchart", { encoding: "utf8" }).trim() !== "";
    return (hash || "uncommitted") + (hash && dirty ? "+local changes" : "");
  } catch {
    return "unknown";
  }
}

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));

export default defineConfig({
  // Relative Asset-Pfade: dist/ laesst sich in ein beliebiges Unterverzeichnis des Webservers kopieren.
  base: "./",
  plugins: [singleFileFirmwareAssetPlugin("index.html.br")],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __FLOWCHART_GIT__: JSON.stringify(flowchartGitHash()),
  },
  resolve: {
    // Die geteilten Pakete sind per file: verlinkt und haben eigene node_modules -- ohne dedupe
    // landeten zwei lit-html-Instanzen im Bundle (Dialoge wuerden mit der falschen gerendert).
    dedupe: ["lit-html"],
  },
  build: {
    outDir: "dist",
    cssCodeSplit: false,
  },
  esbuild: {
    legalComments: 'none',
  },
})
