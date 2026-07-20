<template>
  <div class="an">
    <client-only>
      <template #fallback>
        <SeoFallbackTable
          :caption="t('endo.eyebrow')"
          :name-label="fallbackNameLabel"
          :columns="fallbackColumns"
          :rows="fallbackRows"
        />
      </template>
      <div class="an-console">
        <!-- Hero -->
        <header class="an-hero">
          <div class="an-hero__text">
            <div class="an-eyebrow">{{ t('endo.eyebrow') }}</div>
            <i18n-t v-if="direction === 'flip'" keypath="endo.hero.titleFlip" tag="h1" class="an-title">
              <template #endo><span class="accent-b">{{ t('endo.hero.endoWord') }}</span></template>
              <template #platinum><span class="accent-a">{{ t('endo.hero.platinumWord') }}</span></template>
            </i18n-t>
            <i18n-t v-else keypath="endo.hero.titleSources" tag="h1" class="an-title">
              <template #endo><span class="accent-a">{{ t('endo.hero.endoWord') }}</span></template>
              <template #platinum><span class="accent-b">{{ t('endo.hero.platinumWord') }}</span></template>
            </i18n-t>
            <i18n-t v-if="direction === 'flip'" keypath="endo.hero.ledeFlip" tag="p" class="an-lede">
              <template #partlyRanked><em>{{ t('endo.hero.ledePartlyRanked') }}</em></template>
              <template #wellTraded><b>{{ t('endo.hero.ledeWellTraded') }}</b></template>
            </i18n-t>
            <p v-else class="an-lede">{{ t('endo.hero.ledeSources') }}</p>
          </div>
          <div v-if="direction === 'flip' && topFlip" class="an-hero__deal">
            <div class="an-hero__deal-label">{{ t('endo.hero.flipDealLabel') }}</div>
            <div class="an-hero__deal-plat">{{ fmtNum(topFlip.eval.best.platPer1kEndo) }}<span>p/1k</span></div>
            <a class="an-hero__deal-name" :href="mkt(topFlip.url_name)" target="_blank" rel="noopener" @click="trackMarket(topFlip.item_name, 'hero')">
              {{ localItemName(topFlip) }} →
            </a>
            <div class="an-hero__deal-sub">{{ t('endo.hero.flipDealSub', { rank: rankLabel(topFlip.eval.best.rank), profit: fmtPlat(topFlip.eval.best.profit) }) }}</div>
          </div>
          <div v-else-if="direction === 'sources' && topSource" class="an-hero__deal">
            <div class="an-hero__deal-label">{{ t('endo.hero.srcDealLabel') }}</div>
            <div class="an-hero__deal-plat">{{ fmtNum(topSource.endoPerPlat) }}<span>e/p</span></div>
            <a class="an-hero__deal-name" :href="topSource.link" target="_blank" rel="noopener" @click="trackSourceOpen(topSource, 'hero')">{{ topSource.name }} →</a>
            <div class="an-hero__deal-sub">{{ t('endo.hero.srcDealSub', { endo: fmtEndo(topSource.endo), plat: fmtPlat(topSource.plat) }) }}</div>
          </div>
        </header>

        <!-- Direction toggle + freshness -->
        <div class="an-dir">
          <v-btn-toggle v-model="direction" mandatory density="compact" class="an-dir__toggle" @update:model-value="onDirectionChange">
            <v-btn value="flip" size="small">{{ t('endo.dir.spend') }}</v-btn>
            <v-btn value="sources" size="small">{{ t('endo.dir.getCheap') }}</v-btn>
          </v-btn-toggle>
          <div class="an-dir__right">
            <span v-if="updatedLabel" class="an-fresh" :title="t('endo.dir.freshTitle')">
              <v-icon size="14">mdi-clock-outline</v-icon> {{ t('endo.dir.updated', { time: updatedLabel }) }}
            </span>
            <NuxtLink to="/guides/endo" class="endo-guide-link">{{ t('endo.dir.guide') }} →</NuxtLink>
          </div>
        </div>

        <!-- ============ DIRECTION A: MOD FLIP ============ -->
        <template v-if="direction === 'flip'">
          <div class="an-stats">
            <div class="an-stat">
              <div class="an-stat__num">{{ flipStats.total }}</div>
              <div class="an-stat__lbl">{{ t('endo.flipStats.flippable') }}</div>
            </div>
            <div class="an-stat">
              <div class="an-stat__num is-good">{{ fmtNum(flipStats.best) }}</div>
              <div class="an-stat__lbl">{{ t('endo.flipStats.bestEff') }}</div>
            </div>
            <div class="an-stat">
              <div class="an-stat__num is-gold">{{ fmtPlat(flipStats.topProfit) }}p</div>
              <div class="an-stat__lbl">{{ t('endo.flipStats.biggestProfit') }}</div>
            </div>
            <div class="an-stat">
              <div class="an-stat__num is-alt">{{ flipStats.partial }}</div>
              <div class="an-stat__lbl">{{ t('endo.flipStats.bestPartRanked') }}</div>
            </div>
          </div>

          <section class="an-filters">
            <div class="an-filters__row">
              <v-text-field v-model="search" density="compact" hide-details clearable prepend-inner-icon="mdi-magnify" :label="t('endo.filters.searchMod')" class="an-search"></v-text-field>
              <div class="an-sortctl">
                <v-select v-model="flipSortBy" :items="flipSortOptions" item-title="text" item-value="value" density="compact" hide-details :label="t('endo.filters.sortBy')" class="an-field" style="flex:1 1 190px" @update:model-value="onFlipSortSelect"></v-select>
                <v-btn :icon="flipSortDir === 'desc' ? 'mdi-sort-descending' : 'mdi-sort-ascending'" size="small" variant="tonal" color="#d4af5a" :title="flipSortDir === 'desc' ? t('endo.filters.descending') : t('endo.filters.ascending')" @click="toggleFlipSortDir"></v-btn>
              </div>
              <v-btn variant="text" size="small" class="an-advbtn" :append-icon="showAdv ? 'mdi-chevron-up' : 'mdi-tune-variant'" @click="toggleAdv">{{ t('endo.filters.filtersSettings') }}</v-btn>
            </div>

            <v-expand-transition>
              <div v-show="showAdv" class="an-adv">
                <!-- Settings: pricing model -->
                <div class="an-adv__section">{{ t('endo.filters.pricingModel') }}</div>
                <div class="an-adv__settings">
                  <div class="an-set">
                    <div class="an-set__lbl">{{ t('endo.filters.sellMaxedAt') }}</div>
                    <v-btn-toggle v-model="sellBasis" mandatory density="compact" class="an-minitoggle" @update:model-value="onSellBasisChange">
                      <v-btn value="ask" size="x-small">{{ t('endo.filters.currentAsk') }}</v-btn>
                      <v-btn value="instant" size="x-small">{{ t('endo.filters.instant') }}</v-btn>
                      <v-btn value="avg" size="x-small">{{ t('endo.filters.avg48h') }}</v-btn>
                    </v-btn-toggle>
                  </div>
                  <div class="an-set">
                    <div class="an-set__lbl">{{ t('endo.filters.buyIn') }}</div>
                    <v-switch v-model="buyViaBid" hide-details density="compact" inset color="#4fb3bf" :label="t('endo.filters.viaBuyOrder')" class="an-toggle an-set__switch" @update:model-value="onBuyViaBidChange"></v-switch>
                    <div class="an-set__help">{{ t('endo.filters.buyInHelp') }}</div>
                  </div>
                </div>

                <div class="an-adv__section">{{ t('endo.filters.filters') }}</div>
                <div class="an-adv__grid">
                  <v-text-field v-model.number="maxBuyIn" type="number" min="0" density="compact" hide-details clearable :label="t('endo.filters.maxBuyIn')" class="an-adv__f"></v-text-field>
                  <v-text-field v-model.number="minProfit" type="number" min="0" density="compact" hide-details clearable :label="t('endo.filters.minProfit')" class="an-adv__f"></v-text-field>
                  <v-text-field v-model.number="minEff" type="number" min="0" density="compact" hide-details clearable :label="t('endo.filters.minEff')" class="an-adv__f"></v-text-field>
                  <v-text-field v-model.number="maxEndoFinish" type="number" min="0" density="compact" hide-details clearable :label="t('endo.filters.endoBudget')" class="an-adv__f"></v-text-field>
                  <v-text-field v-model.number="minVolume" type="number" min="0" density="compact" hide-details clearable :label="t('endo.filters.minVolume')" class="an-adv__f"></v-text-field>
                </div>
                <div class="an-adv__chips">
                  <span class="an-adv__lbl">{{ t('endo.filters.rarity') }}</span>
                  <v-chip-group v-model="rarityFilter" multiple column class="an-cats" @update:model-value="onRarityChange">
                    <v-chip v-for="r in rarityOptions" :key="r" :value="r" size="small" filter active-class="an-chip--on">{{ rarityLabel(r) }}</v-chip>
                  </v-chip-group>
                </div>
                <div class="an-toggles">
                  <v-switch v-model="partialOnly" hide-details density="compact" inset color="#4fb3bf" :label="t('endo.filters.partialOnly')" class="an-toggle" @update:model-value="onPartialOnlyChange"></v-switch>
                  <v-switch v-model="hideThin" hide-details density="compact" inset color="#4fb3bf" :label="t('endo.filters.hideThin')" class="an-toggle" @update:model-value="onHideThinChange"></v-switch>
                  <v-btn variant="text" size="x-small" color="#9aa0b4" @click="resetFlipFilters">{{ t('endo.filters.reset') }}</v-btn>
                </div>
              </div>
            </v-expand-transition>

            <v-chip-group v-model="flipCat" mandatory column class="an-cats" @update:model-value="onFlipCatChange">
              <v-chip v-for="c in flipCatOptions" :key="c" :value="c" size="small" active-class="an-chip--on">{{ flipCatLabel(c) }}</v-chip>
            </v-chip-group>
            <div class="an-count">{{ t('endo.flip.count', { n: flipFiltered.length }, flipFiltered.length) }}<span v-if="hiddenThin && hideThin" class="an-hidden">{{ t('endo.flip.thinHidden', { n: hiddenThin }) }}</span></div>
          </section>

          <v-alert v-if="loadError" type="error" density="compact" class="ma-4">
            {{ t('endo.flip.loadError') }}
          </v-alert>
          <div v-else-if="!flipRows.length" class="an-empty">{{ t('endo.flip.emptyNoData') }}</div>
          <div v-else-if="!flipFiltered.length" class="an-empty">{{ t('endo.flip.emptyNoMatch') }}</div>

          <!-- Desktop table -->
          <div v-else-if="!isMobile" class="an-tablewrap">
            <table class="an-table">
              <thead>
                <tr>
                  <th class="col-name sortable" :class="thCls('name', 'flip')" @click="sortFlip('name')">{{ t('endo.table.mod') }} <span class="sort-ind">{{ arrow('name', flipSortBy, flipSortDir) }}</span></th>
                  <th class="grp-a sortable" :class="thCls('buyat', 'flip')" @click="sortFlip('buyat')">{{ t('endo.table.buyAt') }} <span class="sort-ind">{{ arrow('buyat', flipSortBy, flipSortDir) }}</span></th>
                  <th class="grp-b sortable" :class="thCls('sell', 'flip')" @click="sortFlip('sell')">{{ t('endo.table.sellMaxed') }} <span class="sort-ind">{{ arrow('sell', flipSortBy, flipSortDir) }}</span></th>
                  <th class="sortable" :class="thCls('profit', 'flip')" @click="sortFlip('profit')">{{ t('endo.table.profit') }} <span class="sort-ind">{{ arrow('profit', flipSortBy, flipSortDir) }}</span></th>
                  <th class="sortable" :class="thCls('endo', 'flip')" @click="sortFlip('endo')">{{ t('endo.table.endo') }} <span class="sort-ind">{{ arrow('endo', flipSortBy, flipSortDir) }}</span></th>
                  <th class="sortable" :class="thCls('eff', 'flip')" @click="sortFlip('eff')">{{ t('endo.table.platPer1k') }} <span class="sort-ind">{{ arrow('eff', flipSortBy, flipSortDir) }}</span></th>
                  <th class="sortable" :class="thCls('volume', 'flip')" @click="sortFlip('volume')">{{ t('endo.table.demand') }} <span class="sort-ind">{{ arrow('volume', flipSortBy, flipSortDir) }}</span></th>
                  <th class="col-act"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in flipPaged" :key="row.url_name" :class="{ 'is-top': row.url_name === topFlipUrl }">
                  <td class="col-name">
                    <a class="an-name" :href="mkt(row.url_name)" target="_blank" rel="noopener" @click="trackMarket(row.item_name, 'table')">
                      <img class="an-thumb" :src="assetUrl(row.thumb)" :alt="localItemName(row)" loading="lazy" @error="onImgError" />
                      <span>
                        {{ localItemName(row) }}
                        <span v-if="row.url_name === topFlipUrl" class="an-badge">{{ t('endo.row.top') }}</span>
                        <small class="an-sub">{{ t('endo.row.modSub', { rarity: rarityLabel(row.eval.rarity), max: row.eval.maxRank, endo: fmtEndo(row.eval.endoToMax) }) }}</small>
                      </span>
                    </a>
                  </td>
                  <td class="grp-a an-num">
                    <b>{{ rankLabel(row.eval.best.rank) }}</b>
                    <small class="an-sub">{{ fmtPlat(row.eval.best.buyIn) }}p{{ buyViaBid ? t('endo.row.bidSuffix') : '' }}</small>
                    <small
                      v-if="showInstant(row)"
                      class="an-instant"
                      :class="{ 'is-loss': instantIsLoss(row) }"
                      :title="instantIsLoss(row)
                        ? t('endo.row.buyNowLossTitle', { n: fmtPlat(-row.eval.best.instantProfit), buyin: fmtPlat(row.eval.best.buyIn) })
                        : t('endo.row.buyNowOkTitle', { buyin: fmtPlat(row.eval.best.buyIn) })"
                    >
                      <v-icon size="11">{{ instantIsLoss(row) ? 'mdi-alert' : 'mdi-flash' }}</v-icon>
                      {{ t('endo.row.buyNow', { p: fmtPlat(instantAsk(row)) }) }}
                    </small>
                  </td>
                  <td class="grp-b an-num" :title="t('endo.row.sellTitle', { ask: fmtPlat(row.eval.maxedAsk), avg: fmtPlat(row.eval.maxedAvg), instant: fmtPlat(row.eval.maxedBid) })">
                    {{ fmtPlat(row.eval.maxedSell) }}p
                    <small class="an-sub">{{ t('endo.row.instant', { v: fmtPlat(row.eval.maxedBid) }) }}</small>
                  </td>
                  <td class="an-num up an-strong">+{{ fmtPlat(row.eval.best.profit) }}p</td>
                  <td class="an-num">
                    {{ fmtEndoK(row.eval.best.endoToFinish) }}
                    <small class="an-sub">{{ fmtEndoK(row.eval.best.creditsToFinish / 1000) }}k cr</small>
                  </td>
                  <td class="an-num an-strong">{{ fmtNum(row.eval.best.platPer1kEndo) }}</td>
                  <td>
                    <span class="an-demand" :class="row.eval.demand.cls" :title="t('endo.row.demandTitle', { pct: Math.round(row.eval.liquidity * 100), vol: fmtPlat(row.eval.maxedVolume) })">
                      <span class="an-demand__bar"><i :style="{ width: Math.round(row.eval.liquidity * 100) + '%' }"></i></span>
                      {{ fmtPlat(row.eval.maxedVolume) }}
                    </span>
                  </td>
                  <td class="col-act">
                    <a class="an-copy" :href="wikiHref(row.item_name)" target="_blank" rel="noopener" title="Warframe Wiki" @click="trackWiki(row.item_name)"><v-icon size="16">mdi-book-open-variant</v-icon></a>
                    <button class="an-copy" :title="t('endo.actions.whereDrops')" @click="openDrops(row)"><v-icon size="16">mdi-map-marker-radius-outline</v-icon></button>
                    <button class="an-copy" :class="{ 'is-copied': copiedKey === 'f:' + row.url_name, 'is-warn': showInstant(row) && instantIsLoss(row) }" :title="whisperTitle(row)" @click="copyFlipWhisper(row)">
                      <v-icon size="16">{{ copiedKey === 'f:' + row.url_name ? 'mdi-check' : 'mdi-content-copy' }}</v-icon>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Mobile cards -->
          <div v-else class="an-cards">
            <div v-for="row in flipPaged" :key="row.url_name" class="an-card" :class="{ 'is-top': row.url_name === topFlipUrl }">
              <a class="an-card__head" :href="mkt(row.url_name)" target="_blank" rel="noopener" @click="trackMarket(row.item_name, 'card')">
                <img class="an-thumb" :src="assetUrl(row.thumb)" :alt="localItemName(row)" loading="lazy" @error="onImgError" />
                <div class="an-card__title">
                  <div class="an-card__name">{{ localItemName(row) }}<span v-if="row.url_name === topFlipUrl" class="an-badge">{{ t('endo.row.top') }}</span></div>
                  <small class="an-sub">{{ t('endo.row.modSub', { rarity: rarityLabel(row.eval.rarity), max: row.eval.maxRank, endo: fmtEndo(row.eval.endoToMax) }) }}</small>
                </div>
                <v-icon color="#4fb3bf">mdi-open-in-new</v-icon>
              </a>
              <div class="an-card__verdict">
                <span class="pill pill--good">{{ fmtNum(row.eval.best.platPer1kEndo) }} <b>{{ t('endo.card.platPer1k') }}</b></span>
                <span class="an-demand" :class="row.eval.demand.cls">
                  <span class="an-demand__bar"><i :style="{ width: Math.round(row.eval.liquidity * 100) + '%' }"></i></span>
                  {{ row.eval.demand.label }}
                </span>
              </div>
              <div class="an-card__blocks">
                <div class="an-block">
                  <div class="an-block__lbl">{{ t('endo.card.theFlip') }}</div>
                  <div class="an-block__row"><span>{{ t('endo.card.buy') }} {{ rankLabel(row.eval.best.rank) }}{{ buyViaBid ? t('endo.row.bidSuffix') : '' }}</span><b>{{ fmtPlat(row.eval.best.buyIn) }}p</b></div>
                  <div v-if="showInstant(row)" class="an-block__row an-block__row--instant"><span :class="{ 'is-loss': instantIsLoss(row) }">{{ t('endo.card.buyNow') }}</span><b :class="{ 'is-loss': instantIsLoss(row) }">{{ fmtPlat(instantAsk(row)) }}p</b></div>
                  <div class="an-block__row"><span>{{ t('endo.card.sellMaxed') }}</span><b>{{ fmtPlat(row.eval.maxedSell) }}p</b></div>
                  <div class="an-block__row"><span>{{ t('endo.card.profit') }}</span><b class="up">+{{ fmtPlat(row.eval.best.profit) }}p</b></div>
                </div>
                <div class="an-block">
                  <div class="an-block__lbl">{{ t('endo.card.costToFinish') }}</div>
                  <div class="an-block__row"><span>{{ t('endo.card.endo') }}</span><b>{{ fmtEndo(row.eval.best.endoToFinish) }}</b></div>
                  <div class="an-block__row"><span>{{ t('endo.card.credits') }}</span><b>{{ fmtEndo(row.eval.best.creditsToFinish) }}</b></div>
                  <div class="an-block__row"><span>{{ t('endo.card.maxedVol') }}</span><b>{{ fmtPlat(row.eval.maxedVolume) }}</b></div>
                </div>
              </div>
              <div class="an-card__acts">
                <a class="an-copy" :href="wikiHref(row.item_name)" target="_blank" rel="noopener" aria-label="Warframe Wiki" @click="trackWiki(row.item_name)"><v-icon size="16">mdi-book-open-variant</v-icon></a>
                <button class="an-copy" :aria-label="t('endo.actions.whereDrops')" @click="openDrops(row)"><v-icon size="16">mdi-map-marker-radius-outline</v-icon></button>
                <button class="an-copybtn" :class="{ 'is-copied': copiedKey === 'f:' + row.url_name, 'is-warn': showInstant(row) && instantIsLoss(row) }" :title="whisperTitle(row)" @click="copyFlipWhisper(row)">
                  <v-icon size="16">{{ copiedKey === 'f:' + row.url_name ? 'mdi-check' : 'mdi-content-copy' }}</v-icon>
                  {{ copiedKey === 'f:' + row.url_name ? t('endo.actions.copiedWhisper') : t('endo.actions.copyWhisper') }}
                </button>
              </div>
            </div>
          </div>

          <div v-if="flipFiltered.length > perPage" class="an-pager">
            <v-pagination v-model="page" :length="flipPageCount" :total-visible="isMobile ? 5 : 9" color="#d4af5a" @update:model-value="onPageChange"></v-pagination>
          </div>
        </template>

        <!-- ============ DIRECTION B: ENDO SOURCES ============ -->
        <template v-else>
          <div class="an-stats">
            <div class="an-stat">
              <div class="an-stat__num">{{ sourceStats.total }}</div>
              <div class="an-stat__lbl">{{ t('endo.srcStats.sources') }}</div>
            </div>
            <div class="an-stat">
              <div class="an-stat__num is-good">{{ fmtNum(sourceStats.best) }}</div>
              <div class="an-stat__lbl">{{ t('endo.srcStats.bestRate') }}</div>
            </div>
            <div class="an-stat">
              <div class="an-stat__num is-gold">{{ fmtNum(sourceStats.bestSculpt) }}</div>
              <div class="an-stat__lbl">{{ t('endo.srcStats.bestSculpt') }}</div>
            </div>
            <div class="an-stat">
              <div class="an-stat__num is-alt">{{ fmtNum(sourceStats.bestMod) }}</div>
              <div class="an-stat__lbl">{{ t('endo.srcStats.bestMod') }}</div>
            </div>
          </div>

          <section class="an-filters">
            <div class="an-filters__row">
              <v-text-field v-model="sourceSearch" density="compact" hide-details clearable prepend-inner-icon="mdi-magnify" :label="t('endo.sources.searchSource')" class="an-search"></v-text-field>
              <div class="an-sortctl">
                <v-select v-model="srcSortBy" :items="sourceSortOptions" item-title="text" item-value="value" density="compact" hide-details :label="t('endo.filters.sortBy')" class="an-field" style="flex:1 1 190px" @update:model-value="onSrcSortSelect"></v-select>
                <v-btn :icon="srcSortDir === 'desc' ? 'mdi-sort-descending' : 'mdi-sort-ascending'" size="small" variant="tonal" color="#d4af5a" @click="toggleSrcSortDir"></v-btn>
              </div>
              <v-text-field v-model.number="minEpp" type="number" min="0" density="compact" hide-details clearable :label="t('endo.sources.minEpp')" class="an-field" style="flex:0 1 150px"></v-text-field>
              <v-text-field v-model.number="maxCost" type="number" min="0" density="compact" hide-details clearable :label="t('endo.sources.maxCost')" class="an-field" style="flex:0 1 140px"></v-text-field>
            </div>
            <v-chip-group v-model="sourceKind" mandatory column class="an-cats" @update:model-value="onSourceKindChange">
              <v-chip v-for="c in sourceKindOptions" :key="c" :value="c" size="small" active-class="an-chip--on">{{ srcKindLabel(c) }}</v-chip>
            </v-chip-group>
            <div class="an-count">{{ t('endo.sources.count', { n: sourceFiltered.length }, sourceFiltered.length) }}</div>
          </section>

          <div v-if="!sourceRows.length" class="an-empty">{{ t('endo.sources.emptyNoData') }}</div>
          <div v-else-if="!sourceFiltered.length" class="an-empty">{{ t('endo.sources.emptyNoMatch') }}</div>

          <div v-else-if="!isMobile" class="an-tablewrap">
            <table class="an-table">
              <thead>
                <tr>
                  <th class="col-name sortable" :class="thCls('name', 'src')" @click="sortSrc('name')">{{ t('endo.table.source') }} <span class="sort-ind">{{ arrow('name', srcSortBy, srcSortDir) }}</span></th>
                  <th class="grp-a sortable" :class="thCls('endo', 'src')" @click="sortSrc('endo')">{{ t('endo.table.endo') }} <span class="sort-ind">{{ arrow('endo', srcSortBy, srcSortDir) }}</span></th>
                  <th class="grp-b sortable" :class="thCls('cost', 'src')" @click="sortSrc('cost')">{{ t('endo.table.cost') }} <span class="sort-ind">{{ arrow('cost', srcSortBy, srcSortDir) }}</span></th>
                  <th class="sortable" :class="thCls('rate', 'src')" @click="sortSrc('rate')">{{ t('endo.table.endoPerPlat') }} <span class="sort-ind">{{ arrow('rate', srcSortBy, srcSortDir) }}</span></th>
                  <th class="sortable" :class="thCls('volume', 'src')" @click="sortSrc('volume')">{{ t('endo.table.vol') }} <span class="sort-ind">{{ arrow('volume', srcSortBy, srcSortDir) }}</span></th>
                  <th class="col-act"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in sourcePaged" :key="row.kind + row.name" :class="{ 'is-top': row === topSource }">
                  <td class="col-name">
                    <a class="an-name" :href="row.link" target="_blank" rel="noopener" @click="trackSourceOpen(row, 'table')">
                      <span class="an-kind" :class="'kind--' + row.kind">{{ kindBadge(row.kind) }}</span>
                      <span>
                        {{ row.name }}
                        <span v-if="row === topSource" class="an-badge">{{ t('endo.row.top') }}</span>
                        <small class="an-sub">{{ row.sub }}</small>
                      </span>
                    </a>
                  </td>
                  <td class="grp-a an-num">{{ fmtEndo(row.endo) }}</td>
                  <td class="grp-b an-num">{{ fmtPlat(row.plat) }}p</td>
                  <td class="an-num an-strong">{{ fmtNum(row.endoPerPlat) }}</td>
                  <td class="an-num">{{ row.volume != null ? fmtPlat(row.volume) : '—' }}</td>
                  <td class="col-act">
                    <a class="an-copy" :href="row.link" target="_blank" rel="noopener" :title="t('endo.actions.openMarket')" @click="trackSourceOpen(row, 'action')"><v-icon size="16">mdi-open-in-new</v-icon></a>
                    <button class="an-copy" :class="{ 'is-copied': copiedKey === 's:' + row.kind + row.name }" :title="t('endo.actions.copyWtbShort')" @click="copySourceWhisper(row)">
                      <v-icon size="16">{{ copiedKey === 's:' + row.kind + row.name ? 'mdi-check' : 'mdi-content-copy' }}</v-icon>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-else class="an-cards">
            <div v-for="row in sourcePaged" :key="row.kind + row.name" class="an-card" :class="{ 'is-top': row === topSource }">
              <a class="an-card__head" :href="row.link" target="_blank" rel="noopener" @click="trackSourceOpen(row, 'card')">
                <span class="an-kind" :class="'kind--' + row.kind">{{ kindBadge(row.kind) }}</span>
                <div class="an-card__title">
                  <div class="an-card__name">{{ row.name }}<span v-if="row === topSource" class="an-badge">{{ t('endo.row.top') }}</span></div>
                  <small class="an-sub">{{ row.sub }}</small>
                </div>
                <v-icon color="#4fb3bf">mdi-open-in-new</v-icon>
              </a>
              <div class="an-card__blocks">
                <div class="an-block">
                  <div class="an-block__lbl">{{ t('endo.card.endoPerPlat') }}</div>
                  <div class="an-block__row"><span>{{ t('endo.card.rate') }}</span><b class="up">{{ fmtNum(row.endoPerPlat) }}</b></div>
                  <div class="an-block__row"><span>{{ t('endo.card.endo') }}</span><b>{{ fmtEndo(row.endo) }}</b></div>
                  <div class="an-block__row"><span>{{ t('endo.card.cost') }}</span><b>{{ fmtPlat(row.plat) }}p</b></div>
                </div>
              </div>
              <button class="an-copybtn" :class="{ 'is-copied': copiedKey === 's:' + row.kind + row.name }" @click="copySourceWhisper(row)">
                <v-icon size="16">{{ copiedKey === 's:' + row.kind + row.name ? 'mdi-check' : 'mdi-content-copy' }}</v-icon>
                {{ copiedKey === 's:' + row.kind + row.name ? t('endo.actions.copiedWhisper') : t('endo.actions.copyWhisper') }}
              </button>
            </div>
          </div>

          <div v-if="sourceFiltered.length > perPage" class="an-pager">
            <v-pagination v-model="page" :length="sourcePageCount" :total-visible="isMobile ? 5 : 9" color="#d4af5a" @update:model-value="onPageChange"></v-pagination>
          </div>
        </template>
      </div>

      <v-alert class="an-disclaimer" color="blue-darken-4" type="info" density="compact">
        <template v-if="direction === 'flip'">
          <i18n-t keypath="endo.disclaimer.flip" tag="span">
            <template #formula><b>{{ t('endo.disclaimer.formula') }}</b></template>
            <template #avg><b>{{ t('endo.disclaimer.avg') }}</b></template>
          </i18n-t>
          {{ t('disclaimer') }}
        </template>
        <template v-else>
          {{ t('endo.disclaimer.sources') }} {{ t('disclaimer') }}
        </template>
      </v-alert>

      <DropLocationsDialog v-model="dropsDialog" :item-name="dropsItem" :thumb="dropsThumb" />

      <!-- Donations -->
      <div class="px-0 pt-3">
        <div class="d-flex flex-wrap align-center top_container justify-space-between mb-md-4">
          <div class="my-3 mb-0 md-md-3 bg-grey-darken-3 pa-3 px-lg-5 text-subtitle-1 d-flex align-center flex-wrap donation_container">
            <div class="d-flex mt-2 align-center">
              <div class="text-white mr-3">{{ t('endo.donate.help') }}</div>
              <a target="_blank" :aria-label="t('endo.donate.paypalAria')" class="text-white d-flex mr-4 align-center justify-content-left donation_logo" href="https://ko-fi.com/cambio_uruguay">
                <picture>
                  <source srcset="/img/paypal_icon.webp" type="image/webp" />
                  <img src="/img/paypal_icon.png" alt="PayPal" width="50" height="50" class="donation_icon" />
                </picture>
              </a>
              <a :aria-label="t('endo.donate.mercadoAria')" class="text-white d-flex align-center justify-content-left donation_logo" target="_blank" href="https://mpago.la/19j46vX">
                <picture>
                  <source srcset="/img/mercadopago_icon.webp" type="image/webp" />
                  <img src="/img/mercadopago_icon.png" alt="Mercado Pago" width="50" height="50" class="donation_icon" />
                </picture>
              </a>
            </div>
          </div>
        </div>
      </div>
    </client-only>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import { useItemsStore } from '~/stores/items'
import {
  evalFlip,
  hasFlip,
  isEndoRankableMod,
  modAsEndoSource,
  endoPerPlat,
  buyWhisper,
  itemUrl,
  SCULPTURE_ENDO,
  fmtEndo,
  fmtEndoK,
  fmtNum,
  type EndoFlipRow,
  type EndoSourceRow,
  type FlipEval,
  type SellBasis,
} from '~/composables/useEndoValue'
import { fmtPlat } from '~/composables/marketFormat'

dayjs.extend(relativeTime)

const apiBase = useApiBase()
const { t, te } = useI18n()
const { localItemName } = useLocalizedName()

// --- i18n label helpers for dynamic values whose English form is also the
// filter/compare key. Keep the value; translate only the display. ---
function rarityLabel(r: string): string {
  const key = 'endo.rarity.' + r
  return te(key) ? t(key) : r
}
const FLIP_CAT_KEY: Record<string, string> = {
  All: 'all',
  'Rank 10': 'rank10',
  'Rank 8': 'rank8',
  'Rank 5': 'rank5',
  'Rank ≤3': 'rankLe3',
}
function flipCatLabel(c: string): string {
  const k = FLIP_CAT_KEY[c]
  return k ? t('endo.flipCat.' + k) : c // Corrupted / Primed-Umbral / Aura kept as-is
}
function srcKindLabel(c: string): string {
  if (c === 'All') return t('endo.kind.all')
  if (c === 'Sculpture') return t('endo.kind.sculpture')
  return c // Riven / Mod kept
}
function kindBadge(k: string): string {
  return k === 'sculpture' ? t('endo.kind.sculpture') : k // riven / mod kept
}

const { mobile } = useDisplay()
const isMobile = computed(() => mobile.value)
const store = useItemsStore()

const { data: flipData, error } = await useAsyncData('endo-flip', () =>
  $fetch<{ mods: EndoFlipRow[] }>(`${apiBase}/endo_flip`),
)
const { data: rivenData } = await useAsyncData('endo-rivens', () =>
  $fetch<any[]>(`${apiBase}/rivens`).catch(() => []),
)
const loadError = computed(() => !!error.value)

// ---- shared UI state ----
const direction = ref<'flip' | 'sources'>('flip')
const page = ref(1)
const perPage = 25
const copiedKey = ref('')
let copyTimer: any = null

// Drop-locations popup (reuses the shared dialog + WFCD drop data; the dialog
// also surfaces the mod's Warframe-wiki link).
const dropsDialog = ref(false)
const dropsItem = ref('')
const dropsThumb = ref('')
function openDrops(row: { item_name: string; thumb?: string }) {
  dropsItem.value = row.item_name
  dropsThumb.value = row.thumb || ''
  dropsDialog.value = true
  trackDialog('drop_locations', { item_name: row.item_name })
}
function wikiHref(name: string): string {
  return itemWikiUrl(name)
}

// --- Buy-in vs instant-buy reconciliation -----------------------------------
// In buy-order mode the "Buy @" price is the modeled BID (post an order, wait),
// but the copy-WTB whisper buys INSTANTLY at the seller's ask — a higher, and
// sometimes loss-making, price. These helpers surface that gap so the two
// numbers never silently contradict, and the disclaimer/toggle explain the fix
// (turn "Via buy order" off to price every flip at the instant ask).
function instantAsk(row: FlipRowEval): number {
  return Number(row.eval.best.ask) || 0
}
// Show the instant price beside the buy-in only when it's a distinct, higher
// number (buy-order mode with a bid below the ask).
function showInstant(row: FlipRowEval): boolean {
  return buyViaBid.value && instantAsk(row) > row.eval.best.buyIn + 0.5
}
// Buying instantly at the ask is a net loss (the copy-whisper would cost you).
function instantIsLoss(row: FlipRowEval): boolean {
  return row.eval.best.instantProfit <= 0
}
// Tooltip for the copy-WTB button: it's the INSTANT ask price, flagged when that
// differs from — or loses against — the modeled buy-order buy-in.
function whisperTitle(row: FlipRowEval): string {
  const b = row.eval.best
  const price = fmtPlat(b.ask || b.buyIn)
  const to = b.askUser ? t('endo.actions.toUser', { user: b.askUser }) : ''
  const parts = [t('endo.actions.copyWtbInstant', { price, to })]
  if (showInstant(row)) {
    parts.push(t('endo.actions.modeledBuyIn', { buyin: fmtPlat(b.buyIn) }))
    if (instantIsLoss(row)) parts.push(t('endo.actions.instantLoss', { n: fmtPlat(-b.instantProfit) }))
  }
  return parts.join(' · ')
}

type Dir = 'asc' | 'desc'
function arrow(key: string, activeKey: string, dir: Dir): string {
  if (key !== activeKey) return '⇅'
  return dir === 'asc' ? '▲' : '▼'
}
function thCls(key: string, which: 'flip' | 'src') {
  const active = which === 'flip' ? flipSortBy.value : srcSortBy.value
  return { 'is-sorted': key === active }
}
function sortBy<T>(list: T[], acc: (r: T) => number | string, dir: Dir): T[] {
  const sign = dir === 'asc' ? 1 : -1
  return list.slice().sort((a, b) => {
    const va = acc(a)
    const vb = acc(b)
    if (typeof va === 'string' || typeof vb === 'string') return sign * String(va).localeCompare(String(vb))
    return sign * ((va as number) - (vb as number))
  })
}
function copy(text: string, key: string) {
  const done = () => {
    copiedKey.value = key
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => (copiedKey.value = ''), 1600)
  }
  try {
    if (navigator?.clipboard?.writeText) navigator.clipboard.writeText(text).then(done).catch(fallback)
    else fallback()
  } catch {
    fallback()
  }
  function fallback() {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      done()
    } catch {
      /* ignore */
    }
  }
}

// ---- Direction A: mod flip ----
const search = ref('')
const minVolume = ref<number | null>(50)
const flipCat = ref('All')
const flipSortBy = ref('eff')
const flipSortDir = ref<Dir>('desc')
const showAdv = ref(false)
// pricing model
const sellBasis = ref<SellBasis>('avg')
const buyViaBid = ref(true)
// advanced filters
const maxBuyIn = ref<number | null>(null)
const minProfit = ref<number | null>(null)
const minEff = ref<number | null>(null)
const maxEndoFinish = ref<number | null>(null)
const rarityFilter = ref<string[]>([])
const partialOnly = ref(false)
const hideThin = ref(true)

const flipSortOptions = computed(() => [
  { text: t('endo.sortFlip.eff'), value: 'eff' },
  { text: t('endo.sortFlip.profit'), value: 'profit' },
  { text: t('endo.sortFlip.endo'), value: 'endo' },
  { text: t('endo.sortFlip.buyat'), value: 'buyat' },
  { text: t('endo.sortFlip.sell'), value: 'sell' },
  { text: t('endo.sortFlip.volume'), value: 'volume' },
  { text: t('endo.sortFlip.name'), value: 'name' },
])
const rarityOptions = ['Common', 'Uncommon', 'Rare', 'Legendary']

interface FlipRowEval extends EndoFlipRow {
  eval: FlipEval & { best: NonNullable<FlipEval['best']> }
}
// Re-evaluated whenever the pricing model (sell basis / buy mode) changes.
const flipRows = computed<FlipRowEval[]>(() => {
  const rows = flipData.value?.mods ?? []
  const opts = { buyViaBid: buyViaBid.value, sellBasis: sellBasis.value }
  const out: FlipRowEval[] = []
  for (const r of rows) {
    // Requiem/Kuva mods rank via murmurs, not endo — never a valid flip.
    if (!isEndoRankableMod(r.url_name, r.tags)) continue
    const ev = evalFlip(r, opts)
    if (!hasFlip(ev)) continue
    out.push({ ...r, eval: ev as FlipRowEval['eval'] })
  }
  return out
})
// Liquid subset (traded in the last 48h) — used for the hero + headline stats so
// a zero-volume outlier (a lone stale ask) can't become the featured deal.
const liquidFlips = computed<FlipRowEval[]>(() => flipRows.value.filter((r) => r.eval.maxedVolume >= 1))

const flipAccessors: Record<string, (r: FlipRowEval) => number | string> = {
  name: (r) => r.item_name.toLowerCase(),
  buyat: (r) => r.eval.best.buyIn,
  sell: (r) => r.eval.maxedSell,
  profit: (r) => r.eval.best.profit,
  endo: (r) => r.eval.best.endoToFinish,
  eff: (r) => r.eval.best.platPer1kEndo,
  volume: (r) => r.eval.maxedVolume,
}
function sortFlip(key: string) {
  if (flipSortBy.value === key) flipSortDir.value = flipSortDir.value === 'asc' ? 'desc' : 'asc'
  else {
    flipSortBy.value = key
    flipSortDir.value = key === 'name' ? 'asc' : 'desc'
  }
  trackSortChange('flip', key, flipSortDir.value)
}

function flipCategory(row: FlipRowEval): string {
  const name = row.item_name || ''
  const tags = (row.tags || []).map((x) => (x || '').toLowerCase())
  if (/^(primed|umbral|archon)\b/i.test(name)) return 'Primed/Umbral'
  if (tags.includes('corrupted')) return 'Corrupted'
  if (tags.includes('aura')) return 'Aura'
  const mr = row.eval.maxRank
  if (mr >= 10) return 'Rank 10'
  if (mr >= 8) return 'Rank 8'
  if (mr >= 5) return 'Rank 5'
  return 'Rank ≤3'
}
const flipCatOptions = computed<string[]>(() => {
  const present = new Set<string>()
  for (const r of flipRows.value) present.add(flipCategory(r))
  const order = ['Rank 10', 'Rank 8', 'Rank 5', 'Rank ≤3', 'Corrupted', 'Primed/Umbral', 'Aura']
  return ['All', ...order.filter((c) => present.has(c))]
})
function resetFlipFilters() {
  // The reset rewrites eight filter refs at once; report it as the single action
  // it is instead of letting every field watcher emit its own filter_apply.
  suppressFilterEvents = true
  search.value = ''
  minVolume.value = 50
  maxBuyIn.value = null
  minProfit.value = null
  minEff.value = null
  maxEndoFinish.value = null
  rarityFilter.value = []
  partialOnly.value = false
  flipCat.value = 'All'
  trackAction('filters_reset')
  armCalc()
  nextTick(() => {
    suppressFilterEvents = false
  })
}

const flipFiltered = computed<FlipRowEval[]>(() => {
  const q = (search.value || '').trim().toLowerCase()
  const minV = Number(minVolume.value) || 0
  const raritySet = new Set(rarityFilter.value.map((x) => x.toLowerCase()))
  const list = flipRows.value.filter((r) => {
    const b = r.eval.best
    if (q && !(r.item_name.toLowerCase().includes(q) || localItemName(r).toLowerCase().includes(q))) return false
    if (flipCat.value !== 'All' && flipCategory(r) !== flipCat.value) return false
    if (r.eval.maxedVolume < minV) return false
    if (hideThin.value && r.eval.maxedVolume < 1) return false
    if (maxBuyIn.value != null && b.buyIn > maxBuyIn.value) return false
    if (minProfit.value != null && b.profit < minProfit.value) return false
    if (minEff.value != null && b.platPer1kEndo < minEff.value) return false
    if (maxEndoFinish.value != null && b.endoToFinish > maxEndoFinish.value) return false
    if (partialOnly.value && b.rank <= 0) return false
    if (raritySet.size && !raritySet.has((r.eval.rarity || '').toLowerCase())) return false
    return true
  })
  return sortBy(list, flipAccessors[flipSortBy.value] ?? flipAccessors.eff!, flipSortDir.value)
})
const hiddenThin = computed<number>(() =>
  hideThin.value ? flipRows.value.filter((r) => r.eval.maxedVolume < 1).length : 0,
)
const flipPageCount = computed(() => Math.max(1, Math.ceil(flipFiltered.value.length / perPage)))
const flipPaged = computed<FlipRowEval[]>(() => {
  const start = (page.value - 1) * perPage
  return flipFiltered.value.slice(start, start + perPage)
})
const topFlip = computed<FlipRowEval | null>(() => {
  let best: FlipRowEval | null = null
  for (const r of liquidFlips.value) if (!best || r.eval.best.platPer1kEndo > best.eval.best.platPer1kEndo) best = r
  return best
})
const topFlipUrl = computed<string>(() => {
  let best: FlipRowEval | null = null
  for (const r of flipFiltered.value) if (!best || r.eval.best.platPer1kEndo > best.eval.best.platPer1kEndo) best = r
  return best ? best.url_name : ''
})
const flipStats = computed(() => {
  const list = flipRows.value
  // Headline "best" figures use the liquid subset so a zero-volume ask outlier
  // never becomes the advertised number.
  const liq = liquidFlips.value
  const effs = liq.map((r) => r.eval.best.platPer1kEndo)
  return {
    total: list.length,
    best: effs.length ? Math.max(...effs) : 0,
    topProfit: liq.length ? Math.max(...liq.map((r) => r.eval.best.profit)) : 0,
    partial: list.filter((r) => r.eval.best.rank > 0).length,
  }
})

// Freshness: newest order-book snapshot across all mods.
const updatedLabel = computed<string>(() => {
  let newest = 0
  for (const r of flipData.value?.mods ?? []) {
    const t = Date.parse(r.flip?.updatedAt || '')
    if (!isNaN(t) && t > newest) newest = t
  }
  return newest ? dayjs(newest).fromNow() : ''
})

// ---- Direction B: endo sources ----
const sourceSearch = ref('')
const sourceKind = ref('All')
const srcSortBy = ref('rate')
const srcSortDir = ref<Dir>('desc')
const minEpp = ref<number | null>(null)
const maxCost = ref<number | null>(null)
const sourceSortOptions = computed(() => [
  { text: t('endo.sortSrc.rate'), value: 'rate' },
  { text: t('endo.sortSrc.endo'), value: 'endo' },
  { text: t('endo.sortSrc.cost'), value: 'cost' },
  { text: t('endo.sortSrc.volume'), value: 'volume' },
  { text: t('endo.sortSrc.name'), value: 'name' },
])
const sourceKindOptions = ['All', 'Sculpture', 'Riven', 'Mod']
const srcAccessors: Record<string, (r: EndoSourceRow) => number | string> = {
  rate: (r) => r.endoPerPlat,
  endo: (r) => r.endo,
  cost: (r) => r.plat,
  volume: (r) => r.volume ?? -1,
  name: (r) => r.name.toLowerCase(),
}
function sortSrc(key: string) {
  if (srcSortBy.value === key) srcSortDir.value = srcSortDir.value === 'asc' ? 'desc' : 'asc'
  else {
    srcSortBy.value = key
    srcSortDir.value = key === 'name' || key === 'cost' ? 'asc' : 'desc'
  }
  trackSortChange('sources', key, srcSortDir.value)
}

const sculptureSources = computed<EndoSourceRow[]>(() => {
  const out: EndoSourceRow[] = []
  for (const el of store.allItems as any[]) {
    if (!el?.item_name?.includes('Sculpture')) continue
    const key = (el.url_name || '').split('_')[1] ?? ''
    const endo = SCULPTURE_ENDO[key]
    if (!endo) continue
    const plat = Number(el.market?.sell) || Number(el.market?.sellAvg) || 0
    if (plat <= 0) continue
    out.push({
      kind: 'sculpture',
      name: el.item_name,
      url_name: el.url_name,
      thumb: el.thumb,
      link: itemUrl(el.url_name),
      whisper: buyWhisper(undefined, el.item_name, plat),
      endo,
      plat,
      endoPerPlat: endoPerPlat(endo, plat),
      volume: Number(el.market?.volume) || 0,
      liquidity: 1,
      sub: t('endo.sub.fullyStarred'),
    })
  }
  return out
})
const rivenSources = computed<EndoSourceRow[]>(() => {
  const out: EndoSourceRow[] = []
  for (const r of (rivenData.value as any[]) || []) {
    const it = r?.items || {}
    const endo = Number(it.endo) || 0
    const plat = Number(it.buyout_price) || 0
    if (endo <= 0 || plat <= 0) continue
    const name = `${r.item_name} ${it.item?.name ?? ''}`.trim()
    out.push({
      kind: 'riven',
      name,
      link: it.id ? `https://warframe.market/auction/${it.id}` : 'https://warframe.market/auctions',
      whisper: buyWhisper(undefined, name + ' (riven)', plat),
      endo,
      plat,
      endoPerPlat: Number(it.endoPerPlat) || endoPerPlat(endo, plat),
      liquidity: 1,
      sub: t('endo.sub.rerolls', { n: it.item?.re_rolls ?? 0 }),
    })
  }
  return out
})
const modSources = computed<EndoSourceRow[]>(() => {
  const rows = flipData.value?.mods ?? []
  const out: EndoSourceRow[] = []
  for (const r of rows) {
    if (!isEndoRankableMod(r.url_name, r.tags)) continue
    const s = modAsEndoSource(r)
    // Require real 48h liquidity so the average cost basis is trustworthy — this
    // keeps single-order noise off the leaderboard.
    if (s.plat > 0 && s.endo > 0 && (s.volume || 0) >= 3) out.push(s)
  }
  return out.sort((a, b) => b.endoPerPlat - a.endoPerPlat).slice(0, 25)
})
const sourceRows = computed<EndoSourceRow[]>(() => [
  ...sculptureSources.value,
  ...rivenSources.value,
  ...modSources.value,
])
const sourceFiltered = computed<EndoSourceRow[]>(() => {
  const q = (sourceSearch.value || '').trim().toLowerCase()
  const minR = Number(minEpp.value) || 0
  const maxC = maxCost.value != null ? Number(maxCost.value) : null
  const list = sourceRows.value.filter((r) => {
    if (q && !r.name.toLowerCase().includes(q)) return false
    if (sourceKind.value !== 'All' && r.kind !== sourceKind.value.toLowerCase()) return false
    if (minR && r.endoPerPlat < minR) return false
    if (maxC != null && r.plat > maxC) return false
    return true
  })
  return sortBy(list, srcAccessors[srcSortBy.value] ?? srcAccessors.rate!, srcSortDir.value)
})
const sourcePageCount = computed(() => Math.max(1, Math.ceil(sourceFiltered.value.length / perPage)))
const sourcePaged = computed<EndoSourceRow[]>(() => {
  const start = (page.value - 1) * perPage
  return sourceFiltered.value.slice(start, start + perPage)
})
const topSource = computed<EndoSourceRow | null>(() => {
  let best: EndoSourceRow | null = null
  for (const r of sourceFiltered.value) if (!best || r.endoPerPlat > best.endoPerPlat) best = r
  return best
})
const sourceStats = computed(() => {
  const all = sourceRows.value
  const rate = (arr: EndoSourceRow[]) => (arr.length ? Math.max(...arr.map((r) => r.endoPerPlat)) : 0)
  return {
    total: all.length,
    best: rate(all),
    bestSculpt: rate(sculptureSources.value),
    bestMod: rate(modSources.value),
  }
})

watch([flipFiltered, sourceFiltered, direction], () => {
  page.value = 1
})

// SSR-only crawlable snapshot for <SeoFallbackTable> (see that component for
// why). The page has two independent ledgers gated by `direction` (default
// 'flip', but a shared/bookmarked URL can hydrate it to 'sources' before this
// even runs) — mirror whichever one is actually active during SSR instead of
// hardcoding 'flip', so the fallback always matches the visible tab.
const fallbackNameLabel = computed(() => (direction.value === 'flip' ? t('endo.table.mod') : t('endo.table.source')))
const fallbackColumns = computed(() =>
  direction.value === 'flip'
    ? [t('endo.table.buyAt'), t('endo.table.sellMaxed'), t('endo.table.profit'), t('endo.table.platPer1k')]
    : [t('endo.table.endo'), t('endo.table.cost'), t('endo.table.endoPerPlat')],
)
const fallbackRows = computed(() => {
  if (direction.value === 'flip') {
    return flipFiltered.value.slice(0, 150).map((row) => ({
      key: row.url_name,
      href: mkt(row.url_name),
      name: localItemName(row),
      cells: [
        fmtPlat(row.eval.best.buyIn) + 'p',
        fmtPlat(row.eval.maxedSell) + 'p',
        fmtPlat(row.eval.best.profit) + 'p',
        fmtNum(row.eval.best.platPer1kEndo),
      ],
    }))
  }
  return sourceFiltered.value.slice(0, 150).map((row) => ({
    key: row.kind + row.name,
    href: row.link,
    name: row.name,
    cells: [fmtEndo(row.endo), fmtPlat(row.plat) + 'p', fmtNum(row.endoPerPlat)],
  }))
})

// ---- persist view / filters / sort in the URL query (survives reload) ----
const route = useRoute()
const router = useRouter()
type PType = 'str' | 'num' | 'bool' | 'csv'
const QUERY_PARAMS: Array<[string, any, any, PType]> = [
  ['dir', direction, 'flip', 'str'],
  ['q', search, '', 'str'],
  ['sort', flipSortBy, 'eff', 'str'],
  ['sdir', flipSortDir, 'desc', 'str'],
  ['cat', flipCat, 'All', 'str'],
  ['sell', sellBasis, 'avg', 'str'],
  ['bid', buyViaBid, true, 'bool'],
  ['maxbuy', maxBuyIn, null, 'num'],
  ['minp', minProfit, null, 'num'],
  ['mineff', minEff, null, 'num'],
  ['maxendo', maxEndoFinish, null, 'num'],
  ['minvol', minVolume, 50, 'num'],
  ['rarity', rarityFilter, [], 'csv'],
  ['partial', partialOnly, false, 'bool'],
  ['thin', hideThin, true, 'bool'],
  ['sq', sourceSearch, '', 'str'],
  ['kind', sourceKind, 'All', 'str'],
  ['ssort', srcSortBy, 'rate', 'str'],
  ['ssdir', srcSortDir, 'desc', 'str'],
  ['minepp', minEpp, null, 'num'],
  ['maxcost', maxCost, null, 'num'],
]
const sameCsv = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i])
function hydrateFromQuery() {
  const q = route.query
  for (const [key, r, , type] of QUERY_PARAMS) {
    const raw = q[key as string]
    if (raw == null) continue
    const v = Array.isArray(raw) ? raw[0] : raw
    if (v == null) continue
    if (type === 'str') r.value = String(v)
    else if (type === 'bool') r.value = v === '1' || v === 'true'
    else if (type === 'num') r.value = v === '' ? null : Number(v)
    else if (type === 'csv') r.value = String(v).split(',').filter(Boolean)
  }
}
function buildQuery(): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, r, def, type] of QUERY_PARAMS) {
    const v = r.value
    if (type === 'str') { if (v && v !== def) out[key] = String(v) }
    else if (type === 'bool') { if (v !== def) out[key] = v ? '1' : '0' }
    else if (type === 'num') { if (v != null && v !== def && !Number.isNaN(v)) out[key] = String(v) }
    else if (type === 'csv') { if (Array.isArray(v) && v.length && !sameCsv(v, def)) out[key] = v.join(',') }
  }
  return out
}
let queryTimer: any = null
function writeQuery() {
  if (queryTimer) clearTimeout(queryTimer)
  queryTimer = setTimeout(() => {
    router.replace({ query: buildQuery() }).catch(() => {})
  }, 300)
}
hydrateFromQuery()
watch(buildQuery, writeQuery, { deep: true })

// ---- analytics -------------------------------------------------------------
// Reporting only: nothing below changes what the page computes or shows.
const { track, trackSearch, trackFilter, trackCalc, trackAction, trackDialog, trackMarketOpen, trackTradeCopy } =
  useAnalytics()

// `calc_run` must mean "the user re-priced the ledger", so it is armed by input
// handlers only — the catalogue poll feeds the same computeds every 2 minutes
// and would otherwise report a calculation nobody asked for. The delay both
// collapses a burst of typing/toggling into one event and lets the computeds
// settle, so `results_count` is the list the user actually ends up looking at.
let calcTimer: any = null
function armCalc() {
  if (calcTimer) clearTimeout(calcTimer)
  calcTimer = setTimeout(() => {
    trackCalc('endo_flip', {
      direction: direction.value,
      sell_basis: sellBasis.value,
      buy_via_bid: buyViaBid.value,
      results_count: direction.value === 'flip' ? flipFiltered.value.length : sourceFiltered.value.length,
    })
  }, 900)
}

// Text/number fields change on every keystroke; report the value the user
// settled on rather than the digits typed on the way there.
const fieldTimers: Record<string, any> = {}
let suppressFilterEvents = false
function trackNumberFilter(name: string, v: number | string | null | undefined) {
  // Drop any pending emit first: a reset must not let the value typed 200 ms
  // earlier land as its own filter_apply after the suppression window closes.
  if (fieldTimers[name]) clearTimeout(fieldTimers[name])
  if (suppressFilterEvents) return
  armCalc()
  // `type="number"` fields hand back the raw input string (and '' when emptied),
  // so coerce: filter_value is always a GA4 number or the literal 'cleared'.
  const n = v == null || v === '' ? NaN : Number(v)
  fieldTimers[name] = setTimeout(() => {
    trackFilter(name, Number.isFinite(n) ? n : 'cleared')
  }, 700)
}
function trackSearchDebounced(table: 'flip' | 'sources', term: string | null) {
  armCalc()
  if (fieldTimers[table]) clearTimeout(fieldTimers[table])
  const q = (term || '').trim()
  if (q.length < 2) return
  fieldTimers[table] = setTimeout(() => {
    trackSearch(q, table === 'flip' ? flipFiltered.value.length : sourceFiltered.value.length, { table })
  }, 700)
}

function onDirectionChange(v: any) {
  trackFilter('direction', String(v))
  armCalc()
}
function onSellBasisChange(v: any) {
  trackFilter('sell_basis', String(v))
  armCalc()
}
function onBuyViaBidChange(v: any) {
  trackFilter('buy_via_bid', !!v)
  armCalc()
}
function onPartialOnlyChange(v: any) {
  trackFilter('partial_only', !!v)
  armCalc()
}
function onHideThinChange(v: any) {
  trackFilter('hide_thin', !!v)
  armCalc()
}
function onRarityChange(v: any) {
  // Sorted so "Rare,Legendary" and "Legendary,Rare" are one value, not two:
  // click order would otherwise turn 15 combinations into 64 permutations.
  const picked: string[] = Array.isArray(v) ? [...v].sort() : []
  trackFilter('rarity', picked.length ? picked.join(',') : 'any')
  armCalc()
}
function onFlipCatChange(v: any) {
  trackFilter('category', String(v))
  armCalc()
}
function onSourceKindChange(v: any) {
  trackFilter('source_kind', String(v))
  armCalc()
}
function toggleAdv() {
  showAdv.value = !showAdv.value
  if (showAdv.value) trackAction('advanced_open')
}
// The page has two independent ledgers, so sort_change carries `table`; the
// trackSort() helper has no slot for it, hence the generic track().
function trackSortChange(table: 'flip' | 'sources', by: string, dir: Dir) {
  track('sort_change', { sort_by: by, sort_dir: dir, table })
}
function onFlipSortSelect(v: any) {
  trackSortChange('flip', String(v), flipSortDir.value)
}
function toggleFlipSortDir() {
  flipSortDir.value = flipSortDir.value === 'desc' ? 'asc' : 'desc'
  trackSortChange('flip', flipSortBy.value, flipSortDir.value)
}
function onSrcSortSelect(v: any) {
  trackSortChange('sources', String(v), srcSortDir.value)
}
function toggleSrcSortDir() {
  srcSortDir.value = srcSortDir.value === 'desc' ? 'asc' : 'desc'
  trackSortChange('sources', srcSortBy.value, srcSortDir.value)
}
function onPageChange(v: number) {
  trackAction('paginate', { page: v, table: direction.value === 'flip' ? 'flip' : 'sources' })
}
// Explicit market_open events: the delegated outbound-click listener sees the
// URL but not which mod/source row (or which surface) sent the user there.
function trackMarket(itemName: string, source: string) {
  trackMarketOpen(itemName, { source })
}
function trackSourceOpen(row: EndoSourceRow, source: string) {
  trackMarketOpen(row.name, { source, kind: row.kind })
}
function trackWiki(itemName: string) {
  trackAction('wiki_open', { item_name: itemName })
}
function copyFlipWhisper(row: FlipRowEval) {
  const b = row.eval.best
  copy(buyWhisper(b.askUser, row.item_name, b.ask || b.buyIn), 'f:' + row.url_name)
  trackTradeCopy(row.item_name, { side: 'wtb', price: b.ask || b.buyIn, rank: b.rank })
}
function copySourceWhisper(row: EndoSourceRow) {
  copy(row.whisper, 's:' + row.kind + row.name)
  trackTradeCopy(row.name, { side: 'wtb', price: row.plat, kind: row.kind })
}

// Registered after hydrateFromQuery() so a shared or bookmarked URL does not
// replay its filters as if the visitor had just typed them.
watch(search, (v) => trackSearchDebounced('flip', v))
watch(sourceSearch, (v) => trackSearchDebounced('sources', v))
watch(maxBuyIn, (v) => trackNumberFilter('max_buy_in', v))
watch(minProfit, (v) => trackNumberFilter('min_profit', v))
watch(minEff, (v) => trackNumberFilter('min_eff', v))
watch(maxEndoFinish, (v) => trackNumberFilter('endo_budget', v))
watch(minVolume, (v) => trackNumberFilter('min_volume', v))
watch(minEpp, (v) => trackNumberFilter('min_endo_per_plat', v))
watch(maxCost, (v) => trackNumberFilter('max_cost', v))

// ---- helpers ----
function rankLabel(rank: number): string {
  return rank <= 0 ? t('endo.rank.unranked') : t('endo.rank.n', { n: rank })
}
function assetUrl(thumb: string): string {
  return 'https://warframe.market/static/assets/' + (thumb || '')
}
function mkt(urlName: string): string {
  return itemUrl(urlName)
}
const placeholderImg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Crect width='44' height='44' rx='8' fill='%232a2a3d'/%3E%3Cpath d='M22 11 L31 22 L22 33 L13 22 Z' fill='none' stroke='%234fb3bf' stroke-width='2' opacity='0.75'/%3E%3C/svg%3E"
function onImgError(e: any) {
  const img = e.target
  if (!img || img.dataset.fallback) return
  img.dataset.fallback = '1'
  img.src = placeholderImg
}

function finishLoading(attempt = 0) {
  nextTick(() => {
    const el = document.getElementById('spinner-wrapper')
    if (el) el.style.display = 'none'
    else if (attempt < 20) finishLoading(attempt + 1)
  })
}
onMounted(() => {
  finishLoading()
})
</script>

<style scoped>
.an-dir {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px 16px;
  margin: 4px 0 14px;
}
.an-dir__right {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}
.an-fresh {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.76rem;
  color: #9aa0b4;
}
.an-dir__toggle :deep(.v-btn-toggle) {
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  overflow: hidden;
}
.an-dir__toggle :deep(.v-btn) {
  text-transform: none;
  letter-spacing: 0;
  font-weight: 600;
  color: #b6bcd0 !important;
  background: transparent !important;
}
.an-dir__toggle :deep(.v-btn.v-btn--active) {
  background: rgba(212, 175, 90, 0.9) !important;
  color: #17131f !important;
}
.endo-guide-link {
  color: #e7cf95;
  text-decoration: none;
  font-weight: 600;
  white-space: nowrap;
}
.endo-guide-link:hover {
  color: #f4e2b4;
}
/* Mobile: the direction-toggle bar was space-between + wrap, which left the
   segmented toggle and the freshness/guide row ragged with a big gap. Stack
   them: full-width toggle on its own line, meta row beneath. */
@media (max-width: 640px) {
  .an-dir {
    justify-content: flex-start;
    gap: 8px 12px;
    margin: 2px 0 12px;
  }
  .an-dir__toggle {
    flex: 1 1 100%;
  }
  .an-dir__toggle :deep(.v-btn-toggle) {
    display: flex;
    width: 100%;
  }
  .an-dir__toggle :deep(.v-btn) {
    flex: 1 1 0;
  }
  .an-dir__right {
    width: 100%;
    justify-content: space-between;
    gap: 10px;
  }
}
.an-sortctl {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1 1 240px;
  min-width: 200px;
}
.an-advbtn {
  color: #d4af5a;
  flex: 0 0 auto;
}
/* Sortable headers */
.an-table th.sortable {
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  transition: color 0.12s ease;
}
.an-table th.sortable:hover {
  color: #f4e2b4;
}
.an-table th.is-sorted {
  color: #d4af5a;
}
.sort-ind {
  font-size: 0.72em;
  opacity: 0.5;
  margin-left: 2px;
}
.an-table th.is-sorted .sort-ind {
  opacity: 1;
}
.col-act {
  width: 1%;
  white-space: nowrap;
  text-align: right;
}
/* Copy / open buttons */
.an-copy {
  display: inline-grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 6px;
  border: 1px solid rgba(79, 179, 191, 0.3);
  color: #4fb3bf;
  background: transparent;
  cursor: pointer;
  transition: all 0.14s ease;
  margin-left: 4px;
  vertical-align: middle;
}
.an-copy:hover {
  color: #d4af5a;
  border-color: rgba(212, 175, 90, 0.5);
  background: rgba(212, 175, 90, 0.08);
}
.an-copy.is-copied {
  color: #4caf7d;
  border-color: rgba(76, 175, 125, 0.6);
}
/* Whisper button warns when buying instantly (the price it copies) is a loss. */
.an-copy.is-warn,
.an-copybtn.is-warn {
  color: #e0a35a;
  border-color: rgba(224, 163, 90, 0.55);
}
/* Instant-buy price shown beside the modeled buy-order buy-in. */
.an-instant {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 0.68rem;
  color: #4fb3bf;
  letter-spacing: 0.02em;
  white-space: nowrap;
}
.an-instant.is-loss {
  color: #e0a35a;
}
.an-instant .v-icon {
  opacity: 0.9;
}
/* Mobile flip block's "buy now" (instant) row: cyan by default, amber on loss. */
.an-block__row--instant b {
  color: #4fb3bf;
}
.an-block__row .is-loss {
  color: #e0a35a !important;
}
.an-set__help {
  font-size: 0.66rem;
  line-height: 1.35;
  color: #8f95ab;
  max-width: 300px;
  margin-top: 2px;
}
/* Mobile card action row: wiki + drops icons beside the full-width copy button. */
.an-card__acts {
  display: flex;
  align-items: stretch;
  gap: 8px;
  margin-top: 8px;
}
.an-card__acts .an-copy {
  width: 40px;
  flex: 0 0 auto;
}
.an-card__acts .an-copybtn {
  margin-top: 0;
  flex: 1 1 auto;
}
.an-copybtn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 5px 12px;
  border-radius: 7px;
  border: 1px solid rgba(79, 179, 191, 0.3);
  color: #4fb3bf;
  background: transparent;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  justify-content: center;
}
.an-copybtn.is-copied {
  color: #4caf7d;
  border-color: rgba(76, 175, 125, 0.6);
}
/* Visible keyboard focus for the interactive controls (quality floor). */
.an-copy:focus-visible,
.an-copybtn:focus-visible,
.an-table th.sortable:focus-visible {
  outline: 2px solid #4fb3bf;
  outline-offset: 2px;
  color: #f4e2b4;
}
/* Advanced panel */
.an-adv {
  margin: 4px 0 8px;
  padding: 12px 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.02);
}
.an-adv__section {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #d4af5a;
  margin: 4px 0 8px;
}
.an-adv__settings {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 12px 28px;
  margin-bottom: 10px;
}
/* Each setting is a labelled column so the "Sell maxed at" toggle and the
   "Buy-in" switch line up on the same baseline instead of drifting. */
.an-set {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
}
.an-set__lbl {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: #9aa0b4;
}
/* Keep the switch's control row the same height as the toggle so both settings
   groups align. */
.an-set__switch {
  margin-top: 1px;
}
.an-set__switch :deep(.v-selection-control) {
  min-height: 30px;
}
.an-minitoggle :deep(.v-btn-toggle) {
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  overflow: hidden;
}
.an-minitoggle :deep(.v-btn) {
  text-transform: none;
  letter-spacing: 0;
  color: #b6bcd0 !important;
  background: transparent !important;
}
.an-minitoggle :deep(.v-btn.v-btn--active) {
  background: rgba(79, 179, 191, 0.85) !important;
  color: #10171b !important;
}
.an-adv__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 10px 14px;
}
.an-adv__chips {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  margin-top: 8px;
}
/* Vuetify chip-groups default to a ~48px min-height, which left a big empty gap
   under the "Rarity" label on mobile. Collapse it and tighten the chip gap. */
.an-adv__chips :deep(.v-chip-group) {
  min-height: 0;
  padding: 0;
}
.an-adv__chips :deep(.v-slide-group__content) {
  padding: 2px 0;
  gap: 6px;
}
.an-adv__lbl {
  font-size: 0.72rem;
  color: #9aa0b4;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
/* Source-kind badge */
.an-kind {
  display: inline-block;
  flex: none;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  border-radius: 5px;
  padding: 3px 7px;
  margin-right: 4px;
  border: 1px solid transparent;
}
.kind--sculpture { color: #d4af5a; background: rgba(212, 175, 90, 0.14); border-color: rgba(212, 175, 90, 0.4); }
.kind--riven { color: #c4b0ee; background: rgba(159, 122, 234, 0.16); border-color: rgba(159, 122, 234, 0.42); }
.kind--mod { color: #4fb3bf; background: rgba(79, 179, 191, 0.14); border-color: rgba(79, 179, 191, 0.4); }
/* Demand meter */
/* Verdict row: lay the plat/1k pill and the demand meter on one spaced line so
   the meter doesn't butt up against the pill (the global rule only sets margin). */
.an-card__verdict {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 14px;
}
.an-demand {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  white-space: nowrap;
}
.an-demand__bar {
  display: inline-block;
  width: 42px;
  height: 5px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.12);
  overflow: hidden;
}
.an-demand__bar i {
  display: block;
  height: 100%;
  border-radius: 3px;
  background: currentColor;
}
.dem--high { color: #4caf7d; }
.dem--med { color: #d4af5a; }
.dem--low { color: #d98a4f; }
.dem--dead { color: #8a8fa3; }
.an-toggles {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 20px;
  margin-top: 6px;
}
.an-toggle :deep(.v-label) {
  font-size: 0.8rem;
  color: #b6bcd0;
  opacity: 1;
}
.an-hidden {
  color: #9aa0b4;
  margin-left: 6px;
  font-size: 0.92em;
}
.donation_icon {
  display: block;
  width: 50px;
  height: 50px;
  object-fit: contain;
}
</style>
