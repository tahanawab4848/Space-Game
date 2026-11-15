import { spawn } from 'node:child_process'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const viteCli = resolve(root, 'node_modules/vite/bin/vite.js')
const children = [
  spawn(process.execPath, [resolve(root, 'server/index.js')], { cwd: root, stdio: 'inherit', env: process.env }),
  spawn(process.execPath, [viteCli, '--host', '127.0.0.1'], { cwd: root, stdio: 'inherit', env: process.env }),
]
let stopping = false
const stop = (code = 0) => {
  if (stopping) return
  stopping = true
  for (const child of children) if (!child.killed) child.kill('SIGTERM')
  process.exitCode = code
}
for (const child of children) {
  child.on('error', (error) => { console.error(error); stop(1) })
  child.on('exit', (code) => { if (!stopping) stop(code || 0) })
}
process.on('SIGINT', () => stop(0))
process.on('SIGTERM', () => stop(0))
