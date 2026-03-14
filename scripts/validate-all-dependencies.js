#!/usr/bin/env node
/**
 * Validation of all dependencies
 * Проверка существования пакетов в реестрах
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const results = {
  valid: [],
  invalid: [],
  warnings: [],
};

/**
 * HTTP GET request with timeout
 */
function httpGet(url) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Timeout'));
    }, 10000);

    https.get(url, (res) => {
      clearTimeout(timeout);
      resolve(res.statusCode);
    }).on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

/**
 * Check npm package
 */
async function checkNpmPackage(pkg) {
  try {
    const statusCode = await httpGet(`https://registry.npmjs.org/${encodeURIComponent(pkg)}`);
    return statusCode === 200;
  } catch {
    return null; // Network error, skip
  }
}

/**
 * Check NuGet package
 */
async function checkNugetPackage(pkg) {
  try {
    const statusCode = await httpGet(`https://api.nuget.org/v3/registration5-semver1/${pkg.toLowerCase()}/index.json`);
    return statusCode === 200;
  } catch {
    return null; // Network error, skip
  }
}

/**
 * Check package.json dependencies
 */
async function checkPackageJson(projectRoot) {
  const packageJsonPath = path.join(projectRoot, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    results.warnings.push({ message: 'package.json not found', file: packageJsonPath });
    return;
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    console.log(`\n📦 Checking ${Object.keys(deps).length} npm packages...\n`);

    for (const [pkg, version] of Object.entries(deps)) {
      const isValid = await checkNpmPackage(pkg);
      
      if (isValid === true) {
        results.valid.push({ name: pkg, version, registry: 'npm' });
        console.log(`  ✅ ${pkg}@${version}`);
      } else if (isValid === false) {
        results.invalid.push({ name: pkg, version, registry: 'npm' });
        console.log(`  ❌ ${pkg}@${version} - NOT FOUND IN NPM REGISTRY`);
      } else {
        results.warnings.push({ name: pkg, version, registry: 'npm' });
        console.log(`  ⚠️  ${pkg}@${version} - Network error, skipped`);
      }
    }
  } catch (e) {
    results.warnings.push({ message: `Failed to parse package.json: ${e.message}`, file: packageJsonPath });
  }
}

/**
 * Check .csproj dependencies
 */
async function checkCsproj(projectRoot) {
  const findCsprojFiles = (dir) => {
    const files = [];
    if (!fs.existsSync(dir)) return files;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    entries.forEach(entry => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && !['bin', 'obj', 'node_modules', '.git'].includes(entry.name)) {
        files.push(...findCsproj(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.csproj')) {
        files.push(fullPath);
      }
    });
    return files;
  };

  const csprojFiles = findCsprojFiles(projectRoot);

  if (csprojFiles.length === 0) {
    results.warnings.push({ message: 'No .csproj files found' });
    return;
  }

  console.log(`\n📦 Checking NuGet packages in ${csprojFiles.length} project files...\n`);

  for (const csprojPath of csprojFiles) {
    const content = fs.readFileSync(csprojPath, 'utf-8');
    
    // Extract PackageReference items
    const packageRegex = /<PackageReference\s+Include="([^"]+)"\s+Version="([^"]+)"/g;
    let match;

    while ((match = packageRegex.exec(content)) !== null) {
      const [, pkg, version] = match;
      const isValid = await checkNugetPackage(pkg);

      if (isValid === true) {
        results.valid.push({ name: pkg, version, registry: 'nuget', file: csprojPath });
        console.log(`  ✅ ${pkg}@${version}`);
      } else if (isValid === false) {
        results.invalid.push({ name: pkg, version, registry: 'nuget', file: csprojPath });
        console.log(`  ❌ ${pkg}@${version} - NOT FOUND IN NUGET REGISTRY`);
      } else {
        results.warnings.push({ name: pkg, version, registry: 'nuget', file: csprojPath });
        console.log(`  ⚠️  ${pkg}@${version} - Network error, skipped`);
      }
    }
  }
}

/**
 * Print summary
 */
function printSummary() {
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('          📦 DEPENDENCY VALIDATION REPORT  📦');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('\n');
  console.log(`✅ Valid packages:   ${results.valid.length}`);
  console.log(`❌ Invalid packages: ${results.invalid.length}`);
  console.log(`⚠️  Warnings:         ${results.warnings.length}`);
  console.log('\n');

  if (results.invalid.length > 0) {
    console.log('❌ INVALID PACKAGES (possible hallucinations):');
    console.log('───────────────────────────────────────────────────────────');
    results.invalid.forEach((pkg, i) => {
      console.log(`${i + 1}. ${pkg.name}@${pkg.version} (${pkg.registry})`);
      if (pkg.file) console.log(`   File: ${pkg.file}`);
    });
    console.log('\n');
  }

  console.log('═══════════════════════════════════════════════════════════');

  if (results.invalid.length > 0) {
    console.log('🚨 FAIL: Found packages that do not exist in registries!');
    process.exit(1);
  } else {
    console.log('✅ PASS: All checked packages are valid.');
  }
}

// Main
async function main() {
  const projectRoot = process.cwd();
  
  console.log('🔍 Validating dependencies...');
  console.log(`📁 Project root: ${projectRoot}`);

  await checkPackageJson(projectRoot);
  await checkCsproj(projectRoot);
  
  printSummary();
}

main().catch(console.error);
</task_progress>
</write_to_file>