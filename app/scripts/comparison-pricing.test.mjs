import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import { parse, compileTemplate } from '@vue/compiler-sfc'
import { parse as parseHtml } from '@vue/compiler-dom'
import * as vue from 'vue'
import * as renderer from 'vue/server-renderer'
import { createI18n } from 'vue-i18n'
import ts from 'typescript'
import messages from '../i18n/messages/comparison.ts'
import * as pricing from '../app/utils/comparison-pricing.ts'

const compile = source => ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText
const page = parse(await readFile(new URL('../app/pages/comparison.vue', import.meta.url), 'utf8')).descriptor
const script = ts.createSourceFile('comparison.vue', page.scriptSetup.content, ts.ScriptTarget.Latest, true)
const declarations = new Map()
for (const statement of script.statements) {
  if (ts.isVariableStatement(statement)) for (const declaration of statement.declarationList.declarations) {
    declarations.set(declaration.name.getText(script), `const ${declaration.getText(script)};`)
  }
  else if (ts.isFunctionDeclaration(statement) && statement.name) declarations.set(statement.name.text, statement.getText(script))
}
const names = ['sets','search','minVolume','category','sortKey','onlyPartsCheaper','onlyResellHigher','page','perPage',
  'categoryOf','fmtPlat','fmtQuote','fmtDifference','fmtPct','signed','deltaCls','verdict','verdictKey',
  'sortOptions','categoryOptions','filtered','fallbackRows','pageCount','paged','topDeal','topDealUrl','stats','assetUrl']
const code = compile(names.map(name => {
  assert.ok(declarations.has(name), `actual comparison page binding: ${name}`)
  return declarations.get(name)
}).join('\n') + `\nexports.setup = { ${names.join(',')} };`)

function fixture(slug, {setAsk=100, partsAsk=70, setBid=60, partsBid=80, askMissing=0, bidMissing=0} = {}) {
  return {
    url_name: slug, item_name: `${slug} Set`, thumb: '', tags: ['warframe'], partsCount: 3,
    missingParts: Math.max(askMissing,bidMissing), set: {volume: 20},
    // Deliberately include misleading legacy differences: the page must derive
    // its own values only after validating directional quote coverage.
    acquire: {setCost:setAsk,partsCost:partsAsk,missingParts:askMissing,save:100,savePct:100},
    resale: {setValue:setBid,partsValue:partsBid,missingParts:bidMissing,extra:100,extraPct:100},
  }
}
function setup(rows, locale='en') {
  const i18n = createI18n({legacy:false,locale,messages})
  const context = {exports:{},...pricing,ref:vue.ref,computed:vue.computed,data:vue.ref({sets:rows}),
    localItemName: row => row.item_name, t:i18n.global.t}
  runInNewContext(code,context)
  return { bindings: context.exports.setup, i18n }
}

test('all missing and partial part asks cannot create free-part savings', () => {
  const {bindings:b}=setup([fixture('Amesha',{partsAsk:0,askMissing:3}),fixture('Rauta',{partsAsk:65,askMissing:2})])
  assert.equal(b.topDeal.value,null)
  assert.equal(b.topDealUrl.value,'')
  assert.equal(b.stats.value.total,0)
  assert.equal(b.stats.value.avgSavePct,null)
  for(const row of b.sets.value) {
    assert.equal(row.acquire.partsCost,null)
    assert.equal(row.acquire.save,null)
    assert.equal(b.verdict(row).label,'Not enough prices')
    assert.equal(b.verdict(row).amount,'')
    assert.equal(b.verdictKey(row),'unavailable')
    assert.equal(b.fmtQuote(row.acquire.partsCost),'Unavailable')
  }
})

test('ask and bid coverage are independent, and each opportunity filter respects it', () => {
  const {bindings:b}=setup([fixture('Ask only',{partsBid:0,bidMissing:3}),fixture('Bid only',{partsAsk:0,askMissing:3})])
  assert.equal(b.stats.value.total,1)
  b.onlyPartsCheaper.value=true
  assert.deepEqual(Array.from(b.filtered.value,r=>r.url_name),['Ask only'])
  b.onlyPartsCheaper.value=false
  b.onlyResellHigher.value=true
  assert.deepEqual(Array.from(b.filtered.value,r=>r.url_name),['Bid only'])
})

test('known negative savings precede unknown rows in every deal sort', () => {
  const {bindings:b}=setup([fixture('Unknown',{askMissing:1,bidMissing:1}),fixture('Set cheaper',{partsAsk:110,partsBid:50})])
  for(const sort of ['dealPct','dealPlat','resale']) {
    b.sortKey.value=sort
    assert.deepEqual(Array.from(b.filtered.value,r=>r.url_name),['Set cheaper','Unknown'])
  }
  assert.equal(b.stats.value.setCheaper,1)
  assert.equal(b.stats.value.partsCheaper,0)
})

test('a missing set quote preserves known part totals without a verdict or delta', () => {
  const {bindings:b}=setup([fixture('No set',{setAsk:0,setBid:null})])
  const row=b.sets.value[0]
  assert.equal(row.acquire.partsCost,70)
  assert.equal(row.resale.partsValue,80)
  assert.equal(row.acquire.save,null)
  assert.equal(row.resale.extra,null)
  assert.equal(b.fmtDifference(row.resale.extra),'Unavailable')
  assert.equal(b.deltaCls(row.resale.extra),'flat')
})

test('fully priced rows retain arithmetic, a real even verdict and honest statistics', () => {
  const {bindings:b}=setup([fixture('Parts cheaper'),fixture('Set cheaper',{partsAsk:110}),fixture('Even',{partsAsk:100,partsBid:60}),fixture('Unknown',{askMissing:1})])
  assert.equal(b.stats.value.total,3)
  assert.equal(b.stats.value.partsCheaper,1)
  assert.equal(b.stats.value.setCheaper,1)
  assert.equal(b.stats.value.avgSavePct,30)
  assert.equal(b.topDeal.value.url_name,'Parts cheaper')
  assert.equal(b.topDealUrl.value,'Parts cheaper')
  assert.equal(b.verdict(b.sets.value[2]).label,'Even')
  assert.equal(b.fmtDifference(b.sets.value[2].resale.extra),'0p')
})

test('old cache payloads without directional coverage fail closed until refreshed', () => {
  const old=fixture('Legacy')
  delete old.acquire.missingParts
  delete old.resale.missingParts
  const {bindings:b}=setup([old])
  assert.equal(b.sets.value[0].acquire.setCost,100)
  assert.equal(b.sets.value[0].acquire.partsCost,null)
  assert.equal(b.stats.value.total,0)
  assert.equal(b.topDeal.value,null)
})

test('non-numeric, non-positive and non-finite quotes never become recommendations', () => {
  for(const value of [0,-1,NaN,Infinity,'10']) {
    const row=pricing.normalizeComparisonRow(fixture('Invalid',{partsAsk:value,partsBid:value}))
    assert.equal(row.acquire.save,null)
    assert.equal(row.resale.extra,null)
  }
  const missing=fixture('Absent'); delete missing.acquire.partsCost
  assert.equal(pricing.normalizeComparisonRow(missing).acquire.save,null)
})

function render(source,filename) {
  const compiled=compileTemplate({source,filename,id:filename,ssr:true,ssrCssVars:[]})
  assert.deepEqual(compiled.errors,[])
  const context={exports:{},require:name=>{
    assert.ok(['vue','vue/server-renderer'].includes(name))
    return name==='vue'?vue:renderer
  }}
  runInNewContext(compile(compiled.code),context)
  return context.exports.ssrRender
}
const ssrRender=render(page.template.content,'comparison.vue')
const fallback=parse(await readFile(new URL('../app/components/SeoFallbackTable.vue',import.meta.url),'utf8')).descriptor.template
const text=node=>node.type===2?node.content:(node.children??[]).map(text).join('')
const elements=(node,tag)=>[...(node.type===1&&node.tag===tag?[node]:[]),...(node.children??[]).flatMap(child=>elements(child,tag))]

for(const locale of ['en','es']) for(const mode of ['server','desktop','mobile']) {
  test(`${locale}/${mode}: real page renders unavailable prices and keeps the complete row`,async()=>{
    const {bindings:b,i18n}=setup([fixture('Amesha',{partsAsk:0,partsBid:0,askMissing:3,bidMissing:3}),fixture('Xiphos',{setAsk:1500,partsAsk:50})],locale)
    const app=vue.createSSRApp({ssrRender,setup:()=>({ ...b,t:i18n.global.t,localItemName:r=>r.item_name,
      mobile:mode==='mobile',loadError:false,onSetNav:()=>{},onImgError:()=>{},onSortChange:()=>{},onCategoryChange:()=>{},onFilterToggle:()=>{},onPageChange:()=>{} })})
    app.use(i18n)
    app.component('ClientOnly',{setup:(_, {slots})=>()=>mode==='server'?slots.fallback?.()??vue.h('span'):slots.default?.()})
    app.component('SeoFallbackTable',{props:['caption','nameLabel','columns','rows'],ssrRender:render(fallback.content,'SeoFallbackTable.vue')})
    app.component('NuxtLink',{props:['to'],setup:(props,{slots})=>()=>vue.h('a',{href:props.to},slots.default?.())})
    for(const tag of new Set([...page.template.content.matchAll(/<(v-[a-z-]+)/g)].map(m=>m[1]))) app.component(tag,{setup:(_, {slots})=>()=>vue.h('div',slots.default?.())})
    const warnings=[];app.config.warnHandler=message=>warnings.push(message)
    const html=await renderer.renderToString(app)
    const tree=parseHtml(html)
    const rows=mode==='mobile'?elements(tree,'a').filter(node=>node.props.some(p=>p.name==='class'&&p.value?.content.includes('an-card'))):elements(tree,'tr')
    const amesha=rows.find(node=>text(node).includes('Amesha'))
    assert.ok(amesha,'missing-price item remains discoverable')
    assert.ok(text(amesha).includes(messages[locale].comparison.unavailable))
    assert.ok(!elements(amesha,mode==='mobile'?'b':'td').some(node=>text(node)==='0p'),'unknown part totals must not be displayed as zero')
    assert.ok(!text(amesha).includes('100%'))
    if(mode!=='server') assert.ok(text(amesha).includes(messages[locale].comparison.incomplete))
    assert.ok(rows.some(node=>text(node).includes('Xiphos')&&text(node).includes('1,500p')&&text(node).includes('50p')))
    assert.ok(html.includes(messages[locale].comparison.pricingNote))
    assert.equal(elements(tree,'h1').length,1)
    assert.deepEqual(warnings,[])
  })
}
