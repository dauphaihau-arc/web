#!/usr/bin/env node
/**
 * Enforces web source ownership rules:
 * - app source may not import another app's source
 * - lower layers may not import higher layers (`shared` -> `domains` -> `app`)
 * - storefront pages may not import another page's private `_components`
 * - workspace packages may not import app source
 * - source may not use raw gray palette classes or CSS variables; use semantic tokens
 *   (dark: variants are exempt because there is no dark-mode token layer)
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, extname, isAbsolute, join, normalize, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const appsRoot = join(webRoot, 'apps')
const packagesRoot = join(webRoot, 'packages')

const appNames = ['seller', 'storefront']
const sourceExtensions = new Set(['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.mts', '.cts', '.vue'])
const ignoredDirs = new Set(['.git', '.nuxt', '.output', '.turbo', 'coverage', 'dist', 'node_modules'])
const importPatterns = [
  /(?:^|[^\w$])import\s+(?:type\s+)?(?:[^'"()]*?\s+from\s+)?['"]([^'"]+)['"]/gs,
  /(?:^|[^\w$])export\s+(?:type\s+)?[^'"()]*?\s+from\s+['"]([^'"]+)['"]/gs,
  /(?:^|[^\w$])import\s*\(\s*['"]([^'"]+)['"]\s*\)/gs,
]

const grayScanExtensions = new Set([...sourceExtensions, '.css'])
const rawGrayClassPattern =
  /(?<![\w-])(bg|text|border|ring|divide|from|to|via|outline|fill|stroke|shadow|placeholder|caret)-(gray|zinc|slate|neutral|stone)-(?:50|[1-9]00|950)(?![\w-])/g
const grayVariablePattern = /var\(--color-gray-/g
const retiredGrayPattern = /customGray/g
const tokenFiles = new Set([
  'packages/ui/src/foundation/design-tokens.ts',
  'packages/ui/src/foundation/design-tokens.css',
  'packages/ui/src/foundation/design-tokens.spec.ts',
])
const grayTokenMessage = 'use semantic tokens (bg-surface-*, border-border-*, text-text-*, state-*)'

const violations = []

for (const appName of appNames) {
  checkApp(appName)
}
checkPackagesDoNotImportApps()
checkGrayPalette()

if (violations.length > 0) {
  console.error('Web architecture check failed:')
  for (const violation of violations) {
    console.error(`- ${violation.file}:${violation.line} ${violation.message}`)
  }
  process.exit(1)
}

console.log('Web architecture check passed')

function checkApp(appName) {
  const appRoot = join(appsRoot, appName)
  const srcRoot = join(appRoot, 'src')

  for (const file of collectSourceFiles(srcRoot)) {
    const fromLayer = getSrcLayer(srcRoot, file)
    const imports = readImports(file)

    for (const imported of imports) {
      const target = resolveAppImport(appRoot, srcRoot, dirname(file), imported.specifier)
      const crossAppName = getImportedAppName(imported.specifier, appName)

      if (crossAppName) {
        addViolation(file, imported.line, `must not import ${crossAppName} app source (${imported.specifier})`)
        continue
      }

      if (!target || !isInside(srcRoot, target)) {
        continue
      }

      const toLayer = getSrcLayer(srcRoot, target)
      if (isForbiddenSrcImport(fromLayer, toLayer)) {
        addViolation(file, imported.line, `${fromLayer}/ must not import ${toLayer}/ (${imported.specifier})`)
      }

      if (appName === 'storefront') {
        const pagePrivateOwner = getPagePrivateComponentOwner(srcRoot, target)
        if (pagePrivateOwner && !isInsidePageOwner(srcRoot, file, pagePrivateOwner)) {
          addViolation(file, imported.line, `must not import another page's private component (${imported.specifier})`)
        }
      }
    }
  }
}

function checkPackagesDoNotImportApps() {
  if (!existsSync(packagesRoot)) {
    return
  }

  for (const file of collectSourceFiles(packagesRoot)) {
    for (const imported of readImports(file)) {
      const target = resolvePackageImport(dirname(file), imported.specifier)
      const importedAppName = appNames.find((appName) => target && isInside(join(appsRoot, appName), target))
      const workspaceAppName = getWorkspaceAppName(imported.specifier)

      if (importedAppName || workspaceAppName) {
        addViolation(file, imported.line, `packages/ must not import app source (${imported.specifier})`)
      }
    }
  }
}

function checkGrayPalette() {
  const roots = [
    ...appNames.map((appName) => join(appsRoot, appName, 'src')),
    join(packagesRoot, 'ui', 'src'),
  ]

  for (const root of roots) {
    for (const file of collectSourceFiles(root, grayScanExtensions)) {
      if (isExemptFromGrayRules(file)) {
        continue
      }

      reportGrayViolations(file)
    }
  }
}

function isExemptFromGrayRules(file) {
  const relativePath = relative(webRoot, file).split(sep).join('/')

  if (relativePath.startsWith('packages/ui/scripts/')) {
    return true
  }

  return tokenFiles.has(relativePath)
}

function reportGrayViolations(file) {
  const source = readFileSync(file, 'utf8')

  reportPattern(source, retiredGrayPattern, (match) => `${match[0]} is retired; ${grayTokenMessage}`)
  reportPattern(source, grayVariablePattern, () => `must not use raw gray CSS variable (var(--color-gray-*)); ${grayTokenMessage}`)
  reportPattern(source, rawGrayClassPattern, (match) => {
    if (isDarkPrefixed(source, match.index)) {
      return null
    }

    return `must not use raw gray palette class (${match[0]}); ${grayTokenMessage}`
  })

  function reportPattern(text, pattern, messageFor) {
    pattern.lastIndex = 0
    let match

    while ((match = pattern.exec(text)) !== null) {
      const message = messageFor(match)
      if (message) {
        addViolation(file, lineForIndex(text, match.index), message)
      }
    }
  }
}

function isDarkPrefixed(source, index) {
  const separators = new Set(' \t\n\r\'"`()<>{}[],;='.split(''))
  let start = index

  while (start > 0 && !separators.has(source[start - 1])) {
    start -= 1
  }

  const variants = source.slice(start, index).split(':').slice(0, -1)
  return variants.includes('dark')
}

function isForbiddenSrcImport(fromLayer, toLayer) {
  if (!fromLayer || !toLayer) {
    return false
  }

  return layerRank(toLayer) > layerRank(fromLayer)
}

function layerRank(layer) {
  switch (layer) {
    case 'app':
      return 3
    case 'domains':
      return 2
    case 'shared':
      return 1
    default:
      return 0
  }
}

function getSrcLayer(srcRoot, file) {
  const parts = relative(srcRoot, file).split(sep)
  const first = parts[0]

  if (first === 'domains' || first === 'shared') {
    return first
  }

  if (first === 'app' || first === 'app.vue' || first === 'app.config.ts' || first === 'error.vue') {
    return 'app'
  }

  return null
}

function getPagePrivateComponentOwner(srcRoot, file) {
  const parts = relative(srcRoot, file).split(sep)
  if (parts[0] !== 'app' || parts[1] !== 'pages') {
    return null
  }

  const componentsIndex = parts.indexOf('_components')
  if (componentsIndex < 0) {
    return null
  }

  return parts.slice(2, componentsIndex)
}

function isInsidePageOwner(srcRoot, file, ownerParts) {
  const parts = relative(srcRoot, file).split(sep)
  if (parts[0] !== 'app' || parts[1] !== 'pages') {
    return false
  }

  return ownerParts.every((part, index) => parts[index + 2] === part)
}

function resolveAppImport(appRoot, srcRoot, importerDir, specifier) {
  if (specifier.startsWith('~/') || specifier.startsWith('@/')) {
    return resolveImportPath(join(srcRoot, specifier.slice(2)))
  }

  if (specifier === '~' || specifier === '@') {
    return srcRoot
  }

  if (specifier.startsWith('./') || specifier.startsWith('../')) {
    return resolveImportPath(resolve(importerDir, specifier))
  }

  if (specifier.startsWith('/')) {
    return resolveImportPath(resolve(appRoot, specifier.slice(1)))
  }

  return null
}

function resolvePackageImport(importerDir, specifier) {
  if (specifier.startsWith('./') || specifier.startsWith('../')) {
    return resolveImportPath(resolve(importerDir, specifier))
  }

  if (specifier.startsWith('/')) {
    return resolveImportPath(resolve(webRoot, specifier.slice(1)))
  }

  return null
}

function resolveImportPath(basePath) {
  const candidates = [
    basePath,
    ...['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.vue'].map((extension) => `${basePath}${extension}`),
    ...['index.ts', 'index.tsx', 'index.js', 'index.jsx', 'index.mjs', 'index.cjs', 'index.vue'].map((file) => join(basePath, file)),
  ]

  return candidates.find((candidate) => existsSync(candidate)) ?? normalize(basePath)
}

function getImportedAppName(specifier, currentAppName) {
  for (const appName of appNames) {
    if (appName === currentAppName) {
      continue
    }

    if (specifier.includes(`/apps/${appName}/`) || specifier.startsWith(`@arc/${appName}`)) {
      return appName
    }
  }

  return null
}

function getWorkspaceAppName(specifier) {
  for (const appName of appNames) {
    if (specifier.startsWith(`@arc/${appName}`)) {
      return appName
    }
  }

  return null
}

function collectSourceFiles(root, extensions = sourceExtensions) {
  if (!existsSync(root)) {
    return []
  }

  const files = []
  const stack = [root]

  while (stack.length > 0) {
    const current = stack.pop()
    const stat = statSync(current)

    if (stat.isDirectory()) {
      if (ignoredDirs.has(current.split(sep).at(-1))) {
        continue
      }

      for (const entry of readdirSync(current)) {
        stack.push(join(current, entry))
      }
      continue
    }

    if (stat.isFile() && extensions.has(extname(current))) {
      files.push(current)
    }
  }

  return files
}

function readImports(file) {
  const source = stripComments(readFileSync(file, 'utf8'))
  const imports = []

  for (const pattern of importPatterns) {
    pattern.lastIndex = 0
    let match
    while ((match = pattern.exec(source)) !== null) {
      imports.push({ specifier: match[1], line: lineForIndex(source, match.index) })
    }
  }

  return imports
}

function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (match) => '\n'.repeat(match.split('\n').length - 1))
    .replace(/(^|[^:])\/\/.*$/gm, '$1')
}

function lineForIndex(source, index) {
  let line = 1
  for (let i = 0; i < index; i += 1) {
    if (source.charCodeAt(i) === 10) {
      line += 1
    }
  }
  return line
}

function addViolation(file, line, message) {
  violations.push({ file: relative(webRoot, file), line, message })
}

function isInside(parent, child) {
  const relativePath = relative(parent, child)
  return relativePath === '' || (!relativePath.startsWith('..') && !isAbsolute(relativePath))
}
