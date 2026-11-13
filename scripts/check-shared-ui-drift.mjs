#!/usr/bin/env node
/**
 * Guards UI that is still copied between apps.
 *
 * These files are app-local because they depend on app-specific libraries
 * (dayjs, v-calendar) or carry app-specific copy. Until they move into
 * `packages/ui`, the copies must stay identical: a fix applied to one app and
 * not the other is a silent divergence.
 *
 * `desktop-guard.vue` is intentionally different per app (product copy), so it
 * is not compared.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const webRoot = fileURLToPath(new URL('..', import.meta.url))
const APPS = ['seller', 'admin']
const SHARED_PATHS = ['date-picker.vue', 'date-filter']

function collectFiles(root, target) {
  const absolute = join(root, 'src/shared/ui', target)
  const stat = statSync(absolute, { throwIfNoEntry: false })

  if (!stat) {
    return {}
  }

  if (stat.isFile()) {
    return { [target]: readFileSync(absolute, 'utf8') }
  }

  const files = {}

  for (const entry of readdirSync(absolute, { withFileTypes: true })) {
    if (!entry.isFile()) {
      continue
    }

    const relativePath = join(target, entry.name)
    files[relativePath] = readFileSync(join(absolute, entry.name), 'utf8')
  }

  return files
}

const snapshots = APPS.map((appName) => {
  const appRoot = join(webRoot, 'apps', appName)
  const files = {}

  for (const target of SHARED_PATHS) {
    Object.assign(files, collectFiles(appRoot, target))
  }

  return { appName, files }
})

const [reference, ...others] = snapshots
const failures = []

for (const other of others) {
  const allPaths = new Set([...Object.keys(reference.files), ...Object.keys(other.files)])

  for (const relativePath of [...allPaths].sort()) {
    const expected = reference.files[relativePath]
    const actual = other.files[relativePath]

    if (expected === undefined) {
      failures.push(`apps/${other.appName}/src/shared/ui/${relativePath} has no counterpart in apps/${reference.appName}`)
      continue
    }

    if (actual === undefined) {
      failures.push(`apps/${reference.appName}/src/shared/ui/${relativePath} has no counterpart in apps/${other.appName}`)
      continue
    }

    if (expected !== actual) {
      failures.push(`${relativePath} differs between apps/${reference.appName} and apps/${other.appName}`)
    }
  }
}

if (failures.length > 0) {
  console.error('Shared UI drift check failed:')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  console.error('Apply the change to both apps, or promote the file into packages/ui.')
  process.exit(1)
}

console.log('Shared UI drift check passed')
