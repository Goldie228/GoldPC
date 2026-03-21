#!/usr/bin/env node
/**
 * Anti-Neuroslop Shield
 * Детекция проблемного ИИ-сгенерированного кода
 * 
 * Запуск: node scripts/neuroslop-check.js <файлы>
 */

const fs = require('fs');
const path = require('path');

// Паттерны нейрослопа
const NEUROSLOP_PATTERNS = {
  // Лишние комментарии к очевидному коду
  OBVIOUS_COMMENTS: [
    /\/\/\s*(Get|Set|Return|Create|Update|Delete|Remove|Add|Check|Validate|Process|Handle|Initialize|Configure|Setup)\s+(the\s+)?(a\s+)?\w+/i,
    /\/\/\s*This\s+(function|method|class|component|module|file)\s+\w+/i,
    /\/\/\s*(Constructor|Destructor|Initializer|Finalizer)/i,
    /\/\/\s*Default\s+constructor/i,
    /\/\/\s*Empty\s+constructor/i,
    /\/\/\s*Main\s+(method|function|entry\s+point)/i,
    /\/\/\s*TODO:\s*(Implement|Add|Fix|Update|Create|Remove)\s+\w+/i,
    /\/\/\s*NOTE:\s*This\s+is\s+/i,
    /\/\/\s*Helper\s+(function|method|class|utility)/i,
    /\/\/\s*Utility\s+(function|method|class)/i,
  ],

  // Over-engineering паттерны
  OVER_ENGINEERING: [
    /class\s+\w+Factory\s*\{\s*create\s*\(\)\s*\{\s*return\s+new\s+\w+\(\)\s*;?\s*\}\s*\}/,
    /class\s+\w+Builder\s*\{\s*build\s*\(\)\s*\{\s*return\s+new\s+\w+\(\)\s*;?\s*\}\s*\}/,
    /interface\s+I\w+\s*\{\s*\w+\s*:\s*(string|number|boolean|any)\s*;?\s*\}/,
  ],

  // Повторяющиеся проверки
  REDUNDANT_CHECKS: [
    /if\s*\(\s*\w+\s*\)\s*\{\s*return\s+(true|false)\s*;?\s*\}\s*return\s+(!)?(true|false)/,
    /if\s*\(\s*\w+\s*===\s*(true|false)\s*\)\s*\{\s*return\s+(true|false)\s*;?\s*\}/,
  ],

  // Галлюцинации - несуществующие библиотеки/API
  HALLUCINATIONS: {
    javascript: [
      'react-native-webview-bridge',
      'axios-retry-interceptor',
      'express-jwt-authenticator',
      'mongoose-auto-populate',
      'lodash-deep-merge',
      'moment-timezone-utils',
      'redux-saga-thunk',
      'react-query-mutation',
    ],
    csharp: [
      'Microsoft.EntityFrameworkCore.AutoMigration',
      'Newtonsoft.Json.Advanced',
      'AutoMapper.Extensions.Microsoft.DependencyInjection.Advanced',
      'Serilog.Sinks.Elasticsearch.Advanced',
      'MediatR.Extensions.Microsoft.DependencyInjection.Fluent',
    ],
  },

  // Избыточные импорты
  UNUSED_IMPORTS: [
    /^import\s+.*\s+from\s+['"]lodash['"];\s*$/m,
    /^import\s+\*\s+as\s+_\s+from\s+['"]lodash['"];\s*$/m,
  ],

  // Подозрительные паттерны
  SUSPICIOUS_PATTERNS: [
    // Закомментированный код
    /\/\/\s*(function|const|let|var|class|interface|type|export|import)\s+/,
    // Debug код
    /console\.(log|debug|info|warn|error)\s*\([^)]*\)/,
    // Debugger statements
    /debugger;/,
    // Alert
    /alert\s*\(/,
    // eval
    /eval\s*\(/,
    // document.write
    /document\.write\s*\(/,
  ],
};

// Результаты проверки
const results = {
  errors: [],
  warnings: [],
  info: [],
};

/**
 * Проверка файла на нейрослоп
 */
function checkFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Файл не найден: ${filePath}`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const ext = path.extname(filePath);
  const lang = ext === '.cs' ? 'csharp' : 'javascript';

  // Проверка очевидных комментариев
  lines.forEach((line, index) => {
    NEUROSLOP_PATTERNS.OBVIOUS_COMMENTS.forEach(pattern => {
      if (pattern.test(line.trim())) {
        results.info.push({
          file: filePath,
          line: index + 1,
          type: 'OBVIOUS_COMMENT',
          message: 'Очевидный комментарий (возможный нейрослоп)',
          content: line.trim(),
        });
      }
    });
  });

  // Проверка over-engineering
  NEUROSLOP_PATTERNS.OVER_ENGINEERING.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      results.warnings.push({
        file: filePath,
        type: 'OVER_ENGINEERING',
        message: 'Избыточный паттерн (возможный нейрослоп)',
        content: matches[0].substring(0, 100),
      });
    }
  });

  // Проверка избыточных проверок
  NEUROSLOP_PATTERNS.REDUNDANT_CHECKS.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      results.warnings.push({
        file: filePath,
        type: 'REDUNDANT_CHECK',
        message: 'Избыточная проверка (возможный нейрослоп)',
        content: matches[0],
      });
    }
  });

  // Проверка на галлюцинации (импорты несуществующих пакетов)
  if (NEUROSLOP_PATTERNS.HALLUCINATIONS[lang]) {
    NEUROSLOP_PATTERNS.HALLUCINATIONS[lang].forEach(pkg => {
      if (content.includes(pkg)) {
        results.errors.push({
          file: filePath,
          type: 'HALLUCINATION',
          message: `Возможная галлюцинация: неизвестный пакет "${pkg}"`,
        });
      }
    });
  }

  // Проверка подозрительных паттернов
  lines.forEach((line, index) => {
    NEUROSLOP_PATTERNS.SUSPICIOUS_PATTERNS.forEach(pattern => {
      if (pattern.test(line)) {
        results.warnings.push({
          file: filePath,
          line: index + 1,
          type: 'SUSPICIOUS_PATTERN',
          message: 'Подозрительный паттерн',
          content: line.trim(),
        });
      }
    });
  });
}

/**
 * Проверка зависимостей на галлюцинации
 */
function checkDependencies(projectRoot) {
  // Проверка package.json
  const packageJsonPath = path.join(projectRoot, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      Object.keys(deps).forEach(pkg => {
        if (NEUROSLOP_PATTERNS.HALLUCINATIONS.javascript.includes(pkg)) {
          results.errors.push({
            file: packageJsonPath,
            type: 'HALLUCINATION',
            message: `Возможная галлюцинация в зависимостях: "${pkg}"`,
          });
        }
      });
    } catch (e) {
      // Ignore parse errors
    }
  }

  // Проверка .csproj
  const csprojFiles = findFiles(projectRoot, '.csproj');
  csprojFiles.forEach(csprojPath => {
    const content = fs.readFileSync(csprojPath, 'utf-8');
    NEUROSLOP_PATTERNS.HALLUCINATIONS.csharp.forEach(pkg => {
      if (content.includes(pkg)) {
        results.errors.push({
          file: csprojPath,
          type: 'HALLUCINATION',
          message: `Возможная галлюцинация в зависимостях: "${pkg}"`,
        });
      }
    });
  });
}

/**
 * Рекурсивный поиск файлов
 */
function findFiles(dir, ext) {
  const files = [];
  if (!fs.existsSync(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  entries.forEach(entry => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !['node_modules', 'bin', 'obj', '.git'].includes(entry.name)) {
      files.push(...findFiles(fullPath, ext));
    } else if (entry.isFile() && entry.name.endsWith(ext)) {
      files.push(fullPath);
    }
  });
  return files;
}

/**
 * Вывод результатов
 */
function printResults() {
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('          🛡️  ANTI-NEUROSLOP SHIELD REPORT  🛡️');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('\n');

  if (results.errors.length > 0) {
    console.log('❌ ERRORS (' + results.errors.length + '):');
    console.log('───────────────────────────────────────────────────────────');
    results.errors.forEach((err, i) => {
      console.log(`\n${i + 1}. [${err.type}] ${err.file}`);
      console.log(`   ${err.message}`);
      if (err.line) console.log(`   Line: ${err.line}`);
      if (err.content) console.log(`   Code: ${err.content.substring(0, 80)}...`);
    });
    console.log('\n');
  }

  if (results.warnings.length > 0) {
    console.log('⚠️  WARNINGS (' + results.warnings.length + '):');
    console.log('───────────────────────────────────────────────────────────');
    results.warnings.forEach((warn, i) => {
      console.log(`\n${i + 1}. [${warn.type}] ${warn.file}`);
      console.log(`   ${warn.message}`);
      if (warn.line) console.log(`   Line: ${warn.line}`);
      if (warn.content) console.log(`   Code: ${warn.content.substring(0, 80)}...`);
    });
    console.log('\n');
  }

  if (results.info.length > 0) {
    console.log('ℹ️  INFO (' + results.info.length + '):');
    console.log('───────────────────────────────────────────────────────────');
    results.info.slice(0, 10).forEach((info, i) => {
      console.log(`${i + 1}. [${info.type}] ${info.file}:${info.line}`);
      console.log(`   ${info.message}`);
    });
    if (results.info.length > 10) {
      console.log(`   ... and ${results.info.length - 10} more`);
    }
    console.log('\n');
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log(`📊 SUMMARY: ${results.errors.length} errors, ${results.warnings.length} warnings, ${results.info.length} info`);
  console.log('═══════════════════════════════════════════════════════════');

  // Код возврата
  if (results.errors.length > 0) {
    process.exit(1);
  }
}

// Main
const args = process.argv.slice(2);
const projectRoot = process.cwd();

if (args.length === 0) {
  // Проверка всех файлов проекта
  console.log('🔍 Scanning project for neuroslop...\n');
  
  // Проверка JS/TS файлов
  const jsFiles = findFiles(projectRoot, '.js')
    .concat(findFiles(projectRoot, '.ts'))
    .concat(findFiles(projectRoot, '.tsx'));
  jsFiles.forEach(checkFile);
  
  // Проверка C# файлов
  const csFiles = findFiles(projectRoot, '.cs');
  csFiles.forEach(checkFile);
  
  // Проверка зависимостей
  checkDependencies(projectRoot);
} else {
  // Проверка указанных файлов
  args.forEach(checkFile);
}

printResults();
