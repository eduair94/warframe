<!-- /foundry — Foundry & Mastery tracker. One optional catch-all serves the
     overview (/foundry), the raw-resource ledger (/foundry/resources) and the
     seven per-category checklists (/foundry/primary, …). All maths lives in
     composables/useFoundryProgress.ts; warframe-foundry.app interop lives in
     utils/foundryFormat.ts. Progress is local-first (localStorage) and syncs to
     the account when signed in — see composables/useUserData.ts. -->
<template>
  <div class="an fo">
    <client-only>
      <template #fallback>
        <div class="an-console">
          <header class="an-hero">
            <div class="an-hero__text">
              <div class="an-eyebrow">{{ t('foundry.eyebrow') }}</div>
              <i18n-t keypath="foundry.hero.title" tag="h1" class="an-title">
                <template #mastery><span class="accent-b">{{ t('foundry.hero.mastery') }}</span></template>
                <template #plat><span class="accent-a">{{ t('foundry.hero.plat') }}</span></template>
              </i18n-t>
              <p class="an-lede">{{ t('foundry.hero.lede') }}</p>
            </div>
          </header>
        </div>
      </template>

      <div class="an-console">
        <!-- Hero -->
        <header class="an-hero">
          <div class="an-hero__text">
            <div class="an-eyebrow">{{ t('foundry.eyebrow') }}</div>
            <i18n-t keypath="foundry.hero.title" tag="h1" class="an-title">
              <template #mastery><span class="accent-b">{{ t('foundry.hero.mastery') }}</span></template>
              <template #plat><span class="accent-a">{{ t('foundry.hero.plat') }}</span></template>
            </i18n-t>
            <p class="an-lede">{{ t('foundry.hero.lede') }}</p>
            <p v-if="!auth.signedIn" class="fo-sync">
              {{ t('foundry.data.signedOut') }}
              <nuxt-link :to="localePath('/account')" @click="trackAction('foundry_sync_cta')">
                {{ t('foundry.data.signedOutLink') }} →
              </nuxt-link>
            </p>
          </div>
          <div class="an-hero__deal">
            <div class="an-hero__deal-label">{{ t('foundry.hero.rankLabel') }}</div>
            <div class="an-hero__deal-plat">{{ summary.rank.label }}<span>{{ t('foundry.hero.mrShort') }}</span></div>
            <div class="an-hero__deal-name">{{ t('foundry.hero.points', { n: fmtInt(summary.points) }) }}</div>
            <div class="an-hero__deal-sub">{{ nextRankLine }}</div>
          </div>
        </header>

        <!-- Stats -->
        <div class="an-stats">
          <div class="an-stat">
            <div class="an-stat__num">{{ fmtInt(summary.mastered) }}<small>/{{ fmtInt(summary.total) }}</small></div>
            <div class="an-stat__lbl">{{ t('foundry.stats.mastered') }}</div>
          </div>
          <div class="an-stat">
            <div class="an-stat__num is-alt">{{ fmtInt(summary.built) }}</div>
            <div class="an-stat__lbl">{{ t('foundry.stats.built') }}</div>
          </div>
          <div class="an-stat">
            <div class="an-stat__num is-good">{{ pct(summary.ratio) }}</div>
            <div class="an-stat__lbl">{{ t('foundry.stats.complete') }}</div>
          </div>
          <div class="an-stat">
            <div class="an-stat__num is-gold">{{ fmtInt(summary.points) }}</div>
            <div class="an-stat__lbl">{{ t('foundry.stats.points') }}</div>
          </div>
        </div>

        <!-- Tab strip -->
        <nav class="fo-tabs" :aria-label="t('foundry.tabs.aria')">
          <nuxt-link
            class="fo-tab"
            :class="{ 'fo-tab--on': tab === '' }"
            :aria-current="tab === '' ? 'page' : undefined"
            :to="localePath('/foundry')"
            @click="onTab('overview')"
          >{{ t('foundry.tabs.overview') }}</nuxt-link>
          <nuxt-link
            v-for="c in CATEGORIES"
            :key="c"
            class="fo-tab"
            :class="{ 'fo-tab--on': tab === c }"
            :aria-current="tab === c ? 'page' : undefined"
            :to="localePath('/foundry/' + c)"
            @click="onTab(c)"
          >
            {{ t('foundry.cat.' + c) }}<span class="fo-tab__n">{{ fmtInt(counts[c] || 0) }}</span>
          </nuxt-link>
          <nuxt-link
            class="fo-tab"
            :class="{ 'fo-tab--on': tab === 'resources' }"
            :aria-current="tab === 'resources' ? 'page' : undefined"
            :to="localePath('/foundry/resources')"
            @click="onTab('resources')"
          >{{ t('foundry.tabs.resources') }}</nuxt-link>
        </nav>

        <!-- Loading skeletons -->
        <div v-if="loading" class="fo-skels">
          <div v-for="n in 8" :key="'sk' + n" class="fo-skel"></div>
        </div>

        <!-- Catalogue not synced yet (fresh deployment / API hiccup) -->
        <div v-else-if="notReady" class="an-empty">{{ t('foundry.notReady') }}</div>

        <!-- ================= OVERVIEW ================= -->
        <template v-else-if="tab === ''">
          <section class="an-filters fo-panel">
            <h2 class="fo-h2">{{ t('foundry.progress.title') }}</h2>
            <div class="fo-bars">
              <nuxt-link
                v-for="row in categoryRows"
                :key="row.category"
                class="fo-barrow"
                :to="localePath('/foundry/' + row.category)"
                :aria-label="t('foundry.progress.open', { category: t('foundry.cat.' + row.category) })"
                @click="onTab(row.category)"
              >
                <span class="fo-barrow__lbl">{{ t('foundry.cat.' + row.category) }}</span>
                <span class="fo-bar"><i :style="{ width: pct(row.ratio) }"></i></span>
                <span class="fo-barrow__n">{{ t('foundry.progress.ratio', { done: fmtInt(row.mastered), total: fmtInt(row.total) }) }}</span>
              </nuxt-link>
            </div>
          </section>

          <!-- Plat to finish — the differentiator -->
          <section class="fo-panel">
            <h2 class="fo-h2">{{ t('foundry.plat.title') }}</h2>
            <p class="fo-help">{{ t('foundry.plat.lede') }}</p>
            <div class="fo-mini">
              <div class="fo-mini__cell">
                <div class="fo-mini__num is-gold">{{ fmtInt(missingTotals.plat) }}</div>
                <div class="fo-mini__lbl">{{ t('foundry.plat.total') }}</div>
              </div>
              <div class="fo-mini__cell">
                <div class="fo-mini__num">{{ fmtInt(missingTotals.priced) }}</div>
                <div class="fo-mini__lbl">{{ t('foundry.plat.priced', { n: fmtInt(missingTotals.items) }) }}</div>
              </div>
              <div class="fo-mini__cell">
                <div class="fo-mini__num is-good">{{ fmtInt(missingTotals.points) }}</div>
                <div class="fo-mini__lbl">{{ t('foundry.plat.points') }}</div>
              </div>
            </div>

            <div v-if="!missingTotals.items" class="an-empty">{{ t('foundry.plat.done') }}</div>
            <div v-else-if="!bestValueRows.length" class="an-empty">{{ t('foundry.plat.none') }}</div>
            <div v-else class="an-tablewrap">
              <h3 class="fo-h3">{{ t('foundry.plat.bestTitle') }}</h3>
              <table class="an-table is-cards">
                <thead>
                  <tr>
                    <th class="col-name">{{ t('foundry.plat.col.item') }}</th>
                    <th>{{ t('foundry.plat.col.category') }}</th>
                    <th class="grp-a">{{ t('foundry.plat.col.points') }}</th>
                    <th class="grp-b">{{ t('foundry.plat.col.plat') }}</th>
                    <th>{{ t('foundry.plat.col.perPoint') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in bestValueRows" :key="row.uniqueKey">
                    <td class="col-name" :data-label="t('foundry.plat.col.item')">
                      <nuxt-link v-if="row.market" class="fo-tlink" :to="localePath('/set/' + row.market)" @click="trackAction('foundry_price_open', { item_name: row.name })">
                        {{ row.name }}
                      </nuxt-link>
                      <span v-else>{{ row.name }}</span>
                    </td>
                    <td :data-label="t('foundry.plat.col.category')">{{ t('foundry.cat.' + row.category) }}</td>
                    <td class="grp-a an-num" :data-label="t('foundry.plat.col.points')">{{ fmtInt(row.masteryPoints) }}</td>
                    <td class="grp-b an-num" :data-label="t('foundry.plat.col.plat')">{{ fmtInt(row.plat) }}</td>
                    <td class="an-num an-strong" :data-label="t('foundry.plat.col.perPoint')">{{ perPoint(row.platPerPoint) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <!-- Counters -->
          <section class="fo-panel">
            <h2 class="fo-h2">{{ t('foundry.counters.title') }}</h2>
            <p class="fo-help">{{ t('foundry.counters.lede') }}</p>
            <div class="fo-counters">
              <div v-for="c in COUNTERS" :key="c.key" class="fo-counter">
                <v-text-field
                  :model-value="counterDraft[c.key]"
                  type="number"
                  min="0"
                  density="compact"
                  hide-details
                  :label="t('foundry.counters.' + c.key)"
                  class="fo-num"
                  @update:model-value="onCounterInput(c.key, $event)"
                  @blur="flushCounters"
                ></v-text-field>
                <div class="fo-counter__pts">{{ t('foundry.counters.each', { n: fmtInt(c.points) }) }}</div>
              </div>
            </div>
            <div class="fo-counters__total">{{ t('foundry.counters.total', { n: fmtInt(summary.counterPoints) }) }}</div>
          </section>

          <!-- Import / export -->
          <section class="fo-panel fo-data">
            <h2 class="fo-h2">{{ t('foundry.data.title') }}</h2>
            <p class="fo-help">{{ t('foundry.data.lede') }}</p>
            <div class="fo-data__acts">
              <button type="button" class="fo-btn fo-btn--gold" @click="openImport">
                <v-icon size="16">mdi-tray-arrow-down</v-icon> {{ t('foundry.data.importBtn') }}
              </button>
              <button type="button" class="fo-btn" @click="exportFile">
                <v-icon size="16">mdi-tray-arrow-up</v-icon> {{ t('foundry.data.exportBtn') }}
              </button>
            </div>
            <p class="fo-help fo-help--tight">{{ t('foundry.data.exportHint') }}</p>
            <p v-if="!auth.signedIn" class="fo-help fo-help--tight">
              {{ t('foundry.data.signedOut') }}
              <nuxt-link :to="localePath('/account')" @click="trackAction('foundry_sync_cta')">
                {{ t('foundry.data.signedOutLink') }} →
              </nuxt-link>
            </p>
          </section>
        </template>

        <!-- ================= RESOURCES ================= -->
        <template v-else-if="tab === 'resources'">
          <section class="an-filters">
            <h2 class="fo-h2">{{ t('foundry.res.title') }}</h2>
            <p class="fo-help">{{ t('foundry.res.lede') }}</p>
            <div class="an-filters__row">
              <v-text-field
                v-model="resSearch"
                density="compact"
                hide-details
                clearable
                prepend-inner-icon="mdi-magnify"
                :label="t('foundry.res.search')"
                class="an-search"
              ></v-text-field>
              <v-select
                v-model="resSort"
                :items="resSortOptions"
                item-title="text"
                item-value="value"
                density="compact"
                hide-details
                :label="t('foundry.filters.sortBy')"
                class="an-field"
                style="flex: 0 1 220px"
                @update:model-value="onSort"
              ></v-select>
            </div>
            <div class="an-toggles">
              <v-switch
                v-model="hideSatisfied"
                hide-details
                density="compact"
                inset
                color="#4fb3bf"
                :label="t('foundry.res.hideSatisfied')"
                class="an-toggle"
                @update:model-value="onToggle('hide_satisfied', $event)"
              ></v-switch>
            </div>
            <div class="an-count">{{ t('foundry.res.count', { n: resourceRows.length }, resourceRows.length) }}</div>
          </section>

          <div v-if="!resourceRows.length" class="an-empty">{{ t('foundry.res.empty') }}</div>

          <!-- Desktop table -->
          <div v-else-if="!isMobile" class="an-tablewrap">
            <table class="an-table">
              <thead>
                <tr>
                  <th class="col-name" rowspan="2">{{ t('foundry.res.col.resource') }}</th>
                  <th class="col-grp grp-a" colspan="3">{{ t('foundry.res.grpStock') }}</th>
                  <th class="col-grp grp-b" :colspan="CATEGORIES.length">{{ t('foundry.res.grpDemand') }}</th>
                </tr>
                <tr class="an-table__subhead">
                  <th class="grp-a">{{ t('foundry.res.col.needed') }}</th>
                  <th class="grp-a">{{ t('foundry.res.col.have') }}</th>
                  <th class="grp-a">{{ t('foundry.res.col.short') }}</th>
                  <th v-for="c in CATEGORIES" :key="'h' + c" class="grp-b">{{ t('foundry.cat.' + c) }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in resourceRows" :key="row.uniqueKey">
                  <td class="col-name">
                    <span class="an-name">
                      <img class="an-thumb" :src="row.img" :alt="row.name" loading="lazy" @error="onImgError" />
                      <span>{{ row.name }}</span>
                    </span>
                  </td>
                  <td class="grp-a an-num">{{ fmtInt(row.needed) }}</td>
                  <td class="grp-a">
                    <v-text-field
                      :model-value="haveValue(row)"
                      type="number"
                      min="0"
                      density="compact"
                      hide-details
                      :aria-label="t('foundry.res.col.have')"
                      class="fo-num fo-num--tight"
                      @update:model-value="onHaveInput(row.uniqueKey, $event)"
                      @blur="flushHave"
                    ></v-text-field>
                  </td>
                  <td class="grp-a an-num an-strong" :class="row.short > 0 ? 'down' : 'up'">
                    {{ row.short > 0 ? fmtInt(row.short) : t('foundry.res.done') }}
                  </td>
                  <td v-for="c in CATEGORIES" :key="row.uniqueKey + c" class="grp-b an-num">
                    {{ row.per[c] ? fmtInt(row.per[c]) : '—' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Mobile cards -->
          <div v-else class="an-cards">
            <div v-for="row in resourceRows" :key="row.uniqueKey" class="an-card">
              <div class="an-card__head">
                <img class="an-thumb" :src="row.img" :alt="row.name" loading="lazy" @error="onImgError" />
                <div class="an-card__title">
                  <div class="an-card__name">{{ row.name }}</div>
                  <small class="an-sub">{{ t('foundry.res.col.needed') }} {{ fmtInt(row.needed) }}</small>
                </div>
              </div>
              <div class="an-card__blocks">
                <div class="an-block">
                  <div class="an-block__lbl">{{ t('foundry.res.grpStock') }}</div>
                  <div class="an-block__row"><span>{{ t('foundry.res.col.needed') }}</span><b>{{ fmtInt(row.needed) }}</b></div>
                  <div class="an-block__row">
                    <span>{{ t('foundry.res.col.short') }}</span>
                    <b :class="row.short > 0 ? 'down' : 'up'">{{ row.short > 0 ? fmtInt(row.short) : t('foundry.res.done') }}</b>
                  </div>
                </div>
                <div class="an-block">
                  <div class="an-block__lbl">{{ t('foundry.res.col.have') }}</div>
                  <v-text-field
                    :model-value="haveValue(row)"
                    type="number"
                    min="0"
                    density="compact"
                    hide-details
                    :aria-label="t('foundry.res.col.have')"
                    class="fo-num"
                    @update:model-value="onHaveInput(row.uniqueKey, $event)"
                    @blur="flushHave"
                  ></v-text-field>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- ================= CATEGORY CHECKLIST ================= -->
        <template v-else>
          <section class="an-filters">
            <div class="an-filters__row">
              <v-text-field
                v-model="search"
                density="compact"
                hide-details
                clearable
                prepend-inner-icon="mdi-magnify"
                :label="t('foundry.filters.search')"
                class="an-search"
              ></v-text-field>
              <v-select
                v-model="sortKey"
                :items="sortOptions"
                item-title="text"
                item-value="value"
                density="compact"
                hide-details
                :label="t('foundry.filters.sortBy')"
                class="an-field"
                style="flex: 0 1 240px"
                @update:model-value="onSort"
              ></v-select>
            </div>

            <div class="an-toggles">
              <v-switch
                v-model="hideMastered"
                hide-details
                density="compact"
                inset
                color="#4fb3bf"
                :label="t('foundry.filters.hideMastered')"
                class="an-toggle"
                @update:model-value="onToggle('hide_mastered', $event)"
              ></v-switch>
              <v-switch
                v-model="hideBuilt"
                hide-details
                density="compact"
                inset
                color="#4fb3bf"
                :label="t('foundry.filters.hideBuilt')"
                class="an-toggle"
                @update:model-value="onToggle('hide_built', $event)"
              ></v-switch>
              <v-switch
                v-model="showFounder"
                hide-details
                density="compact"
                inset
                color="#d4af5a"
                :label="t('foundry.filters.showFounder')"
                class="an-toggle"
                @update:model-value="onToggle('show_founder', $event)"
              ></v-switch>
            </div>

            <!-- Bulk tick: the thing warframe-foundry.app never shipped -->
            <div class="fo-bulk">
              <div class="fo-bulk__text">
                <b>{{ t('foundry.bulk.title') }}</b>
                <span>{{ t('foundry.bulk.lede') }}</span>
              </div>
              <v-text-field
                v-model.number="bulkMr"
                type="number"
                min="0"
                max="35"
                density="compact"
                hide-details
                :label="t('foundry.bulk.label')"
                class="fo-num fo-bulk__num"
              ></v-text-field>
              <button type="button" class="fo-btn fo-btn--gold" :aria-label="t('foundry.bulk.apply')" @click="applyBulk">
                <v-icon size="16">mdi-check-all</v-icon> {{ t('foundry.bulk.apply') }}
              </button>
            </div>

            <div class="an-count">{{ t('foundry.count', { n: filtered.length }, filtered.length) }}</div>
          </section>

          <div v-if="!filtered.length" class="an-empty">{{ t('foundry.emptyItems') }}</div>

          <div v-else class="fo-grid">
            <article
              v-for="card in pagedCards"
              :key="card.key"
              class="fo-card"
              :class="{ 'is-mastered': card.mastered, 'is-hidden': card.hidden }"
            >
              <div class="fo-card__head">
                <img class="fo-card__img" :src="card.img" :alt="card.name" loading="lazy" @error="onImgError" />
                <div class="fo-card__id">
                  <h3 class="fo-card__name">
                    {{ card.name }}
                    <v-icon v-if="card.mastered" size="15" color="#4fb3bf">mdi-check-decagram</v-icon>
                  </h3>
                  <div class="fo-card__meta">
                    <span class="an-chip fo-mr">{{ t('foundry.card.mr', { n: card.mr }) }}</span>
                    <span v-if="card.vaulted" class="an-chip fo-vault" :title="t('foundry.card.vaultedTitle')">{{ t('foundry.card.vaulted') }}</span>
                    <span v-if="card.founder" class="an-chip fo-founder">{{ t('foundry.card.founder') }}</span>
                    <span v-if="card.hidden" class="an-chip fo-hiddentag">{{ t('foundry.card.hidden') }}</span>
                    <a
                      v-if="card.wiki"
                      class="fo-link"
                      :href="card.wiki"
                      target="_blank"
                      rel="noopener noreferrer"
                      :aria-label="t('foundry.card.wikiAria', { name: card.name })"
                      @click="trackAction('foundry_wiki', { item_name: card.name })"
                    >{{ t('foundry.card.wiki') }}</a>
                  </div>
                </div>
                <button
                  type="button"
                  class="fo-eye"
                  :aria-label="card.hidden ? t('foundry.card.unhide', { name: card.name }) : t('foundry.card.hide', { name: card.name })"
                  :title="card.hidden ? t('foundry.card.unhide', { name: card.name }) : t('foundry.card.hide', { name: card.name })"
                  @click="toggleHidden(card)"
                >
                  <v-icon size="18">{{ card.hidden ? 'mdi-eye-off-outline' : 'mdi-eye-outline' }}</v-icon>
                </button>
              </div>

              <div class="fo-card__ticks">
                <v-checkbox
                  :model-value="card.built"
                  :label="t('foundry.card.built')"
                  density="compact"
                  hide-details
                  color="#4fb3bf"
                  class="fo-tick"
                  @update:model-value="setBuilt(card, $event)"
                ></v-checkbox>
                <v-checkbox
                  :model-value="card.mastered"
                  :label="t('foundry.card.mastered')"
                  density="compact"
                  hide-details
                  color="#d4af5a"
                  class="fo-tick"
                  @update:model-value="setMastered(card, $event)"
                ></v-checkbox>
                <nuxt-link
                  v-if="card.market && card.plat !== null"
                  class="fo-price"
                  :to="localePath('/set/' + card.market)"
                  :title="t('foundry.card.priceTitle', { name: card.name })"
                  @click="trackAction('foundry_price_open', { item_name: card.name })"
                >{{ t('foundry.card.plat', { n: fmtInt(card.plat) }) }}</nuxt-link>
              </div>

              <div v-if="card.parts.length" class="fo-comps">
                <button
                  v-for="part in card.parts"
                  :key="part.key"
                  type="button"
                  class="fo-comp"
                  :class="{ 'is-full': part.have >= part.need }"
                  :style="{ backgroundImage: part.fill }"
                  :aria-label="t('foundry.card.comp', { name: part.name, have: part.have, need: part.need })"
                  :title="t('foundry.card.comp', { name: part.name, have: part.have, need: part.need })"
                  @click="cycleComp(card, part)"
                >
                  <span class="fo-comp__n">{{ part.name }}</span>
                  <span class="fo-comp__c">{{ part.have }}/{{ part.need }}</span>
                </button>
              </div>
              <div v-else class="fo-comps fo-comps--none">{{ t('foundry.card.noParts') }}</div>
            </article>
          </div>

          <div v-if="filtered.length > perPage" class="an-pager">
            <v-pagination
              v-model="page"
              :length="pageCount"
              :total-visible="isMobile ? 5 : 9"
              color="#d4af5a"
              @update:model-value="onPage"
            ></v-pagination>
          </div>
        </template>
      </div>

      <v-alert class="an-disclaimer" color="blue-darken-4" type="info" density="compact">
        <i18n-t keypath="foundry.disclaimer.text" tag="span">
          <template #estimate><b>{{ t('foundry.disclaimer.estimate') }}</b></template>
        </i18n-t>
      </v-alert>

      <!-- Import dialog (Orokin shell, same language as DropLocationsDialog) -->
      <v-dialog v-model="importOpen" max-width="620" scrollable content-class="fo-dialog">
        <div class="fo-dlg">
          <header class="fo-dlg__head">
            <span class="fo-dlg__node" aria-hidden="true"></span>
            <div class="fo-dlg__headtext">
              <div class="fo-dlg__eyebrow">{{ t('foundry.eyebrow') }}</div>
              <h2 class="fo-dlg__title">{{ t('foundry.import.title') }}</h2>
            </div>
            <button type="button" class="fo-dlg__close" :aria-label="t('foundry.import.close')" @click="importOpen = false">
              <v-icon>mdi-close</v-icon>
            </button>
          </header>
          <div class="fo-dlg__body">
            <p class="fo-help">{{ t('foundry.import.lede') }}</p>
            <input
              ref="fileEl"
              type="file"
              accept="application/json"
              class="fo-file"
              :aria-label="t('foundry.import.chooseFile')"
              @change="onFile"
            />
            <button type="button" class="fo-btn" @click="pickFile">
              <v-icon size="16">mdi-file-upload-outline</v-icon> {{ t('foundry.import.chooseFile') }}
            </button>
            <v-textarea
              v-model="pasteText"
              rows="6"
              density="compact"
              hide-details
              class="fo-paste"
              :label="t('foundry.import.pasteLabel')"
            ></v-textarea>
            <p v-if="importMsg" class="fo-dlg__msg" :class="{ 'is-bad': importBad }">{{ importMsg }}</p>
          </div>
          <footer class="fo-dlg__foot">
            <button type="button" class="fo-btn" @click="importOpen = false">{{ t('foundry.import.close') }}</button>
            <button type="button" class="fo-btn fo-btn--gold" @click="importPaste">
              <v-icon size="16">mdi-tray-arrow-down</v-icon> {{ t('foundry.import.submit') }}
            </button>
          </footer>
        </div>
      </v-dialog>

      <v-snackbar v-model="snack" :timeout="2800" color="#12142a">{{ snackMsg }}</v-snackbar>
    </client-only>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
// Explicit imports, not auto-import: `summarize` is also exported by
// composables/useLedger.ts, so the auto-import would be ambiguous.
import {
  POINTS_PER_INTRINSIC,
  POINTS_PER_JUNCTION,
  POINTS_PER_MISSION,
  keysUpToMasteryReq,
  missingCosts,
  resourceNeeds,
  summarize,
  summarizeMissingCosts,
  type CatalogueItem,
  type CatalogueResource,
} from '~/composables/useFoundryProgress'
import { THUMB_PLACEHOLDER } from '~/composables/useItemThumb'
import {
  isFoundryExport,
  mergeFoundryData,
  parseFoundryExport,
  toFoundryExport,
} from '~/utils/foundryFormat'
import type { FoundryData } from '~/utils/userStorage'

const { t } = useI18n()
const localePath = useLocalePath()
const { trackAction, trackFilter, trackSort, trackSearch, trackDialog } = useAnalytics()
const base = useApiBase()
const { mobile } = useDisplay()
const isMobile = computed(() => mobile.value)

const route = useRoute()
const ud = useUserData()
const auth = useAuthStore()

const CATEGORIES = [
  'warframes',
  'primary',
  'secondary',
  'melee',
  'companions',
  'archwing',
  'miscellaneous',
] as const
const CATEGORY_SET = new Set<string>(CATEGORIES)

const COUNTERS = [
  { key: 'missions', points: POINTS_PER_MISSION },
  { key: 'junctions', points: POINTS_PER_JUNCTION },
  { key: 'steelMissions', points: POINTS_PER_MISSION },
  { key: 'steelJunctions', points: POINTS_PER_JUNCTION },
  { key: 'intrinsics', points: POINTS_PER_INTRINSIC },
] as const
type CounterKey = (typeof COUNTERS)[number]['key']

interface Catalogue {
  items: CatalogueItem[]
  resources: CatalogueResource[]
  counts: Record<string, number>
  meta?: { total?: number; resourceCount?: number; updatedAt?: string }
}

// The route param drives the view. Anything unrecognised falls back to the
// overview rather than 404-ing — a stale bookmark should still land somewhere.
const tab = computed<string>(() => {
  const raw = String(route.params.tab || '')
  return raw === 'resources' || CATEGORY_SET.has(raw) ? raw : ''
})

// ---------------------------------------------------------------- data
const { data: catalogueData, status: catalogueStatus } = await useAsyncData('foundry-catalogue', () =>
  $fetch<Catalogue>(`${base}/foundry/catalogue`),
)
// Prices are a bonus layer: a failure must never take the checklist down.
const { data: marketData } = await useAsyncData('foundry-market-analytics', () =>
  $fetch<{ items: any[] }>(`${base}/market_analytics`).catch(() => ({ items: [] })),
)

const items = computed<CatalogueItem[]>(() => catalogueData.value?.items ?? [])
const resources = computed<CatalogueResource[]>(() => catalogueData.value?.resources ?? [])
const counts = computed<Record<string, number>>(() => catalogueData.value?.counts ?? {})
const loading = computed(() => catalogueStatus.value === 'pending')
const notReady = computed(() => !loading.value && !items.value.length)

// One pass over ~900 items, reused by every tab — never a per-row scan.
const itemsByCategory = computed<Map<string, CatalogueItem[]>>(() => {
  const map = new Map<string, CatalogueItem[]>()
  for (const c of CATEGORIES) map.set(c, [])
  for (const it of items.value) {
    const bucket = map.get(it.category)
    if (bucket) bucket.push(it)
  }
  return map
})
const resourceMeta = computed<Map<string, CatalogueResource>>(
  () => new Map(resources.value.map((r) => [r.uniqueKey, r])),
)
const priceByUrl = computed<Record<string, any>>(() => {
  const map: Record<string, any> = {}
  for (const row of marketData.value?.items ?? []) if (row?.url_name) map[row.url_name] = row
  return map
})
function priceOf(urlName: string): number | null {
  const v = priceByUrl.value[urlName]?.sell
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null
}

// ------------------------------------------------------------ progress
const progress = computed<FoundryData>(() => ud.foundry.value)
const progressItems = computed(() => progress.value.items || {})
const excludedSet = computed<Set<string>>(() => new Set(progress.value.excluded || []))

// Founder gear is unobtainable, so it is off by default everywhere — including
// the rank estimate, or every account would show a permanent shortfall.
const showFounder = ref(false)

const summary = computed(() =>
  summarize(items.value, progress.value, { includeFounder: showFounder.value }),
)
const categoryRows = computed(() => {
  const byCat = new Map(summary.value.byCategory.map((r) => [r.category, r]))
  return CATEGORIES.map(
    (c) =>
      byCat.get(c) || { category: c, total: 0, built: 0, mastered: 0, ratio: 0, points: 0, maxPoints: 0 },
  )
})
const nextRankLine = computed(() => {
  const rank = summary.value.rank
  if (rank.nextAt === null) return t('foundry.hero.maxRank')
  return t('foundry.hero.toNext', {
    n: fmtInt(Math.max(0, rank.nextAt - rank.points)),
    rank: String(rank.rank + 1),
  })
})

const missingRows = computed(() =>
  missingCosts(items.value, progress.value, (u) => priceOf(u), {
    includeFounder: showFounder.value,
  }),
)
const missingTotals = computed(() => summarizeMissingCosts(missingRows.value, 10))
const bestValueRows = computed(() => missingTotals.value.bestValue)

// -------------------------------------------------------------- format
function fmtInt(n: number | null | undefined): string {
  return Math.round(Number(n) || 0).toLocaleString()
}
function pct(ratio: number): string {
  return Math.round(Math.min(1, Math.max(0, Number(ratio) || 0)) * 100) + '%'
}
function perPoint(v: number | null): string {
  if (v === null || !Number.isFinite(v)) return '—'
  return v >= 1 ? v.toFixed(2) : v.toFixed(3)
}
function imgUrl(imageName?: string): string {
  return imageName ? `https://cdn.warframestat.us/img/${imageName}` : THUMB_PLACEHOLDER
}
function onImgError(e: Event) {
  const img = e.target as HTMLImageElement | null
  if (!img || img.dataset.fallback) return
  img.dataset.fallback = '1'
  img.src = THUMB_PLACEHOLDER
}

// ------------------------------------------------------- checklist tab
const search = ref('')
const sortKey = ref<'name' | 'mr' | 'plat'>('name')
const hideMastered = ref(false)
const hideBuilt = ref(false)
const bulkMr = ref<number | null>(null)
const page = ref(1)
const perPage = 48

const sortOptions = computed(() => [
  { text: t('foundry.sort.name'), value: 'name' },
  { text: t('foundry.sort.mr'), value: 'mr' },
  { text: t('foundry.sort.plat'), value: 'plat' },
])
const resSortOptions = computed(() => [
  { text: t('foundry.res.sortShort'), value: 'short' },
  { text: t('foundry.res.sortNeeded'), value: 'needed' },
  { text: t('foundry.res.sortName'), value: 'name' },
])

const filtered = computed<CatalogueItem[]>(() => {
  if (!tab.value || tab.value === 'resources') return []
  const q = (search.value || '').trim().toLowerCase()
  const recs = progressItems.value
  const list = (itemsByCategory.value.get(tab.value) || []).filter((it) => {
    if (it.founderOnly && !showFounder.value) return false
    if (q && !it.name.toLowerCase().includes(q)) return false
    const rec = recs[it.uniqueKey]
    if (hideMastered.value && rec?.mastered) return false
    if (hideBuilt.value && (rec?.built || rec?.mastered)) return false
    return true
  })
  const byName = (a: CatalogueItem, b: CatalogueItem) => a.name.localeCompare(b.name)
  if (sortKey.value === 'mr') return list.slice().sort((a, b) => a.masteryReq - b.masteryReq || byName(a, b))
  if (sortKey.value === 'plat') {
    return list
      .slice()
      .sort((a, b) => (platOf(b) ?? -1) - (platOf(a) ?? -1) || byName(a, b))
  }
  return list.slice().sort(byName)
})
function platOf(it: CatalogueItem): number | null {
  return it.market ? priceOf(it.market) : null
}

const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage)))

interface CardPart {
  key: string
  name: string
  have: number
  need: number
  fill: string
}
interface CardVM {
  key: string
  name: string
  img: string
  wiki?: string
  mr: number
  vaulted: boolean
  founder: boolean
  built: boolean
  mastered: boolean
  hidden: boolean
  market?: string
  plat: number | null
  parts: CardPart[]
}

// Cards are built ONCE per render pass as plain view-models — the template never
// calls a lookup helper per row, so 48 cards stay O(48 × parts).
const pagedCards = computed<CardVM[]>(() => {
  const start = (page.value - 1) * perPage
  const slice = filtered.value.slice(start, start + perPage)
  const recs = progressItems.value
  const excluded = excludedSet.value
  return slice.map((it) => {
    const rec = recs[it.uniqueKey]
    const owned = rec?.comp || {}
    const parts: CardPart[] = []
    for (const comp of it.components || []) {
      // Raw resources are tracked in bulk on the Resources tab; the chips here
      // are the craftable parts (blueprint, chassis, barrel…) a checklist means.
      if (comp.resource) continue
      const need = Math.max(1, Math.round(Number(comp.itemCount) || 1))
      const have = Math.min(need, Math.max(0, Math.round(Number(owned[comp.uniqueKey]) || 0)))
      const stop = Math.round((have / need) * 100)
      parts.push({
        key: comp.uniqueKey,
        name: comp.name,
        have,
        need,
        fill: `linear-gradient(90deg, rgba(200,168,92,0.42) 0 ${stop}%, rgba(255,255,255,0.03) ${stop}% 100%)`,
      })
    }
    return {
      key: it.uniqueKey,
      name: it.name,
      img: imgUrl(it.imageName),
      wiki: it.wikiaUrl,
      mr: it.masteryReq,
      vaulted: !!it.vaulted,
      founder: !!it.founderOnly,
      built: !!(rec?.built || rec?.mastered),
      mastered: !!rec?.mastered,
      hidden: excluded.has(it.uniqueKey),
      market: it.market,
      plat: it.market ? priceOf(it.market) : null,
      parts,
    }
  })
})

function setBuilt(card: CardVM, value: any) {
  ud.setFoundryItem(card.key, { built: !!value })
  trackAction('foundry_tick', { field: 'built', value: !!value, item_name: card.name })
}
function setMastered(card: CardVM, value: any) {
  ud.setFoundryItem(card.key, { mastered: !!value })
  trackAction('foundry_tick', { field: 'mastered', value: !!value, item_name: card.name })
}
function toggleHidden(card: CardVM) {
  ud.toggleFoundryExcluded(card.key)
  trackAction('foundry_exclude', { item_name: card.name, excluded: !card.hidden })
}
// 0 → 1 → … → itemCount → 0. Parts are one-to-three units, so a plain cycle is
// faster than a number field and needs no keyboard.
function cycleComp(card: CardVM, part: CardPart) {
  const next = part.have >= part.need ? 0 : part.have + 1
  ud.setFoundryComponent(card.key, part.key, next)
}

function applyBulk() {
  const mr = Math.max(0, Math.round(Number(bulkMr.value) || 0))
  const keys = keysUpToMasteryReq(items.value, mr, { includeFounder: showFounder.value })
  const changed = ud.bulkFoundryMastered(keys, true)
  toast(changed ? t('foundry.bulk.done', { n: fmtInt(changed) }) : t('foundry.bulk.none'))
  trackAction('foundry_bulk_master', { max_mr: mr, changed })
}

// ------------------------------------------------------- resources tab
const resSearch = ref('')
const resSort = ref<'short' | 'needed' | 'name'>('short')
const hideSatisfied = ref(false)
const haveDraft = ref<Record<string, string>>({})

interface ResourceRow {
  uniqueKey: string
  name: string
  img: string
  needed: number
  have: number
  short: number
  per: Record<string, number>
}

const resourceRows = computed<ResourceRow[]>(() => {
  if (tab.value !== 'resources') return []
  const meta = resourceMeta.value
  const q = (resSearch.value || '').trim().toLowerCase()
  const rows = resourceNeeds(items.value, resources.value, progress.value, {
    includeFounder: showFounder.value,
  })
    .filter((r) => {
      if (q && !r.name.toLowerCase().includes(q)) return false
      if (hideSatisfied.value && r.short <= 0) return false
      return true
    })
    .map((r) => ({
      uniqueKey: r.uniqueKey,
      name: r.name,
      img: imgUrl(r.imageName || meta.get(r.uniqueKey)?.imageName),
      needed: r.needed,
      have: r.have,
      short: r.short,
      per: meta.get(r.uniqueKey)?.perCategory || {},
    }))
  if (resSort.value === 'name') return rows.sort((a, b) => a.name.localeCompare(b.name))
  if (resSort.value === 'needed') return rows.sort((a, b) => b.needed - a.needed || a.name.localeCompare(b.name))
  return rows.sort((a, b) => b.short - a.short || b.needed - a.needed || a.name.localeCompare(b.name))
})

function haveValue(row: ResourceRow): string {
  const draft = haveDraft.value[row.uniqueKey]
  return draft !== undefined ? draft : String(row.have)
}
let haveTimer: ReturnType<typeof setTimeout> | null = null
function onHaveInput(key: string, value: any) {
  haveDraft.value = { ...haveDraft.value, [key]: String(value ?? '') }
  if (haveTimer) clearTimeout(haveTimer)
  haveTimer = setTimeout(flushHave, 400)
}
function flushHave() {
  if (haveTimer) {
    clearTimeout(haveTimer)
    haveTimer = null
  }
  const draft = haveDraft.value
  for (const key of Object.keys(draft)) {
    ud.setFoundryResource(key, Number(draft[key]) || 0)
  }
  if (Object.keys(draft).length) haveDraft.value = {}
}

// ---------------------------------------------------------- counters
const counterDraft = ref<Record<string, string>>({})
function syncCounterDraft() {
  const c = (progress.value.counters || {}) as Record<string, number>
  const next: Record<string, string> = {}
  for (const item of COUNTERS) next[item.key] = String(c[item.key] || 0)
  counterDraft.value = next
}
let counterTimer: ReturnType<typeof setTimeout> | null = null
function onCounterInput(key: CounterKey, value: any) {
  counterDraft.value = { ...counterDraft.value, [key]: String(value ?? '') }
  if (counterTimer) clearTimeout(counterTimer)
  counterTimer = setTimeout(flushCounters, 400)
}
function flushCounters() {
  if (counterTimer) {
    clearTimeout(counterTimer)
    counterTimer = null
  }
  const patch: Record<string, number> = {}
  for (const item of COUNTERS) {
    patch[item.key] = Math.max(0, Math.round(Number(counterDraft.value[item.key]) || 0))
  }
  ud.setFoundryCounters(patch as any)
}

// ---------------------------------------------------- import / export
const importOpen = ref(false)
const importMsg = ref('')
const importBad = ref(false)
const pasteText = ref('')
const fileEl = ref<HTMLInputElement | null>(null)
const snack = ref(false)
const snackMsg = ref('')

function toast(message: string) {
  snackMsg.value = message
  snack.value = true
}
function openImport() {
  importMsg.value = ''
  importBad.value = false
  pasteText.value = ''
  importOpen.value = true
  trackDialog('foundry_import')
}
function pickFile() {
  fileEl.value?.click()
}
function onFile(e: Event) {
  const input = e.target as HTMLInputElement | null
  const file = input?.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    applyImport(String(reader.result || ''), 'file')
    if (input) input.value = ''
  }
  reader.onerror = () => {
    importBad.value = true
    importMsg.value = t('foundry.import.unrecognised')
  }
  reader.readAsText(file)
}
function importPaste() {
  const raw = (pasteText.value || '').trim()
  if (!raw) {
    importBad.value = true
    importMsg.value = t('foundry.import.empty')
    return
  }
  applyImport(raw, 'paste')
}

/**
 * Reads either a warframe-foundry.app backup (v1 or v2) or one of OUR account
 * exports, then MERGES it over what is already tracked — a player importing an
 * old backup must never lose a tick they have made since. Never throws.
 */
function applyImport(raw: string, source: 'file' | 'paste') {
  let json: any = null
  try {
    json = JSON.parse(raw)
  } catch {
    importBad.value = true
    importMsg.value = t('foundry.import.unrecognised')
    return
  }
  let data: FoundryData | null = null
  let stats: { items: number; mastered: number } | null = null
  if (isFoundryExport(json)) {
    const parsed = parseFoundryExport(json)
    data = parsed.data
    stats = { items: parsed.stats.items, mastered: parsed.stats.mastered }
  } else if (json && typeof json === 'object' && json.foundry && typeof json.foundry === 'object') {
    data = json.foundry as FoundryData
  }
  if (!data || typeof data !== 'object' || !data.items) {
    importBad.value = true
    importMsg.value = t('foundry.import.unrecognised')
    trackAction('foundry_import', { source, ok: false })
    return
  }
  if (!stats) {
    const entries = Object.values(data.items || {})
    stats = { items: entries.length, mastered: entries.filter((e: any) => e?.mastered).length }
  }
  ud.setFoundry(mergeFoundryData(progress.value, data))
  syncCounterDraft()
  haveDraft.value = {}
  importBad.value = false
  importMsg.value = t('foundry.import.done', {
    items: fmtInt(stats.items),
    mastered: fmtInt(stats.mastered),
  })
  toast(importMsg.value)
  trackAction('foundry_import', { source, ok: true, items: stats.items, mastered: stats.mastered })
}

function exportFile() {
  const payload = toFoundryExport(progress.value, {
    resourceKeys: resources.value.map((r) => r.uniqueKey),
  })
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'warframe-foundry.json'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // Revoke on the next tick so Safari has actually started the download.
  setTimeout(() => URL.revokeObjectURL(url), 0)
  trackAction('foundry_export')
}

// ------------------------------------------------------------ tracking
function onTab(name: string) {
  trackAction('foundry_tab', { tab: name })
}
function onToggle(name: string, value: any) {
  trackFilter(name, !!value)
}
function onSort(value: any) {
  trackSort(String(value))
}
function onPage(n: number) {
  trackAction('paginate', { page: n })
}

let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(search, (q) => {
  if (searchTimer) clearTimeout(searchTimer)
  const term = (q || '').toString().trim()
  if (term.length < 2) return
  searchTimer = setTimeout(() => trackSearch(term, filtered.value.length, { table: tab.value }), 800)
})

// Re-filtering resets the pager, so page 7 of a 2-page list can never render
// empty. Watch the FILTER INPUTS, not `filtered` itself: that array is rebuilt
// on every tick too, and resetting there would throw the user back to page 1
// each time they checked a box on page 5.
watch([tab, search, sortKey, hideMastered, hideBuilt, showFounder], () => {
  page.value = 1
})
// Clamp if a tick emptied the tail of the list (hide-mastered shrinking it).
watch(pageCount, (n) => {
  if (page.value > n) page.value = n
})
watch(tab, () => {
  // Pending edits belong to the view the user just left.
  flushHave()
})
// Cloud merge lands after sign-in; adopt the server's counters unless the user
// is mid-edit (a pending debounce owns the field).
watch(
  () => progress.value.counters,
  () => {
    if (!counterTimer) syncCounterDraft()
  },
  { deep: true },
)

// Hide the global loading spinner once mounted (project rule). Bounded retry so
// a missing #spinner-wrapper element can't recurse forever.
function finishLoading(attempt = 0) {
  nextTick(() => {
    const el = document.getElementById('spinner-wrapper')
    if (el) el.style.display = 'none'
    else if (attempt < 20) finishLoading(attempt + 1)
  })
}

onMounted(() => {
  ud.start()
  syncCounterDraft()
  finishLoading()
})
</script>

<style scoped>
/* ---- Sign-in nudge ---------------------------------------------------- */
.fo-sync {
  margin-top: 14px;
  font-family: var(--font-hud);
  font-size: 0.84rem;
  color: var(--ink-dim);
}
.fo-sync a {
  color: var(--energy);
  text-decoration: none;
  white-space: nowrap;
}
.fo-sync a:hover {
  color: var(--energy-hi);
}

.an-stat__num small {
  font-size: 0.98rem;
  color: var(--ink-dim);
  font-weight: 600;
}

/* ---- Tab strip -------------------------------------------------------- */
.fo-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 16px 18px 4px;
  border-bottom: 1px solid var(--orokin-line);
}
.fo-tab {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 14px;
  font-family: var(--font-hud);
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  text-decoration: none;
  color: #cdd2e4;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--line);
  clip-path: polygon(7px 0, 100% 0, 100% calc(100% - 7px), calc(100% - 7px) 100%, 0 100%, 0 7px);
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}
.fo-tab:hover {
  background: rgba(200, 168, 92, 0.12);
  color: var(--gold-ink);
}
.fo-tab--on {
  background: var(--orokin);
  color: #17130a;
  border-color: var(--orokin);
  font-weight: 700;
}
.fo-tab__n {
  font-size: 0.68rem;
  opacity: 0.7;
  font-variant-numeric: tabular-nums;
}
.fo-tab:focus-visible {
  outline: 2px solid var(--energy);
  outline-offset: 2px;
}

/* ---- Panels ----------------------------------------------------------- */
.fo-panel {
  padding: 24px 26px 20px;
  border-bottom: 1px solid var(--line);
}
.fo-panel:last-child {
  border-bottom: none;
}
.fo-h2 {
  font-family: var(--font-display);
  font-size: 1.16rem;
  color: var(--gold-ink);
  margin: 0 0 8px;
}
.fo-h3 {
  font-family: var(--font-hud);
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-size: 0.76rem;
  color: var(--orokin);
  margin: 4px 0 10px;
}
.fo-help {
  font-family: var(--font-hud);
  color: var(--ink-dim);
  font-size: 0.86rem;
  line-height: 1.55;
  margin: 0 0 14px;
  max-width: 70ch;
}
.fo-help--tight {
  margin: 10px 0 0;
  font-size: 0.8rem;
}
.fo-help a {
  color: var(--energy);
  text-decoration: none;
  white-space: nowrap;
}
.fo-help a:hover {
  color: var(--energy-hi);
}

/* ---- Per-category progress bars --------------------------------------- */
.fo-bars {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.fo-barrow {
  display: grid;
  grid-template-columns: minmax(96px, 150px) 1fr minmax(70px, auto);
  align-items: center;
  gap: 12px;
  padding: 7px 8px;
  text-decoration: none;
  color: var(--ink);
  border: 1px solid transparent;
}
.fo-barrow:hover {
  background: rgba(200, 168, 92, 0.06);
  border-color: var(--orokin-line);
}
.fo-barrow__lbl {
  font-family: var(--font-hud);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 0.76rem;
  color: var(--gold-ink);
}
.fo-barrow__n {
  font-family: var(--font-hud);
  font-variant-numeric: tabular-nums;
  font-size: 0.8rem;
  color: var(--ink-dim);
  text-align: right;
}
.fo-bar {
  display: block;
  height: 8px;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid var(--line);
  overflow: hidden;
}
.fo-bar i {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, var(--orokin), var(--gold-ink));
  box-shadow: 0 0 10px rgba(200, 168, 92, 0.35);
}

/* ---- Mini stat trio (plat panel) -------------------------------------- */
.fo-mini {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}
.fo-mini__cell {
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid var(--line);
  clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
  padding: 12px 14px;
}
.fo-mini__num {
  font-family: var(--font-hud);
  font-size: 1.6rem;
  font-weight: 700;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  color: var(--ink);
}
.fo-mini__num.is-gold {
  color: var(--orokin);
}
.fo-mini__num.is-good {
  color: var(--energy);
}
.fo-mini__lbl {
  font-family: var(--font-hud);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.66rem;
  color: var(--ink-dim);
  margin-top: 7px;
}
.fo-tlink {
  color: var(--gold-ink);
  text-decoration: none;
  font-weight: 600;
}
.fo-tlink:hover {
  color: var(--energy-hi);
}

/* ---- Counters --------------------------------------------------------- */
.fo-counters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 14px;
}
.fo-counter__pts {
  font-family: var(--font-hud);
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-dim);
  margin-top: 5px;
}
.fo-counters__total {
  margin-top: 14px;
  font-family: var(--font-hud);
  font-size: 0.86rem;
  letter-spacing: 0.06em;
  color: var(--gold-ink);
}
.fo-num :deep(input) {
  font-variant-numeric: tabular-nums;
}
.fo-num--tight {
  max-width: 120px;
}

/* ---- Buttons ---------------------------------------------------------- */
.fo-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-family: var(--font-hud);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 9px 16px;
  color: var(--gold-ink);
  background: rgba(200, 168, 92, 0.08);
  border: 1px solid var(--orokin-line);
  clip-path: polygon(7px 0, 100% 0, 100% calc(100% - 7px), calc(100% - 7px) 100%, 0 100%, 0 7px);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
.fo-btn:hover {
  background: rgba(200, 168, 92, 0.18);
  color: #fff3d6;
}
.fo-btn--gold {
  background: var(--orokin);
  color: #17130a;
}
.fo-btn--gold:hover {
  background: var(--gold-ink);
  color: #17130a;
}
.fo-btn:focus-visible {
  outline: 2px solid var(--energy);
  outline-offset: 2px;
}
.fo-data__acts {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.fo-file {
  display: none;
}

/* ---- Bulk tick -------------------------------------------------------- */
.fo-bulk {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 16px;
  margin-top: 18px;
  padding: 14px 16px;
  background: linear-gradient(160deg, rgba(200, 168, 92, 0.12), rgba(200, 168, 92, 0.02));
  border: 1px solid var(--orokin-line);
  clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
}
.fo-bulk__text {
  flex: 1 1 260px;
  min-width: 0;
}
.fo-bulk__text b {
  display: block;
  font-family: var(--font-display);
  color: var(--gold-ink);
  font-size: 1rem;
}
.fo-bulk__text span {
  display: block;
  font-family: var(--font-hud);
  color: var(--ink-dim);
  font-size: 0.8rem;
  line-height: 1.45;
  margin-top: 3px;
}
.fo-bulk__num {
  flex: 0 0 110px;
  max-width: 110px;
}

/* ---- Card grid -------------------------------------------------------- */
.fo-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  padding: 18px;
}
@media (min-width: 600px) {
  .fo-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (min-width: 960px) {
  .fo-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (min-width: 1280px) {
  .fo-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
.fo-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  background: var(--voidglass);
  border: 1px solid var(--line);
  clip-path: polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px);
  padding: 13px;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.fo-card.is-mastered {
  background: linear-gradient(160deg, rgba(53, 214, 208, 0.1), var(--voidglass));
  border-color: rgba(53, 214, 208, 0.34);
}
.fo-card.is-hidden {
  opacity: 0.48;
}
.fo-card__head {
  display: flex;
  align-items: flex-start;
  gap: 11px;
}
.fo-card__img {
  width: 52px;
  height: 52px;
  flex: none;
  object-fit: contain;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid var(--line);
  clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px);
}
.fo-card__id {
  flex: 1;
  min-width: 0;
}
.fo-card__name {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.2;
  color: var(--gold-ink);
  margin: 0;
  overflow-wrap: anywhere;
}
.fo-card__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px;
  margin-top: 5px;
}
.fo-mr {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--line);
  color: #cdd2e4;
}
.fo-vault {
  background: rgba(138, 143, 163, 0.16);
  border: 1px solid rgba(138, 143, 163, 0.4);
  color: #b6bcd0;
}
.fo-founder {
  background: rgba(159, 122, 234, 0.16);
  border: 1px solid rgba(159, 122, 234, 0.42);
  color: #c4b0ee;
}
.fo-hiddentag {
  background: rgba(217, 138, 138, 0.14);
  border: 1px solid rgba(217, 138, 138, 0.4);
  color: var(--rose);
}
.fo-link {
  font-family: var(--font-hud);
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--energy);
  text-decoration: none;
}
.fo-link:hover {
  color: var(--energy-hi);
  text-decoration: underline;
}
.fo-eye {
  flex: none;
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  color: var(--ink-dim);
  background: transparent;
  border: 1px solid var(--line);
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease;
}
.fo-eye:hover {
  color: var(--gold-ink);
  border-color: var(--orokin-line);
}
.fo-eye:focus-visible {
  outline: 2px solid var(--energy);
  outline-offset: 2px;
}
.fo-card__ticks {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px 14px;
}
.fo-tick {
  flex: 0 0 auto;
}
.fo-tick :deep(.v-label) {
  font-family: var(--font-hud);
  font-size: 0.78rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #cdd2e4;
  opacity: 1;
}
.fo-price {
  margin-left: auto;
  font-family: var(--font-hud);
  font-weight: 700;
  font-size: 0.86rem;
  font-variant-numeric: tabular-nums;
  color: var(--orokin);
  text-decoration: none;
  white-space: nowrap;
}
.fo-price:hover {
  color: var(--gold-ink);
  text-decoration: underline;
}

/* ---- Component chips (gold fill = owned / required) -------------------- */
.fo-comps {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}
.fo-comps--none {
  font-family: var(--font-hud);
  font-size: 0.72rem;
  color: var(--ink-dim);
  font-style: italic;
}
.fo-comp {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  max-width: 100%;
  padding: 4px 9px;
  font-family: var(--font-hud);
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  color: #dbe0ef;
  background-color: rgba(255, 255, 255, 0.03);
  background-repeat: no-repeat;
  border: 1px solid var(--line);
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s ease, color 0.15s ease;
}
.fo-comp:hover {
  border-color: var(--orokin-line);
  color: var(--gold-ink);
}
.fo-comp.is-full {
  border-color: rgba(200, 168, 92, 0.55);
  color: #17130a;
  font-weight: 700;
}
.fo-comp:focus-visible {
  outline: 2px solid var(--energy);
  outline-offset: 2px;
}
.fo-comp__n {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 130px;
}
.fo-comp__c {
  font-variant-numeric: tabular-nums;
  opacity: 0.85;
  flex: none;
}

/* ---- Skeletons -------------------------------------------------------- */
.fo-skels {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
  padding: 18px;
}
.fo-skel {
  height: 128px;
  border: 1px solid var(--line);
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.03),
    rgba(255, 255, 255, 0.08),
    rgba(255, 255, 255, 0.03)
  );
  background-size: 200% 100%;
  animation: fo-shimmer 1.2s ease-in-out infinite;
  clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
}
@keyframes fo-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* ---- Import dialog ---------------------------------------------------- */
.fo-dlg {
  background: linear-gradient(180deg, #14162a 0%, #0c0d18 100%);
  border: 1px solid var(--orokin-line);
  clip-path: polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px);
  color: var(--ink);
  display: flex;
  flex-direction: column;
  max-height: 86vh;
}
.fo-dlg__head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 20px 14px;
  border-bottom: 1px solid rgba(200, 168, 92, 0.22);
}
.fo-dlg__node {
  width: 11px;
  height: 11px;
  flex: none;
  background: var(--orokin);
  transform: rotate(45deg);
  box-shadow: 0 0 12px rgba(200, 168, 92, 0.7);
}
.fo-dlg__headtext {
  flex: 1;
  min-width: 0;
}
.fo-dlg__eyebrow {
  font-family: var(--font-hud);
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-size: 0.62rem;
  color: var(--ink-dim);
}
.fo-dlg__title {
  font-family: var(--font-display);
  font-size: 1.24rem;
  line-height: 1.15;
  color: var(--gold-ink);
  margin: 2px 0 0;
}
.fo-dlg__close {
  flex: none;
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  color: var(--ink-dim);
  background: transparent;
  border: 1px solid var(--line);
  cursor: pointer;
}
.fo-dlg__close:hover {
  color: var(--gold-ink);
  border-color: var(--orokin-line);
}
.fo-dlg__body {
  padding: 16px 20px;
  overflow-y: auto;
}
.fo-paste {
  margin-top: 14px;
}
.fo-paste :deep(textarea) {
  font-family: 'Rajdhani', monospace;
  font-size: 0.82rem;
}
.fo-dlg__msg {
  margin: 12px 0 0;
  font-family: var(--font-hud);
  font-size: 0.84rem;
  color: var(--energy);
}
.fo-dlg__msg.is-bad {
  color: var(--rose);
}
.fo-dlg__foot {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 20px;
  border-top: 1px solid rgba(200, 168, 92, 0.22);
}

/* ---- Narrow screens --------------------------------------------------- */
@media (max-width: 600px) {
  .fo-panel {
    padding: 18px 16px 16px;
  }
  .fo-tabs {
    padding: 12px 12px 4px;
    gap: 5px;
  }
  .fo-tab {
    padding: 6px 10px;
    font-size: 0.7rem;
    letter-spacing: 0.06em;
  }
  .fo-grid {
    padding: 14px 12px;
  }
  .fo-barrow {
    grid-template-columns: 1fr;
    gap: 5px;
  }
  .fo-barrow__n {
    text-align: left;
  }
  .fo-bulk__num {
    flex: 1 1 100px;
    max-width: none;
  }
  .fo-comp__n {
    max-width: 96px;
  }
}
</style>
