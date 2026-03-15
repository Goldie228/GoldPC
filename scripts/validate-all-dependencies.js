#!/usr/bin/env node
/**
 * validate-all-dependencies.js
 * 
 * Validates existence of all NPM and NuGet packages in project dependencies.
 * Detects AI-hallucinated packages that don't exist in registries.
 * 
 * Usage:
 *   node scripts/validate-all-dependencies.js [options]
 * 
 * Options:
 *   --verbose    Show detailed output for each package
 *   --json       Output results as JSON
 *   --quiet      Only show errors
 *   --help       Show help
 * 
 * Exit codes:
 *   0 - All packages valid
 *   1 - Some packages not found (hallucinated)
 *   2 - Network errors occurred
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  npmRegistry: 'https://registry.npmjs.org',
  nugetRegistry: 'https://api.nuget.org/v3/registration5-semver1',
  timeout: 15000,
  maxConcurrent: 5,
  retries: 2,
  retryDelay: 1000,
};

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  verbose: args.includes('--verbose') || args.includes('-v'),
  json: args.includes('--json'),
  quiet: args.includes('--quiet'),
  help: args.includes('--help') || args.includes('-h'),
};

if (options.help) {
  console.log(`
Usage: node scripts/validate-all-dependencies.js [options]

Options:
  --verbose, -v   Show detailed output for each package
  --json          Output results as JSON
  --quiet         Only show errors
  --help, -h      Show this help message

Exit codes:
  0 - All packages valid
  1 - Some packages not found (hallucinated)
  2 - Network errors occurred
`);
  process.exit(0);
}

// Results storage
const results = {
  npm: { valid: [], invalid: [], skipped: [] },
  nuget: { valid: [], invalid: [], skipped: [] },
  errors: [],
  stats: {
    totalChecked: 0,
    valid: 0,
    invalid: 0,
    skipped: 0,
    duration: 0,
  },
};

/**
 * HTTP GET request with timeout and retry
 */
function httpGet(url, retries = CONFIG.retries) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Timeout'));
    }, CONFIG.timeout);

    https.get(url, (res) => {
      clearTimeout(timeout);
      
      // Handle redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        httpGet(res.headers.location, retries)
          .then(resolve)
          .catch(reject);
        return;
      }
      
      resolve({
        statusCode: res.statusCode,
        headers: res.headers,
      });
    }).on('error', (err) => {
      clearTimeout(timeout);
      
      // Retry on network errors
      if (retries > 0) {
        setTimeout(() => {
          httpGet(url, retries - 1)
            .then(resolve)
            .catch(reject);
        }, CONFIG.retryDelay);
      } else {
        reject(err);
      }
    });
  });
}

/**
 * Check NPM package existence
 */
async function checkNpmPackage(pkg) {
  try {
    // Handle scoped packages (@org/package)
    const encodedPkg = pkg.startsWith('@') 
      ? `@${encodeURIComponent(pkg.slice(1))}`
      : encodeURIComponent(pkg);
    
    const response = await httpGet(`${CONFIG.npmRegistry}/${encodedPkg}`);
    
    if (response.statusCode === 200) {
      return { valid: true };
    } else if (response.statusCode === 404) {
      return { valid: false, statusCode: 404 };
    } else {
      return { valid: null, statusCode: response.statusCode };
    }
  } catch (error) {
    return { valid: null, error: error.message };
  }
}

/**
 * Check NuGet package existence
 */
async function checkNugetPackage(pkg) {
  try {
    const lowerPkg = pkg.toLowerCase();
    const response = await httpGet(`${CONFIG.nugetRegistry}/${lowerPkg}/index.json`);
    
    if (response.statusCode === 200) {
      return { valid: true };
    } else if (response.statusCode === 404) {
      return { valid: false, statusCode: 404 };
    } else {
      return { valid: null, statusCode: response.statusCode };
    }
  } catch (error) {
    return { valid: null, error: error.message };
  }
}

/**
 * Find all package.json files in project
 */
function findPackageJsonFiles(projectRoot) {
  const files = [];
  const visited = new Set();
  
  function search(dir) {
    if (visited.has(dir)) return;
    visited.add(dir);
    
    if (!fs.existsSync(dir)) return;
    
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    // Check if current dir has package.json
    const packageJsonPath = path.join(dir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      files.push(packageJsonPath);
    }
    
    // Search subdirectories
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      
      const fullPath = path.join(dir, entry.name);
      
      // Skip common non-source directories
      if (['node_modules', '.git', 'dist', 'build', 'coverage', 'obj', 'bin'].includes(entry.name)) {
        continue;
      }
      
      search(fullPath);
    }
  }
  
  search(projectRoot);
  return files;
}

/**
 * Find all .csproj files in project
 */
function findCsprojFiles(projectRoot) {
  const files = [];
  const visited = new Set();
  
  function search(dir) {
    if (visited.has(dir)) return;
    visited.add(dir);
    
    if (!fs.existsSync(dir)) return;
    
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // Skip common non-source directories
        if (['bin', 'obj', 'node_modules', '.git'].includes(entry.name)) {
          continue;
        }
        search(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.csproj')) {
        files.push(fullPath);
      }
    }
  }
  
  search(projectRoot);
  return files;
}

/**
 * Parse dependencies from package.json
 */
function parsePackageJson(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const pkg = JSON.parse(content);
    
    const deps = [];
    
    // Regular dependencies
    if (pkg.dependencies) {
      for (const [name, version] of Object.entries(pkg.dependencies)) {
        deps.push({ name, version, type: 'dependency', file: filePath });
      }
    }
    
    // Dev dependencies
    if (pkg.devDependencies) {
      for (const [name, version] of Object.entries(pkg.devDependencies)) {
        deps.push({ name, version, type: 'devDependency', file: filePath });
      }
    }
    
    // Peer dependencies
    if (pkg.peerDependencies) {
      for (const [name, version] of Object.entries(pkg.peerDependencies)) {
        deps.push({ name, version, type: 'peerDependency', file: filePath });
      }
    }
    
    return deps;
  } catch (error) {
    results.errors.push({
      type: 'parse_error',
      file: filePath,
      message: `Failed to parse package.json: ${error.message}`,
    });
    return [];
  }
}

/**
 * Parse PackageReference from .csproj file
 */
function parseCsproj(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const deps = [];
    
    // Regex patterns for different PackageReference formats
    const patterns = [
      // <PackageReference Include="Package" Version="1.0.0" />
      /<PackageReference\s+Include="([^"]+)"\s+Version="([^"]+)"/g,
      // <PackageReference Include="Package" Version="1.0.0">
      /<PackageReference\s+Include="([^"]+)"\s+Version="([^"]+)"[^>]*>/g,
      // <PackageReference Version="1.0.0" Include="Package" />
      /<PackageReference\s+Version="([^"]+)"\s+Include="([^"]+)"/g,
    ];
    
    const seen = new Set();
    
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        // Handle different capture groups based on pattern
        let name, version;
        if (pattern.source.includes('Version="([^"]+)"\\s+Include')) {
          // Pattern: Version before Include
          version = match[1];
          name = match[2];
        } else {
          // Pattern: Include before Version
          name = match[1];
          version = match[2];
        }
        
        const key = `${name}@${version}`;
        if (!seen.has(key)) {
          seen.add(key);
          deps.push({ name, version, file: filePath });
        }
      }
    }
    
    return deps;
  } catch (error) {
    results.errors.push({
      type: 'parse_error',
      file: filePath,
      message: `Failed to parse .csproj: ${error.message}`,
    });
    return [];
  }
}

/**
 * Process items with concurrency limit
 */
async function processConcurrently(items, processor, concurrency = CONFIG.maxConcurrent) {
  const output = [];
  const queue = [...items];
  
  async function worker() {
    while (queue.length > 0) {
      const item = queue.shift();
      if (item === undefined) continue;
      
      try {
        const result = await processor(item);
        output.push({ item, result });
      } catch (error) {
        output.push({ item, result: { valid: null, error: error.message } });
      }
    }
  }
  
  // Start workers
  const workers = [];
  for (let i = 0; i < Math.min(concurrency, items.length); i++) {
    workers.push(worker());
  }
  
  // Wait for all workers to complete
  await Promise.all(workers);
  
  return output;
}

/**
 * Check all NPM dependencies
 */
async function checkNpmDependencies(projectRoot) {
  const packageJsonFiles = findPackageJsonFiles(projectRoot);
  
  if (packageJsonFiles.length === 0) {
    if (!options.quiet) {
      console.log('⚠️  No package.json files found');
    }
    return;
  }
  
  // Collect all NPM dependencies
  const allDeps = [];
  const seenDeps = new Set();
  
  for (const file of packageJsonFiles) {
    const deps = parsePackageJson(file);
    for (const dep of deps) {
      const key = `${dep.name}@${dep.version}`;
      if (!seenDeps.has(key)) {
        seenDeps.add(key);
        allDeps.push(dep);
      }
    }
  }
  
  if (allDeps.length === 0) {
    if (!options.quiet) {
      console.log('⚠️  No NPM dependencies found');
    }
    return;
  }
  
  if (!options.quiet && !options.json) {
    console.log(`\n📦 Checking ${allDeps.length} unique NPM packages across ${packageJsonFiles.length} package.json files...\n`);
  }
  
  // Process packages
  const processed = await processConcurrently(allDeps, async (dep) => {
    const result = await checkNpmPackage(dep.name);
    return { ...result };
  });
  
  // Collect results
  for (const { item: dep, result } of processed) {
    const { valid, statusCode, error } = result;
    results.stats.totalChecked++;
    
    if (valid === true) {
      results.npm.valid.push(dep);
      results.stats.valid++;
      if (options.verbose && !options.json) {
        console.log(`  ✅ ${dep.name}@${dep.version}`);
      }
    } else if (valid === false) {
      results.npm.invalid.push({ ...dep, statusCode });
      results.stats.invalid++;
      if (!options.quiet && !options.json) {
        console.log(`  ❌ ${dep.name}@${dep.version} - NOT FOUND (404)`);
      }
    } else {
      results.npm.skipped.push({ ...dep, statusCode, error });
      results.stats.skipped++;
      if (!options.quiet && !options.json) {
        console.log(`  ⚠️  ${dep.name}@${dep.version} - Network error: ${error || `HTTP ${statusCode}`}`);
      }
    }
  }
}

/**
 * Check all NuGet dependencies
 */
async function checkNugetDependencies(projectRoot) {
  const csprojFiles = findCsprojFiles(projectRoot);
  
  if (csprojFiles.length === 0) {
    if (!options.quiet) {
      console.log('⚠️  No .csproj files found');
    }
    return;
  }
  
  // Collect all NuGet dependencies
  const allDeps = [];
  const seenDeps = new Set();
  
  for (const file of csprojFiles) {
    const deps = parseCsproj(file);
    for (const dep of deps) {
      const key = `${dep.name}@${dep.version}`;
      if (!seenDeps.has(key)) {
        seenDeps.add(key);
        allDeps.push(dep);
      }
    }
  }
  
  if (allDeps.length === 0) {
    if (!options.quiet) {
      console.log('⚠️  No NuGet packages found');
    }
    return;
  }
  
  if (!options.quiet && !options.json) {
    console.log(`\n📦 Checking ${allDeps.length} unique NuGet packages across ${csprojFiles.length} .csproj files...\n`);
  }
  
  // Process packages
  const processed = await processConcurrently(allDeps, async (dep) => {
    const result = await checkNugetPackage(dep.name);
    return { ...result };
  });
  
  // Collect results
  for (const { item: dep, result } of processed) {
    const { valid, statusCode, error } = result;
    results.stats.totalChecked++;
    
    if (valid === true) {
      results.nuget.valid.push(dep);
      results.stats.valid++;
      if (options.verbose && !options.json) {
        console.log(`  ✅ ${dep.name}@${dep.version}`);
      }
    } else if (valid === false) {
      results.nuget.invalid.push({ ...dep, statusCode });
      results.stats.invalid++;
      if (!options.quiet && !options.json) {
        console.log(`  ❌ ${dep.name}@${dep.version} - NOT FOUND (404)`);
      }
    } else {
      results.nuget.skipped.push({ ...dep, statusCode, error });
      results.stats.skipped++;
      if (!options.quiet && !options.json) {
        console.log(`  ⚠️  ${dep.name}@${dep.version} - Network error: ${error || `HTTP ${statusCode}`}`);
      }
    }
  }
}

/**
 * Print text summary
 */
function printSummary() {
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log('             📦 DEPENDENCY VALIDATION REPORT  📦');
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log('\n');
  console.log(`📊 Statistics:`);
  console.log(`   Total checked:  ${results.stats.totalChecked}`);
  console.log(`   ✅ Valid:       ${results.stats.valid}`);
  console.log(`   ❌ Invalid:     ${results.stats.invalid}`);
  console.log(`   ⚠️  Skipped:     ${results.stats.skipped}`);
  console.log(`   ⏱️  Duration:    ${results.stats.duration}ms`);
  console.log('\n');
  
  if (results.npm.invalid.length > 0) {
    console.log('─────────────────────────────────────────────────────────────────────────');
    console.log('❌ INVALID NPM PACKAGES (possible AI hallucinations):');
    console.log('─────────────────────────────────────────────────────────────────────────');
    results.npm.invalid.forEach((pkg, i) => {
      console.log(`  ${i + 1}. ${pkg.name}@${pkg.version}`);
      if (options.verbose && pkg.file) {
        console.log(`     File: ${path.relative(process.cwd(), pkg.file)}`);
      }
    });
    console.log('\n');
  }
  
  if (results.nuget.invalid.length > 0) {
    console.log('─────────────────────────────────────────────────────────────────────────');
    console.log('❌ INVALID NUGET PACKAGES (possible AI hallucinations):');
    console.log('─────────────────────────────────────────────────────────────────────────');
    results.nuget.invalid.forEach((pkg, i) => {
      console.log(`  ${i + 1}. ${pkg.name}@${pkg.version}`);
      if (options.verbose && pkg.file) {
        console.log(`     File: ${path.relative(process.cwd(), pkg.file)}`);
      }
    });
    console.log('\n');
  }
  
  if (results.errors.length > 0) {
    console.log('─────────────────────────────────────────────────────────────────────────');
    console.log('⚠️  PARSE ERRORS:');
    console.log('─────────────────────────────────────────────────────────────────────────');
    results.errors.forEach((err, i) => {
      console.log(`  ${i + 1}. ${err.message}`);
      if (err.file) {
        console.log(`     File: ${path.relative(process.cwd(), err.file)}`);
      }
    });
    console.log('\n');
  }
  
  console.log('═══════════════════════════════════════════════════════════════════════');
  
  if (results.stats.invalid > 0) {
    console.log('🚨 FAIL: Found packages that do not exist in registries!');
    console.log('   These may be AI-hallucinated dependencies.');
  } else if (results.stats.skipped > 0) {
    console.log('⚠️  PARTIAL: Some packages could not be checked due to network errors.');
  } else {
    console.log('✅ PASS: All checked packages are valid.');
  }
  
  console.log('═══════════════════════════════════════════════════════════════════════');
}

/**
 * Print JSON output
 */
function printJson() {
  console.log(JSON.stringify(results, null, 2));
}

/**
 * Main function
 */
async function main() {
  const projectRoot = process.cwd();
  const startTime = Date.now();
  
  if (!options.json && !options.quiet) {
    console.log('🔍 Validating dependencies...');
    console.log(`📁 Project root: ${projectRoot}`);
  }
  
  await checkNpmDependencies(projectRoot);
  await checkNugetDependencies(projectRoot);
  
  results.stats.duration = Date.now() - startTime;
  
  if (options.json) {
    printJson();
  } else {
    printSummary();
  }
  
  // Exit with appropriate code
  if (results.stats.invalid > 0) {
    process.exit(1);
  } else if (results.stats.skipped > 0) {
    process.exit(2);
  } else {
    process.exit(0);
  }
}

// Run
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(2);
});