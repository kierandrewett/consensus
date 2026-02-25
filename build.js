// esbuild configuration for bundling
import { build, context } from "esbuild";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from "fs";
import { cp, rmdir } from "fs/promises";
import { join } from "path";

const isWatch = process.argv.includes("--watch");

// Server bundle options
const serverBuildOptions = {
    entryPoints: ["./src/index.ts", "./src/seed.ts"],
    bundle: true,
    platform: "node",
    outdir: "./dist",
    sourcemap: true,
    loader: {
        ".html": "text",
    },
    format: "esm",
    external: [
        "better-sqlite3",
        "@fastify/cookie",
        "@mapbox/node-pre-gyp",
        "mock-aws-s3",
        "aws-sdk",
        "nock",
        "bcrypt",
        "fs",
    ],
    banner: {
        js: `import { createRequire } from 'module';\nconst require = createRequire(import.meta.url);\nconst __dirname = require("path").dirname(require("url").fileURLToPath(import.meta.url));`,
    },
};

// Client-side bundle options
const clientBuildOptions = {
    entryPoints: [
        "./src/web/client/index.ts",
        "./src/web/client/lucide.ts",
        "./src/web/client/admin.ts",
        "./src/web/client/voting.ts",
        "./src/web/client/register.ts",
        "./src/web/client/countdown.ts",
        "./src/web/client/admin-results.ts",
        "./src/web/client/admin-voters.ts",
        "./src/web/client/admin-elections.ts",
    ],
    bundle: true,
    minify: true,
    sourcemap: true,
    outdir: "./dist/public/js",
    format: "iife",
    target: "es2020",
    platform: "browser",
};

// CSS bundle options
const cssBuildOptions = {
    entryPoints: ["./src/web/styles/index.css"],
    bundle: true,
    minify: true,
    outfile: "./dist/public/css/styles.css",
};

// Copy package.json to dist for native modules
function copyPackageJson() {
    try {
        mkdirSync("./dist", { recursive: true });
        copyFileSync("./package.json", "./dist/package.json");
        console.log("Copied package.json to dist/");
    } catch (err) {
        console.error("Failed to copy package.json:", err);
    }
}

function copyStaticAssets() {
    return Promise.all([
        cp("./src/web/public", "./dist/public", { recursive: true }),
        cp("./src/web/views", "./dist/views", { recursive: true }),
        cp("./src/db/migrations", "./dist/migrations", { recursive: true }),
    ]);
}

// Build both server and client
async function buildAll() {
    try {
        await copyStaticAssets();

        await build(clientBuildOptions);
        console.log("Client-side JavaScript bundled");

        await build(cssBuildOptions);
        console.log("CSS bundled and minified");

        // Build server
        await build(serverBuildOptions);
        copyPackageJson();
        console.log("Server bundle complete");
    } catch (err) {
        console.error("Build failed:", err);
        process.exit(1);
    }
}

if (isWatch) {
    copyPackageJson();
    copyStaticAssets();

    Promise.all([
        context(serverBuildOptions).then((ctx) => ctx.watch()),
        context(clientBuildOptions).then((ctx) => ctx.watch()),
        context(cssBuildOptions).then((ctx) => ctx.watch()),
    ])
        .then(() => {
            console.log("Watching for changes (server + client + css)...");
        })
        .catch(() => process.exit(1));
} else {
    buildAll();
}
