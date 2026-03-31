'use strict';

/**
 * Cross-platform project type / framework detection.
 *
 * Scans the file-system root provided (or `process.cwd()`) for well-known
 * project markers and returns structured metadata.
 *
 * Supported languages / frameworks:
 *
 * | Language   | Detected by                                    |
 * |------------|------------------------------------------------|
 * | Python     | `requirements.txt`, `setup.py`, `pyproject.toml`, `*.py` files |
 * | TypeScript | `package.json`, `tsconfig.json`, `*.ts` files  |
 * | JavaScript | `package.json`, `*.js` files (no `tsconfig.json`) |
 * | Go         | `go.mod`, `go.sum`                             |
 * | Rust       | `Cargo.toml`, `Cargo.lock`                     |
 * | Ruby       | `Gemfile`, `Gemfile.lock`, `*.rb` files        |
 * | Java       | `pom.xml`, `build.gradle`, `*.java` files       |
 * | C# / .NET  | `*.csproj`, `*.sln`, `Directory.Build.props`   |
 * | Swift      | `Package.swift`, `*.swift` files                |
 * | Kotlin     | `build.gradle.kts`, `pom.xml` (Kotlin/JVM)     |
 * | Elixir     | `mix.exs`, `*.ex`, `*.exs` files               |
 * | PHP        | `composer.json`, `*.php` files                 |
 */

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Detection functions
// ---------------------------------------------------------------------------

function detectPython(dir) {
  const markers = [
    'requirements.txt', 'setup.py', 'pyproject.toml', 'Pipfile',
    'setup.cfg', 'pyproject.toml', 'tox.ini',
  ];
  const hasMarker = markers.some(f => fs.existsSync(path.join(dir, f)));
  if (!hasMarker) return null;

  // Count Python files
  let pyCount = 0;
  try {
    pyCount = fs.readdirSync(dir).filter(f => f.endsWith('.py')).length;
  } catch { /* ignore */ }

  return {
    language: 'python',
    hasRequirementsTxt: fs.existsSync(path.join(dir, 'requirements.txt')),
    hasSetupPy: fs.existsSync(path.join(dir, 'setup.py')) || fs.existsSync(path.join(dir, 'setup.cfg')),
    hasPyprojectToml: fs.existsSync(path.join(dir, 'pyproject.toml')),
    pythonFileCount: pyCount,
    buildSystem: fs.existsSync(path.join(dir, 'setup.py'))
      ? 'setup.py'
      : fs.existsSync(path.join(dir, 'pyproject.toml'))
        ? 'pyproject.toml'
        : 'requirements.txt',
  };
}

function detectNode(dir) {
  if (!fs.existsSync(path.join(dir, 'package.json'))) return null;

  let isTypeScript = false;
  try {
    isTypeScript = fs.existsSync(path.join(dir, 'tsconfig.json'));
  } catch { /* ignore */ }

  const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };

  // Detect framework
  let framework = null;
  if (deps.next) framework = 'next';
  else if (deps.remix) framework = 'remix';
  else if (deps.nuxt) framework = 'nuxt';
  else if (deps.express || deps.fastify || deps.koa) framework = 'node';
  else if (deps.vite) framework = 'vite';
  else if (deps.esbuild || deps.rollup || deps.webpack) framework = 'bundler';

  return {
    language: isTypeScript ? 'typescript' : 'javascript',
    packageManager: _detectPackageManager(dir),
    framework,
    hasTypeScript: isTypeScript,
    hasEslintConfig: fs.existsSync(path.join(dir, '.eslintrc.js'))
      || fs.existsSync(path.join(dir, '.eslintrc.json'))
      || fs.existsSync(path.join(dir, '.eslintrc.yml')),
  };
}

function detectGo(dir) {
  if (!fs.existsSync(path.join(dir, 'go.mod'))) return null;

  let moduleName = '';
  try {
    const content = fs.readFileSync(path.join(dir, 'go.mod'), 'utf8');
    const match = content.match(/^module\s+(.+)$/m);
    if (match) moduleName = match[1];
  } catch { /* ignore */ }

  return {
    language: 'go',
    moduleName,
    hasGoMod: true,
    hasGoSum: fs.existsSync(path.join(dir, 'go.sum')),
  };
}

function detectRust(dir) {
  if (!fs.existsSync(path.join(dir, 'Cargo.toml'))) return null;

  const cargoToml = fs.readFileSync(path.join(dir, 'Cargo.toml'), 'utf8');
  const nameMatch = cargoToml.match(/^\[package\]\s+name\s*=\s*"([^"]+)"/m);
  const isWorkspace = cargoToml.includes('[workspace]');

  return {
    language: 'rust',
    crateName: nameMatch ? nameMatch[1] : null,
    isWorkspace,
    hasCargoLock: fs.existsSync(path.join(dir, 'Cargo.lock')),
  };
}

function detectRuby(dir) {
  if (!fs.existsSync(path.join(dir, 'Gemfile'))) return null;

  const rubyFiles = [];
  try {
    fs.readdirSync(dir).forEach(f => {
      if (f.endsWith('.rb')) rubyFiles.push(f);
    });
  } catch { /* ignore */ }

  return {
    language: 'ruby',
    hasBundler: fs.existsSync(path.join(dir, 'Gemfile.lock')),
    rubyFileCount: rubyFiles.length,
  };
}

function detectJava(dir) {
  const hasPomXml = fs.existsSync(path.join(dir, 'pom.xml'));
  const hasBuildGradle = fs.existsSync(path.join(dir, 'build.gradle'))
    || fs.existsSync(path.join(dir, 'build.gradle.kts'));
  const hasMaven = fs.existsSync(path.join(dir, 'pom.xml'));

  if (!hasPomXml && !hasBuildGradle) return null;

  let buildTool = null;
  if (hasMaven) buildTool = 'maven';
  else if (hasBuildGradle) buildTool = 'gradle';

  let javaFiles = 0;
  try {
    javaFiles = fs.readdirSync(dir).filter(f => f.endsWith('.java')).length;
  } catch { /* ignore */ }

  return {
    language: 'java',
    buildTool,
    hasSpringBoot: false,
    javaFileCount: javaFiles,
  };
}

function detectCSharp(dir) {
  const hasCsproj = fs.readdirSync(dir).some(f => f.endsWith('.csproj'));
  const hasSln = fs.readdirSync(dir).some(f => f.endsWith('.sln'));
  const hasProps = fs.existsSync(path.join(dir, 'Directory.Build.props'));

  if (!hasCsproj && !hasSln && !hasProps) return null;

  return {
    language: 'c-sharp',
    buildTool: hasSln ? 'msbuild' : 'dotnet',
    hasSdkStyle: hasProps,
  };
}

function detectSwift(dir) {
  if (!fs.existsSync(path.join(dir, 'Package.swift'))) return null;

  return {
    language: 'swift',
    buildTool: 'swift-package-manager',
  };
}

function detectKotlin(dir) {
  const hasBuildGradleKts = fs.existsSync(path.join(dir, 'build.gradle.kts'));
  const hasPomXml = fs.existsSync(path.join(dir, 'pom.xml'));

  if (!hasBuildGradleKts && !hasPomXml) return null;

  return {
    language: 'kotlin',
    buildTool: hasBuildGradleKts ? 'gradle-kotlin' : 'maven',
  };
}

function detectElixir(dir) {
  if (!fs.existsSync(path.join(dir, 'mix.exs'))) return null;

  let exCount = 0;
  try {
    exCount = fs.readdirSync(dir).filter(f => f.endsWith('.ex') || f.endsWith('.exs')).length;
  } catch { /* ignore */ }

  return {
    language: 'elixir',
    hasHexDeps: false,
    elixirFileCount: exCount,
  };
}

function detectPHP(dir) {
  if (!fs.existsSync(path.join(dir, 'composer.json'))) return null;

  let phpFiles = 0;
  try {
    phpFiles = fs.readdirSync(dir).filter(f => f.endsWith('.php')).length;
  } catch { /* ignore */ }

  return {
    language: 'php',
    hasComposerLock: fs.existsSync(path.join(dir, 'composer.lock')),
    phpFileCount: phpFiles,
  };
}

// ---------------------------------------------------------------------------
// Package manager detection (internal)
// ---------------------------------------------------------------------------

function _detectPackageManager(dir) {
  if (fs.existsSync(path.join(dir, 'pnpm-lock.yaml'))) return 'pnpm';
  if (fs.existsSync(path.join(dir, 'bun.lockb'))) return 'bun';
  if (fs.existsSync(path.join(dir, 'yarn.lock'))) return 'yarn';
  return 'npm';
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

/**
 * Detect the project type at `root` (or process.cwd()).
 *
 * Returns a flat object with `language` always set, and additional fields
 * specific to the detected ecosystem. Returns `null` if no known project
 * type is detected.
 *
 * @param {string} [root]
 * @returns {object | null}
 */
function detectProjectType(root) {
  const dir = root || process.cwd();

  const detectors = [
    detectPython,
    detectNode,
    detectGo,
    detectRust,
    detectRuby,
    detectJava,
    detectCSharp,
    detectSwift,
    detectKotlin,
    detectElixir,
    detectPHP,
  ];

  for (const detector of detectors) {
    const result = detector(dir);
    if (result) return result;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

module.exports = { detectProjectType };
