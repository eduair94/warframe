import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { runInNewContext } from 'node:vm'
import { compileScript, compileTemplate, parse } from '@vue/compiler-sfc'
import * as vue from 'vue'
import * as renderer from 'vue/server-renderer'
import ts from 'typescript'

// Compile both halves of a real SFC. Template-only stubs miss setup helpers and
// props bindings, so they cannot faithfully exercise components used during SSR.
export async function loadSsrComponent(url, globals = {}) {
  const filename = url.pathname.split('/').at(-1)
  const parsed = parse(await readFile(url, 'utf8'), { filename })
  assert.deepEqual(parsed.errors, [])
  const script = compileScript(parsed.descriptor, { id: filename })
  const template = compileTemplate({
    source: parsed.descriptor.template.content, filename, id: filename,
    ssr: true, ssrCssVars: [], compilerOptions: { bindingMetadata: script.bindings },
  })
  assert.deepEqual(template.errors, [])
  const execute = source => {
    const context = { ...globals, exports: {}, require: name => {
      assert.ok(['vue', 'vue/server-renderer'].includes(name), `Unsupported SFC import: ${name}`)
      return name === 'vue' ? vue : renderer
    } }
    runInNewContext(ts.transpileModule(source, {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
    }).outputText, context)
    return context.exports
  }
  return { ...execute(script.content).default, ssrRender: execute(template.code).ssrRender }
}
