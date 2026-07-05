#!/usr/bin/env python3
"""
Генератор отчёта о проекте GoldPC
Сканирует все исходные файлы проекта, считает строки и генерирует
детальный отчёт в формате Markdown.
"""

import os
import sys
import hashlib
from pathlib import Path
from collections import defaultdict
from datetime import datetime

# Корень проекта
PROJECT_ROOT = Path(__file__).resolve().parent.parent

# Расширения, которые анализируем
SOURCE_EXTENSIONS = {
    '.cs', '.ts', '.tsx', '.jsx', '.js', '.css', '.scss', '.html',
    '.json', '.md', '.yaml', '.yml', '.sql', '.xml', '.csproj', '.sln',
    '.env', '.env.example', '.gitignore', '.editorconfig', '.prettierrc',
    '.eslintrc', '.config', '.sh', '.bat', '.ps1', '.txt', '.lock',
    '.razor', '.cshtml',
}

# Директории, которые пропускаем
SKIP_DIRS = {
    'node_modules', '.git', 'bin', 'obj', '.vs', '.vscode', '.idea',
    'dist', 'build', '__pycache__', '.next', '.nuxt', 'coverage',
    '.tmp', '.cache', '.turbo', '.parcel-cache', 'wwwroot/lib',
    'Migrations', '.opencode',
}

# Файлы, которые пропускаем (слишком больные или неинтересные)
SKIP_FILES = {
    'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', '.DS_Store',
    'Thumbs.db',
}

# Максимальный размер файла для чтения (в байтах)
MAX_FILE_SIZE = 500_000  # 500 KB


def should_skip_dir(dirname: str) -> bool:
    return dirname in SKIP_DIRS or dirname.startswith('.')


def should_skip_file(filename: str) -> bool:
    if filename in SKIP_FILES:
        return True
    if filename.endswith('.lock'):
        return True
    return False


def count_lines(filepath: Path) -> int | None:
    """Считает количество строк в файле. Возвращает None для бинарных."""
    try:
        size = filepath.stat().st_size
        if size > MAX_FILE_SIZE:
            return None
        if size == 0:
            return 0
        with open(filepath, 'r', encoding='utf-8', errors='strict') as f:
            return sum(1 for _ in f)
    except (UnicodeDecodeError, PermissionError, OSError):
        return None


def detect_file_type(filepath: Path) -> str:
    """Определяет тип файла по расширению и содержимому."""
    ext = filepath.suffix.lower()
    name = filepath.name.lower()

    type_map = {
        '.cs': 'C#',
        '.csproj': 'C# Project',
        '.sln': 'Solution',
        '.ts': 'TypeScript',
        '.tsx': 'React TSX',
        '.jsx': 'React JSX',
        '.js': 'JavaScript',
        '.css': 'CSS',
        '.scss': 'SCSS',
        '.html': 'HTML',
        '.json': 'JSON',
        '.md': 'Markdown',
        '.yaml': 'YAML',
        '.yml': 'YAML',
        '.sql': 'SQL',
        '.xml': 'XML',
        '.env': 'Env Config',
        '.env.example': 'Env Example',
        '.sh': 'Shell Script',
        '.config': 'Config',
    }

    # Специальные имена
    if name == 'dockerfile':
        return 'Dockerfile'
    if name == 'docker-compose.yml' or name == 'docker-compose.yaml':
        return 'Docker Compose'
    if name == '.gitignore':
        return 'Git Ignore'
    if name == 'tsconfig.json':
        return 'TypeScript Config'
    if name == 'vite.config.ts':
        return 'Vite Config'
    if name == 'tailwind.config.ts' or name == 'tailwind.config.js':
        return 'Tailwind Config'
    if name == 'index.css':
        return 'CSS (Tailwind Theme)'

    return type_map.get(ext, ext.lstrip('.').upper() or 'Unknown')


def classify_by_domain(filepath: Path) -> str:
    """Классифицирует файл по доменной области."""
    parts = filepath.parts

    if 'backend' in parts or 'GoldPC.Api' in parts:
        return 'API Gateway'
    if 'CatalogService' in parts:
        return 'Catalog Service'
    if 'AuthService' in parts:
        return 'Auth Service'
    if 'PCBuilderService' in parts:
        return 'PC Builder Service'
    if 'ServicesService' in parts:
        return 'Services Service'
    if 'WarrantyService' in parts:
        return 'Warranty Service'
    if 'OrdersService' in parts:
        return 'Orders Service'
    if 'ReportingService' in parts:
        return 'Reporting Service'
    if 'SharedKernel' in parts:
        return 'Shared Kernel'
    if 'Shared' in parts and 'SharedKernel' not in parts:
        return 'Shared Libs'
    if 'frontend' in parts:
        if 'components' in parts:
            if 'ui' in parts:
                return 'UI Components'
            if 'admin' in parts:
                return 'Admin Components'
            if 'pc-builder' in parts:
                return 'PC Builder UI'
            if 'layout' in parts:
                return 'Layout'
            if 'catalog' in parts:
                return 'Catalog UI'
            if 'filter' in parts:
                return 'Filter UI'
            return 'Feature Components'
        if 'pages' in parts:
            if 'admin' in parts:
                return 'Admin Pages'
            if 'master' in parts:
                return 'Master Pages'
            if 'accountant' in parts:
                return 'Accountant Pages'
            if 'info' in parts:
                return 'Info Pages'
            if 'pc-builder' in parts:
                return 'PC Builder Pages'
            return 'Pages'
        if 'api' in parts:
            return 'API Client'
        if 'hooks' in parts:
            return 'Hooks'
        if 'store' in parts:
            return 'State Management'
        if 'styles' in parts:
            return 'Styles'
        if 'shared' in parts:
            return 'Shared Utils'
        return 'Frontend'
    if 'scripts' in parts:
        return 'Scripts'
    if 'docs' in parts:
        return 'Docs'
    if 'docker' in parts or 'Dockerfile' in filepath.name:
        return 'Docker'
    if 'tests' in parts or 'test' in parts or '__tests__' in parts:
        return 'Tests'

    return 'Other'


def describe_file(filepath: Path, lines: int, file_type: str) -> str:
    """Генерирует краткое описание файла на основе содержимого."""
    rel = filepath.relative_to(PROJECT_ROOT)
    name = filepath.name.lower()

    # Описания по имени файла
    name_descriptions = {
        'program.cs': 'Entry point — DI registration, middleware, Kestrel config',
        'startup.cs': 'Startup configuration',
        'dockerfile': 'Container build instructions',
        'docker-compose.yml': 'Multi-service orchestration',
        'readme.md': 'Project documentation',
        'changelog.md': 'Version history',
        '.gitignore': 'Git ignore rules',
        'tsconfig.json': 'TypeScript compiler configuration',
        'vite.config.ts': 'Vite bundler configuration',
        'tailwind.config.ts': 'Tailwind CSS configuration',
        'index.css': 'Global styles and design tokens',
        'appsettings.json': 'Application settings',
        'appsettings.development.json': 'Development settings override',
        'launchsettings.json': 'Launch profiles for Kestrel',
    }

    if name in name_descriptions:
        return name_descriptions[name]

    # Описания по типу + контексту
    rel_str = str(rel).lower()

    if '.csproj' in name:
        return f'.NET project file ({lines} lines)'
    if '.sln' in name:
        return f'Solution file ({lines} lines)'

    if 'migration' in rel_str:
        return f'EF Core migration ({lines} lines)'

    if 'controller' in rel_str:
        return f'REST API controller ({lines} lines)'

    if 'repository' in rel_str:
        return f'Data access layer ({lines} lines)'

    if 'service' in rel_str and '.cs' in name:
        return f'Business logic service ({lines} lines)'

    if 'dto' in rel_str or 'model' in rel_str:
        return f'Data transfer object / model ({lines} lines)'

    if 'test' in rel_str or 'spec' in rel_str:
        return f'Unit / integration test ({lines} lines)'

    if 'page' in rel_str and ('.tsx' in name or '.jsx' in name):
        return f'Page component ({lines} lines)'

    if 'component' in rel_str and ('.tsx' in name or '.jsx' in name):
        return f'UI component ({lines} lines)'

    if 'hook' in rel_str:
        return f'React hook ({lines} lines)'

    if 'store' in rel_str:
        return f'Zustand state store ({lines} lines)'

    if 'api' in rel_str and ('.ts' in name or '.tsx' in name):
        return f'API client layer ({lines} lines)'

    if 'style' in rel_str or 'css' in name:
        return f'Styles ({lines} lines)'

    if '.sql' in name:
        return f'SQL script ({lines} lines)'

    return f'{lines} lines'


def scan_project() -> list[dict]:
    """Сканирует проект и возвращает список файлов с метаданными."""
    files = []

    for root, dirs, filenames in os.walk(PROJECT_ROOT):
        # Пропускаем директории
        dirs[:] = [d for d in dirs if not should_skip_dir(d)]

        for fname in sorted(filenames):
            if should_skip_file(fname):
                continue

            filepath = Path(root) / fname
            ext = filepath.suffix.lower()

            # Пропускаем файлы без нужных расширений
            if ext not in SOURCE_EXTENSIONS and '.' not in fname:
                # Проверяем файлы без расширения (Dockerfile, Makefile, etc.)
                if fname.lower() not in ('dockerfile', 'makefile', 'procfile', '.env', '.env.example', '.editorconfig', '.gitignore'):
                    continue

            lines = count_lines(filepath)
            if lines is None:
                continue  # бинарный или слишком большой

            file_type = detect_file_type(filepath)
            domain = classify_by_domain(filepath)
            description = describe_file(filepath, lines, file_type)
            size = filepath.stat().st_size

            files.append({
                'path': filepath.relative_to(PROJECT_ROOT),
                'lines': lines,
                'size': size,
                'type': file_type,
                'domain': domain,
                'description': description,
            })

    return files


def format_size(size_bytes: int) -> str:
    if size_bytes < 1024:
        return f'{size_bytes} B'
    elif size_bytes < 1024 * 1024:
        return f'{size_bytes / 1024:.1f} KB'
    else:
        return f'{size_bytes / (1024 * 1024):.1f} MB'


def generate_report(files: list[dict]) -> str:
    """Генерирует Markdown-отчёт."""
    lines = []

    lines.append('# GoldPC — Полный отчёт по проекту')
    lines.append('')
    lines.append(f'> Сгенерировано: {datetime.now().strftime("%Y-%m-%d %H:%M")}')
    lines.append('')

    # ═══════ Сводка ═══════
    total_files = len(files)
    total_lines = sum(f['lines'] for f in files)
    total_size = sum(f['size'] for f in files)

    lines.append('## Сводка')
    lines.append('')
    lines.append(f'| Метрика | Значение |')
    lines.append(f'|---------|----------|')
    lines.append(f'| Файлов | {total_files} |')
    lines.append(f'| Строк кода | {total_lines:,} |')
    lines.append(f'| Размер | {format_size(total_size)} |')
    lines.append('')

    # ═══════ По типам файлов ═══════
    by_type = defaultdict(lambda: {'count': 0, 'lines': 0, 'size': 0})
    for f in files:
        t = f['type']
        by_type[t]['count'] += 1
        by_type[t]['lines'] += f['lines']
        by_type[t]['size'] += f['size']

    lines.append('## По типам файлов')
    lines.append('')
    lines.append('| Тип | Файлов | Строк | Размер |')
    lines.append('|-----|--------|-------|--------|')
    for t in sorted(by_type, key=lambda x: by_type[x]['lines'], reverse=True):
        v = by_type[t]
        lines.append(f'| {t} | {v["count"]} | {v["lines"]:,} | {format_size(v["size"])} |')
    lines.append('')

    # ═══════ По доменным областям ═══════
    by_domain = defaultdict(lambda: {'count': 0, 'lines': 0, 'size': 0})
    for f in files:
        d = f['domain']
        by_domain[d]['count'] += 1
        by_domain[d]['lines'] += f['lines']
        by_domain[d]['size'] += f['size']

    lines.append('## По доменным областям')
    lines.append('')
    lines.append('| Область | Файлов | Строк | Размер |')
    lines.append('|---------|--------|-------|--------|')
    for d in sorted(by_domain, key=lambda x: by_domain[x]['lines'], reverse=True):
        v = by_domain[d]
        lines.append(f'| {d} | {v["count"]} | {v["lines"]:,} | {format_size(v["size"])} |')
    lines.append('')

    # ═══════ Все файлы по группам ═══════
    lines.append('## Все файлы')
    lines.append('')

    # Группируем по доменной области
    files_by_domain = defaultdict(list)
    for f in files:
        files_by_domain[f['domain']].append(f)

    for domain in sorted(files_by_domain, key=lambda d: -sum(f['lines'] for f in files_by_domain[d])):
        domain_files = files_by_domain[domain]
        domain_lines = sum(f['lines'] for f in domain_files)

        lines.append(f'### {domain} ({len(domain_files)} файлов, {domain_lines:,} строк)')
        lines.append('')

        for f in sorted(domain_files, key=lambda x: -x['lines']):
            rel = str(f['path'])
            lines.append(f'- **{rel}** — {f["lines"]} строк, {format_size(f["size"])} — {f["description"]}')

        lines.append('')

    # ═══════ Топ-20 самых больших файлов ═══════
    lines.append('## Топ-20 самых больших файлов (по строкам)')
    lines.append('')
    lines.append('| # | Файл | Строк | Тип |')
    lines.append('|---|------|-------|-----|')
    top20 = sorted(files, key=lambda x: -x['lines'])[:20]
    for i, f in enumerate(top20, 1):
        lines.append(f'| {i} | `{f["path"]}` | {f["lines"]:,} | {f["type"]} |')
    lines.append('')

    # ═══════ Структура проекта (дерево) ═══════
    lines.append('## Структура проекта (дерево каталогов)')
    lines.append('')
    lines.append('```')
    lines.append('kursovaya/')

    # Группируем файлы по директориям
    dir_tree = defaultdict(list)
    for f in files:
        parts = f['path'].parts
        if len(parts) > 1:
            dir_path = '/'.join(parts[:-1])
        else:
            dir_path = '.'
        dir_tree[dir_path].append(parts[-1])

    for d in sorted(dir_tree.keys()):
        depth = d.count('/') + (0 if d == '.' else 0)
        indent = '  ' * depth
        dir_name = d.split('/')[-1] if d != '.' else '.'

        # Пропускаем слишком длинные пути
        if depth > 4:
            continue

        lines.append(f'{indent}{dir_name}/')
        for fname in sorted(dir_tree[d]):
            lines.append(f'{indent}  {fname}')

    lines.append('```')
    lines.append('')

    return '\n'.join(lines)


def main():
    print('🔍 Сканирование проекта...')
    files = scan_project()
    print(f'   Найдено {len(files)} файлов')

    print('📝 Генерация отчёта...')
    report = generate_report(files)

    output_path = PROJECT_ROOT / 'PROJECT-REPORT.md'
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(report)

    print(f'✅ Отчёт сохранён: {output_path}')
    print(f'   {len(report.splitlines())} строк в отчёте')


if __name__ == '__main__':
    main()
