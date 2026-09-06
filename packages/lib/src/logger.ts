import { createConsola } from 'consola'

const logLevels = {
  silent: -999,
  error: 0,
  warn: 1,
  log: 2,
  info: 3,
  debug: 4,
  trace: 5,
} as const

type LogLevelName = keyof typeof logLevels

type LoggerImportMeta = ImportMeta & {
  env?: {
    MODE?: string
    NUXT_PUBLIC_LOG_LEVEL?: string
  }
}

const env = (import.meta as LoggerImportMeta).env

const defaultLogLevel: LogLevelName =
  env?.MODE === 'production'
    ? 'error'
    : env?.MODE === 'test'
      ? 'silent'
      : 'debug'

const configuredLogLevel = env?.NUXT_PUBLIC_LOG_LEVEL as LogLevelName | undefined

const level =
  logLevels[configuredLogLevel ?? defaultLogLevel] ?? logLevels[defaultLogLevel]

export const log = createConsola({
  level,
})
