// scripts/packageBackend.js
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const root = process.cwd();
const staging = path.join(root, ".deploy-staging");
const zipFile = path.join(root, "robago-backend-deploy.zip");

console.log("📦 Preparing Robago Backend package for Hostinger...");

// 1. Clean previous staging & zip
fs.rmSync(staging, { recursive: true, force: true });
fs.rmSync(zipFile, { force: true });

// 2. Build shared first
console.log("🔨 Building @robago/shared...");
execSync("pnpm --filter @robago/shared run build", { stdio: "inherit" });

// 3. Create staging directory
fs.mkdirSync(path.join(staging, "apps"), { recursive: true });
fs.mkdirSync(path.join(staging, "packages"), { recursive: true });

// 4. Copy packages/shared and apps/backend
console.log("📂 Copying workspace packages...");
execSync(`cp -r packages/shared "${path.join(staging, "packages")}"`);
execSync(`cp -r apps/backend "${path.join(staging, "apps")}"`);

// Clean node_modules, dist, and .tsbuildinfo inside staging
execSync(`rm -rf "${path.join(staging, "packages/shared/node_modules")}" "${path.join(staging, "apps/backend/node_modules")}"`);
execSync(`rm -rf "${path.join(staging, "packages/shared/dist")}" "${path.join(staging, "apps/backend/dist")}"`);
execSync(`find "${staging}" -name "tsconfig.tsbuildinfo" -delete`);

// 5. Copy root config files
fs.copyFileSync(path.join(root, "tsconfig.base.json"), path.join(staging, "tsconfig.base.json"));
fs.copyFileSync(path.join(root, "pnpm-lock.yaml"), path.join(staging, "pnpm-lock.yaml"));

// 6. Generate Hostinger pnpm-workspace.yaml
fs.writeFileSync(
    path.join(staging, "pnpm-workspace.yaml"),
`packages:
  - "apps/backend"
  - "packages/shared"
`,
);

// 7. Generate Hostinger root package.json
const rootPkg = {
    name: "robago-backend-deploy",
    private: true,
    version: "0.0.0",
    type: "module",
    packageManager: "pnpm@10.28.0",
    scripts: {
        build: "pnpm --filter @robago/shared run build && pnpm --filter @robago/backend run build",
        start: "node server.js",
        "seed:all": "pnpm --filter @robago/backend run seed:all",
    },
    devDependencies: {
        typescript: "~6.0.2",
    },
};
fs.writeFileSync(path.join(staging, "package.json"), JSON.stringify(rootPkg, null, 2));

// 8. Generate root server.js entry file
fs.writeFileSync(
    path.join(staging, "server.js"),
    `import "./apps/backend/dist/server.js";\n`,
);

// 9. Generate production .env template
const envContent = [
    "PORT=5001",
    "NODE_ENV=production",
    "MONGO_URI=mongodb+srv://tndevelopmentworks_db_user:UyhnOYYx67E1rzdh@robago.k3pdcqt.mongodb.net/robago?retryWrites=true&w=majority",
    "JWT_ACCESS_SECRET=robago_super_secure_access_secret_2026_dev_key",
    "JWT_REFRESH_SECRET=robago_super_secure_refresh_secret_2026_dev_key",
    "JWT_ACCESS_EXPIRES_IN=15m",
    "JWT_REFRESH_EXPIRES_IN=30d",
    "CORS_ORIGIN=*",
    "COMPANY_NAME=Robago",
].join("\n");
fs.writeFileSync(path.join(staging, ".env"), envContent + "\n");

// 10. Zip it
console.log(`🗜️ Creating ${path.basename(zipFile)}...`);
execSync(`cd "${staging}" && zip -r -q "${zipFile}" .`, { stdio: "inherit" });

// Clean staging
fs.rmSync(staging, { recursive: true, force: true });

const stats = fs.statSync(zipFile);
const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
console.log(`✅ Success! Created: ${path.basename(zipFile)} (${sizeMB} MB)`);
