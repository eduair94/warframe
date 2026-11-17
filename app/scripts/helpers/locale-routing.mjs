import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { runInNewContext } from 'node:vm'
import * as vue from 'vue'
import * as routerApi from 'vue-router'
import * as ufo from 'ufo'
import * as shared from '@intlify/shared'
import ts from 'typescript'

export const compile = source => ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText

export function declarations(source, names) {
  const ast = ts.createSourceFile('test-source.ts', source, ts.ScriptTarget.Latest, true)
  return names.map(name => {
    const node = ast.statements.find(node => ts.isFunctionDeclaration(node)
      ? node.name?.text === name
      : ts.isVariableStatement(node) && node.declarationList.declarations.some(d => d.name.getText(ast) === name))
    assert.ok(node, `actual declaration ${name}`)
    return node.getText(ast)
  }).join('\n')
}

const read = path => readFile(new URL('../../' + path, import.meta.url), 'utf8')
const config = await read('nuxt.config.ts')
const configContext = { exports: {} }
runInNewContext(compile(declarations(config, ['LOCALES']) + '\nexports.locales = LOCALES;'), configContext)
export const locales = Array.from(configContext.exports.locales, locale => locale.code)
assert.equal(locales.length, 13)
assert.match(config, /strategy:\s*'prefix_except_default'/)
assert.match(config, /defaultLocale:\s*'en'/)

// Use the installed Nuxt i18n resolver and real Vue Router. Only Nuxt-specific
// imports are omitted; route names, queries, fragments and normalization run as shipped.
const runtime = 'node_modules/@nuxtjs/i18n/dist/runtime/'
const i18nCode = [
  declarations(await read(runtime + 'routing/routing.js'), ['localePath', 'getRouteBaseName', 'normalizeRawLocation', 'isRouteLocationPathRaw', 'resolveRouteObject', 'resolveRoute', 'resolve']),
  declarations(await read(runtime + 'routing/utils.js'), ['getRouteName', 'getLocaleRouteName']),
  declarations(await read(runtime + 'utils.js'), ['prefixable']),
  declarations(await read(runtime + 'compatibility.js'), ['isI18nInstance', 'getI18nTarget']),
  'exports.resolveLocalePath = localePath;',
].join('\n')
const i18nContext = { exports: {}, ...ufo, ...shared, unref: vue.unref, isNavigationFailure: routerApi.isNavigationFailure }
runInNewContext(compile(i18nCode), i18nContext)

export async function createLocalizedRouting(locale, routePaths) {
  const router = routerApi.createRouter({ history: routerApi.createMemoryHistory(), routes: locales.flatMap(code => routePaths.map((path, i) => ({
    name: `page-${i}___${code}`,
    path: (code === 'en' ? '' : `/${code}`) + path,
    component: { render: () => null },
  }))) })
  const localeRef = vue.ref(locale)
  const common = { router, i18n: { locale: localeRef }, runtimeConfig: { public: { i18n: {
    defaultLocale: 'en', strategy: 'prefix_except_default', differentDomains: false,
    routesNameSeparator: '___', defaultLocaleRouteNameSuffix: 'default', trailingSlash: false,
  } } } }
  await router.push((locale === 'en' ? '' : `/${locale}`) + routePaths[0])
  const localePath = path => i18nContext.exports.resolveLocalePath(common, path)
  return { router, localePath, localeRef }
}
