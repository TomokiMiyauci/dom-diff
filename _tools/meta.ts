import { BuildOptions } from "https://deno.land/x/dnt@0.38.0/mod.ts";

export const makeOptions = (version: string): BuildOptions => ({
  test: false,
  shims: {},
  compilerOptions: {
    lib: ["ESNext"],
  },
  typeCheck: "both",
  entryPoints: ["./mod.ts"],
  outDir: "./npm",
  package: {
    name: "dom-diff",
    version,
    description: "The real DOM diffing",
    keywords: [
      "dom",
      "diff",
      "diffing",
      "diff-patch",
      "patch",
      "reconciler",
    ],
    license: "MIT",
    homepage: "https://github.com/TomokiMiyauci/dom-diff",
    repository: {
      type: "git",
      url: "git+https://github.com/TomokiMiyauci/dom-diff.git",
    },
    bugs: {
      url: "https://github.com/TomokiMiyauci/dom-diff/issues",
    },
    sideEffects: false,
    type: "module",
  },
  packageManager: "pnpm",
});
