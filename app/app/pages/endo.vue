<template>
  <div class="an">
    <client-only>
      <div class="an-console">
        <!-- Hero -->
        <header class="an-hero">
          <div class="an-hero__text">
            <div class="an-eyebrow">Warframe Market · Endo Exchange</div>
            <h1 v-if="direction === 'flip'" class="an-title">
              Turn <span class="accent-b">endo</span> into
              <span class="accent-a">platinum</span>
            </h1>
            <h1 v-else class="an-title">
              Buy <span class="accent-a">endo</span> for the least
              <span class="accent-b">platinum</span>
            </h1>
            <p v-if="direction === 'flip'" class="an-lede">
              Sitting on endo with nothing left to max? Buy a mod cheap — unranked
              <em>or partly ranked</em> — finish it with your endo, and resell it
              maxed. Ranked by platinum per 1,000 endo across <b>well-traded
              mods</b>, so the numbers reflect what actually sells — and it tells
              you the cheapest rank to buy in at.
            </p>
            <p v-else class="an-lede">
              The cheapest endo per platinum across Ayatan sculptures, rivens, and
              normal mods (bought maxed and dissolved). Click any source to open it
              on warframe.market, or copy a ready-to-send buy whisper.
            </p>
          </div>
          <div v-if="direction === 'flip' && topFlip" class="an-hero__deal">
            <div class="an-hero__deal-label">Best plat / 1k endo</div>
            <div class="an-hero__deal-plat">{{ fmtNum(topFlip.eval.best.platPer1kEndo) }}<span>p/1k</span></div>
            <a class="an-hero__deal-name" :href="mkt(topFlip.url_name)" target="_blank" rel="noopener">
              {{ topFlip.item_name }} →
            </a>
            <div class="an-hero__deal-sub">buy {{ rankLabel(topFlip.eval.best.rank) }} · +{{ fmtPlat(topFlip.eval.best.profit) }}p maxed</div>
          </div>
          <div v-else-if="direction === 'sources' && topSource" class="an-hero__deal">
            <div class="an-hero__deal-label">Best endo / plat</div>
            <div class="an-hero__deal-plat">{{ fmtNum(topSource.endoPerPlat) }}<span>e/p</span></div>
            <a class="an-hero__deal-name" :href="topSource.link" target="_blank" rel="noopener">{{ topSource.name }} →</a>
            <div class="an-hero__deal-sub">{{ fmtEndo(topSource.endo) }} endo · {{ fmtPlat(topSource.plat) }}p</div>
          </div>
        </header>

        <!-- Direction toggle + freshness -->
        <div class="an-dir">
          <v-btn-toggle v-model="direction" mandatory density="compact" class="an-dir__toggle">
            <v-btn value="flip" size="small">Spend endo → plat</v-btn>
            <v-btn value="sources" size="small">Get endo cheap</v-btn>
          </v-btn-toggle>
          <div class="an-dir__right">
            <span v-if="updatedLabel" class="an-fresh" title="When the newest order-book snapshot was taken">
              <v-icon size="14">mdi-clock-outline</v-icon> prices updated {{ updatedLabel }}
            </span>
            <NuxtLink to="/guides/endo" class="endo-guide-link">Endo guide →</NuxtLink>
          </div>
        </div>

        <!-- ============ DIRECTION A: MOD FLIP ============ -->
        <template v-if="direction === 'flip'">
          <div class="an-stats">
            <div class="an-stat">
              <div class="an-stat__num">{{ flipStats.total }}</div>
              <div class="an-stat__lbl">flippable mods</div>
            </div>
            <div class="an-stat">
              <div class="an-stat__num is-good">{{ fmtNum(flipStats.best) }}</div>
              <div class="an-stat__lbl">best plat / 1k endo</div>
            </div>
            <div class="an-stat">
              <div class="an-stat__num is-gold">{{ fmtPlat(flipStats.topProfit) }}p</div>
              <div class="an-stat__lbl">biggest maxed profit</div>
            </div>
            <div class="an-stat">
              <div class="an-stat__num is-alt">{{ flipStats.partial }}</div>
              <div class="an-stat__lbl">best bought part-ranked</div>
            </div>
          </div>

          <section class="an-filters">
            <div class="an-filters__row">
              <v-text-field v-model="search" density="compact" hide-details clearable prepend-inner-icon="mdi-magnify" label="Search a mod" class="an-search"></v-text-field>
              <div class="an-sortctl">
                <v-select v-model="flipSortBy" :items="flipSortOptions" item-title="text" item-value="value" density="compact" hide-details label="Sort by" class="an-field" style="flex:1 1 190px"></v-select>
                <v-btn :icon="flipSortDir === 'desc' ? 'mdi-sort-descending' : 'mdi-sort-ascending'" size="small" variant="tonal" color="#d4af5a" :title="flipSortDir === 'desc' ? 'Descending' : 'Ascending'" @click="flipSortDir = flipSortDir === 'desc' ? 'asc' : 'desc'"></v-btn>
              </div>
              <v-btn variant="text" size="small" class="an-advbtn" :append-icon="showAdv ? 'mdi-chevron-up' : 'mdi-tune-variant'" @click="showAdv = !showAdv">Filters & settings</v-btn>
            </div>

            <v-expand-transition>
              <div v-show="showAdv" class="an-adv">
                <!-- Settings: pricing model -->
                <div class="an-adv__section">Pricing model</div>
                <div class="an-adv__settings">
                  <div class="an-set">
                    <div class="an-set__lbl">Sell maxed at</div>
                    <v-btn-toggle v-model="sellBasis" mandatory density="compact" class="an-minitoggle">
                      <v-btn value="ask" size="x-small">Current ask</v-btn>
                      <v-btn value="instant" size="x-small">Instant</v-btn>
                      <v-btn value="avg" size="x-small">48h avg</v-btn>
                    </v-btn-toggle>
                  </div>
                  <div class="an-set">
                    <div class="an-set__lbl">Buy-in</div>
                    <v-switch v-model="buyViaBid" hide-details density="compact" inset color="#4fb3bf" label="Via buy order (compete on bids)" class="an-toggle an-set__switch"></v-switch>
                  </div>
                </div>

                <div class="an-adv__section">Filters</div>
                <div class="an-adv__grid">
                  <v-text-field v-model.number="maxBuyIn" type="number" min="0" density="compact" hide-details clearable label="Max buy-in (p)" class="an-adv__f"></v-text-field>
                  <v-text-field v-model.number="minProfit" type="number" min="0" density="compact" hide-details clearable label="Min profit (p)" class="an-adv__f"></v-text-field>
                  <v-text-field v-model.number="minEff" type="number" min="0" density="compact" hide-details clearable label="Min plat / 1k endo" class="an-adv__f"></v-text-field>
                  <v-text-field v-model.number="maxEndoFinish" type="number" min="0" density="compact" hide-details clearable label="Endo budget (max to finish)" class="an-adv__f"></v-text-field>
                  <v-text-field v-model.number="minVolume" type="number" min="0" density="compact" hide-details clearable label="Min maxed volume (48h)" class="an-adv__f"></v-text-field>
                </div>
                <div class="an-adv__chips">
                  <span class="an-adv__lbl">Rarity</span>
                  <v-chip-group v-model="rarityFilter" multiple column class="an-cats">
                    <v-chip v-for="r in rarityOptions" :key="r" :value="r" size="small" filter active-class="an-chip--on">{{ r }}</v-chip>
                  </v-chip-group>
                </div>
                <div class="an-toggles">
                  <v-switch v-model="partialOnly" hide-details density="compact" inset color="#4fb3bf" label="Only mods best bought part-ranked (R1+)" class="an-toggle"></v-switch>
                  <v-switch v-model="hideThin" hide-details density="compact" inset color="#4fb3bf" label="Hide thin demand (maxed barely trades)" class="an-toggle"></v-switch>
                  <v-btn variant="text" size="x-small" color="#9aa0b4" @click="resetFlipFilters">Reset</v-btn>
                </div>
              </div>
            </v-expand-transition>

            <v-chip-group v-model="flipCat" mandatory column class="an-cats">
              <v-chip v-for="c in flipCatOptions" :key="c" :value="c" size="small" active-class="an-chip--on">{{ c }}</v-chip>
            </v-chip-group>
            <div class="an-count">{{ flipFiltered.length }} {{ flipFiltered.length === 1 ? 'mod' : 'mods' }} match<span v-if="hiddenThin && hideThin" class="an-hidden">· {{ hiddenThin }} thin demand hidden</span></div>
          </section>

          <v-alert v-if="loadError" type="error" density="compact" class="ma-4">
            Couldn't load mod-flip data. The market service may be waking up — try a refresh.
          </v-alert>
          <div v-else-if="!flipRows.length" class="an-empty">No flip data yet — the market is still syncing.</div>
          <div v-else-if="!flipFiltered.length" class="an-empty">No mods match these filters. Widen the search or clear a filter.</div>

          <!-- Desktop table -->
          <div v-else-if="!isMobile" class="an-tablewrap">
            <table class="an-table">
              <thead>
                <tr>
                  <th class="col-name sortable" :class="thCls('name', 'flip')" @click="sortFlip('name')">Mod <span class="sort-ind">{{ arrow('name', flipSortBy, flipSortDir) }}</span></th>
                  <th class="grp-a sortable" :class="thCls('buyat', 'flip')" @click="sortFlip('buyat')">Buy @ <span class="sort-ind">{{ arrow('buyat', flipSortBy, flipSortDir) }}</span></th>
                  <th class="grp-b sortable" :class="thCls('sell', 'flip')" @click="sortFlip('sell')">Sell maxed <span class="sort-ind">{{ arrow('sell', flipSortBy, flipSortDir) }}</span></th>
                  <th class="sortable" :class="thCls('profit', 'flip')" @click="sortFlip('profit')">Profit <span class="sort-ind">{{ arrow('profit', flipSortBy, flipSortDir) }}</span></th>
                  <th class="sortable" :class="thCls('endo', 'flip')" @click="sortFlip('endo')">Endo <span class="sort-ind">{{ arrow('endo', flipSortBy, flipSortDir) }}</span></th>
                  <th class="sortable" :class="thCls('eff', 'flip')" @click="sortFlip('eff')">Plat / 1k endo <span class="sort-ind">{{ arrow('eff', flipSortBy, flipSortDir) }}</span></th>
                  <th class="sortable" :class="thCls('volume', 'flip')" @click="sortFlip('volume')">Demand <span class="sort-ind">{{ arrow('volume', flipSortBy, flipSortDir) }}</span></th>
                  <th class="col-act"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in flipPaged" :key="row.url_name" :class="{ 'is-top': row.url_name === topFlipUrl }">
                  <td class="col-name">
                    <a class="an-name" :href="mkt(row.url_name)" target="_blank" rel="noopener">
                      <img class="an-thumb" :src="assetUrl(row.thumb)" :alt="row.item_name" loading="lazy" @error="onImgError" />
                      <span>
                        {{ row.item_name }}
                        <span v-if="row.url_name === topFlipUrl" class="an-badge">TOP</span>
                        <small class="an-sub">{{ row.eval.rarity }} · R{{ row.eval.maxRank }} · {{ fmtEndo(row.eval.endoToMax) }} endo to max</small>
                      </span>
                    </a>
                  </td>
                  <td class="grp-a an-num">
                    <b>{{ rankLabel(row.eval.best.rank) }}</b>
                    <small class="an-sub">{{ fmtPlat(row.eval.best.buyIn) }}p{{ buyViaBid ? ' (bid)' : '' }}</small>
                  </td>
                  <td class="grp-b an-num" :title="`ask ${fmtPlat(row.eval.maxedAsk)}p · 48h avg ${fmtPlat(row.eval.maxedAvg)}p · instant ${fmtPlat(row.eval.maxedBid)}p`">
                    {{ fmtPlat(row.eval.maxedSell) }}p
                    <small class="an-sub">instant {{ fmtPlat(row.eval.maxedBid) }}p</small>
                  </td>
                  <td class="an-num up an-strong">+{{ fmtPlat(row.eval.best.profit) }}p</td>
                  <td class="an-num">
                    {{ fmtEndoK(row.eval.best.endoToFinish) }}
                    <small class="an-sub">{{ fmtEndoK(row.eval.best.creditsToFinish / 1000) }}k cr</small>
                  </td>
                  <td class="an-num an-strong">{{ fmtNum(row.eval.best.platPer1kEndo) }}</td>
                  <td>
                    <span class="an-demand" :class="row.eval.demand.cls" :title="`${Math.round(row.eval.liquidity * 100)}% liquidity · vol ${fmtPlat(row.eval.maxedVolume)}`">
                      <span class="an-demand__bar"><i :style="{ width: Math.round(row.eval.liquidity * 100) + '%' }"></i></span>
                      {{ fmtPlat(row.eval.maxedVolume) }}
                    </span>
                  </td>
                  <td class="col-act">
                    <button class="an-copy" :class="{ 'is-copied': copiedKey === 'f:' + row.url_name }" :title="'Copy WTB whisper (' + fmtPlat(row.eval.best.buyIn) + 'p)'" @click="copy(buyWhisper(row.item_name, row.eval.best.buyIn), 'f:' + row.url_name)">
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
              <a class="an-card__head" :href="mkt(row.url_name)" target="_blank" rel="noopener">
                <img class="an-thumb" :src="assetUrl(row.thumb)" :alt="row.item_name" loading="lazy" @error="onImgError" />
                <div class="an-card__title">
                  <div class="an-card__name">{{ row.item_name }}<span v-if="row.url_name === topFlipUrl" class="an-badge">TOP</span></div>
                  <small class="an-sub">{{ row.eval.rarity }} · R{{ row.eval.maxRank }} · {{ fmtEndo(row.eval.endoToMax) }} endo to max</small>
                </div>
                <v-icon color="#4fb3bf">mdi-open-in-new</v-icon>
              </a>
              <div class="an-card__verdict">
                <span class="pill pill--good">{{ fmtNum(row.eval.best.platPer1kEndo) }} <b>plat / 1k endo</b></span>
                <span class="an-demand" :class="row.eval.demand.cls">
                  <span class="an-demand__bar"><i :style="{ width: Math.round(row.eval.liquidity * 100) + '%' }"></i></span>
                  {{ row.eval.demand.label }}
                </span>
              </div>
              <div class="an-card__blocks">
                <div class="an-block">
                  <div class="an-block__lbl">The flip</div>
                  <div class="an-block__row"><span>Buy {{ rankLabel(row.eval.best.rank) }}</span><b>{{ fmtPlat(row.eval.best.buyIn) }}p</b></div>
                  <div class="an-block__row"><span>Sell maxed</span><b>{{ fmtPlat(row.eval.maxedSell) }}p</b></div>
                  <div class="an-block__row"><span>Profit</span><b class="up">+{{ fmtPlat(row.eval.best.profit) }}p</b></div>
                </div>
                <div class="an-block">
                  <div class="an-block__lbl">Cost to finish</div>
                  <div class="an-block__row"><span>Endo</span><b>{{ fmtEndo(row.eval.best.endoToFinish) }}</b></div>
                  <div class="an-block__row"><span>Credits</span><b>{{ fmtEndo(row.eval.best.creditsToFinish) }}</b></div>
                  <div class="an-block__row"><span>Maxed vol</span><b>{{ fmtPlat(row.eval.maxedVolume) }}</b></div>
                </div>
              </div>
              <button class="an-copybtn" :class="{ 'is-copied': copiedKey === 'f:' + row.url_name }" @click="copy(buyWhisper(row.item_name, row.eval.best.buyIn), 'f:' + row.url_name)">
                <v-icon size="16">{{ copiedKey === 'f:' + row.url_name ? 'mdi-check' : 'mdi-content-copy' }}</v-icon>
                {{ copiedKey === 'f:' + row.url_name ? 'Copied whisper' : 'Copy buy whisper' }}
              </button>
            </div>
          </div>

          <div v-if="flipFiltered.length > perPage" class="an-pager">
            <v-pagination v-model="page" :length="flipPageCount" :total-visible="isMobile ? 5 : 9" color="#d4af5a"></v-pagination>
          </div>
        </template>

        <!-- ============ DIRECTION B: ENDO SOURCES ============ -->
        <template v-else>
          <div class="an-stats">
            <div class="an-stat">
              <div class="an-stat__num">{{ sourceStats.total }}</div>
              <div class="an-stat__lbl">endo sources</div>
            </div>
            <div class="an-stat">
              <div class="an-stat__num is-good">{{ fmtNum(sourceStats.best) }}</div>
              <div class="an-stat__lbl">best endo / plat</div>
            </div>
            <div class="an-stat">
              <div class="an-stat__num is-gold">{{ fmtNum(sourceStats.bestSculpt) }}</div>
              <div class="an-stat__lbl">best sculpture e/p</div>
            </div>
            <div class="an-stat">
              <div class="an-stat__num is-alt">{{ fmtNum(sourceStats.bestMod) }}</div>
              <div class="an-stat__lbl">best mod e/p</div>
            </div>
          </div>

          <section class="an-filters">
            <div class="an-filters__row">
              <v-text-field v-model="sourceSearch" density="compact" hide-details clearable prepend-inner-icon="mdi-magnify" label="Search a source" class="an-search"></v-text-field>
              <div class="an-sortctl">
                <v-select v-model="srcSortBy" :items="sourceSortOptions" item-title="text" item-value="value" density="compact" hide-details label="Sort by" class="an-field" style="flex:1 1 190px"></v-select>
                <v-btn :icon="srcSortDir === 'desc' ? 'mdi-sort-descending' : 'mdi-sort-ascending'" size="small" variant="tonal" color="#d4af5a" @click="srcSortDir = srcSortDir === 'desc' ? 'asc' : 'desc'"></v-btn>
              </div>
              <v-text-field v-model.number="minEpp" type="number" min="0" density="compact" hide-details clearable label="Min endo / plat" class="an-field" style="flex:0 1 150px"></v-text-field>
              <v-text-field v-model.number="maxCost" type="number" min="0" density="compact" hide-details clearable label="Max cost (p)" class="an-field" style="flex:0 1 140px"></v-text-field>
            </div>
            <v-chip-group v-model="sourceKind" mandatory column class="an-cats">
              <v-chip v-for="c in sourceKindOptions" :key="c" :value="c" size="small" active-class="an-chip--on">{{ c }}</v-chip>
            </v-chip-group>
            <div class="an-count">{{ sourceFiltered.length }} sources match</div>
          </section>

          <div v-if="!sourceRows.length" class="an-empty">No endo-source data yet — items and rivens are still syncing.</div>
          <div v-else-if="!sourceFiltered.length" class="an-empty">No sources match these filters.</div>

          <div v-else-if="!isMobile" class="an-tablewrap">
            <table class="an-table">
              <thead>
                <tr>
                  <th class="col-name sortable" :class="thCls('name', 'src')" @click="sortSrc('name')">Source <span class="sort-ind">{{ arrow('name', srcSortBy, srcSortDir) }}</span></th>
                  <th class="grp-a sortable" :class="thCls('endo', 'src')" @click="sortSrc('endo')">Endo <span class="sort-ind">{{ arrow('endo', srcSortBy, srcSortDir) }}</span></th>
                  <th class="grp-b sortable" :class="thCls('cost', 'src')" @click="sortSrc('cost')">Cost <span class="sort-ind">{{ arrow('cost', srcSortBy, srcSortDir) }}</span></th>
                  <th class="sortable" :class="thCls('rate', 'src')" @click="sortSrc('rate')">Endo / plat <span class="sort-ind">{{ arrow('rate', srcSortBy, srcSortDir) }}</span></th>
                  <th class="sortable" :class="thCls('volume', 'src')" @click="sortSrc('volume')">Vol <span class="sort-ind">{{ arrow('volume', srcSortBy, srcSortDir) }}</span></th>
                  <th class="col-act"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in sourcePaged" :key="row.kind + row.name" :class="{ 'is-top': row === topSource }">
                  <td class="col-name">
                    <a class="an-name" :href="row.link" target="_blank" rel="noopener">
                      <span class="an-kind" :class="'kind--' + row.kind">{{ row.kind }}</span>
                      <span>
                        {{ row.name }}
                        <span v-if="row === topSource" class="an-badge">TOP</span>
                        <small class="an-sub">{{ row.sub }}</small>
                      </span>
                    </a>
                  </td>
                  <td class="grp-a an-num">{{ fmtEndo(row.endo) }}</td>
                  <td class="grp-b an-num">{{ fmtPlat(row.plat) }}p</td>
                  <td class="an-num an-strong">{{ fmtNum(row.endoPerPlat) }}</td>
                  <td class="an-num">{{ row.volume != null ? fmtPlat(row.volume) : '—' }}</td>
                  <td class="col-act">
                    <a class="an-copy" :href="row.link" target="_blank" rel="noopener" title="Open on warframe.market"><v-icon size="16">mdi-open-in-new</v-icon></a>
                    <button class="an-copy" :class="{ 'is-copied': copiedKey === 's:' + row.kind + row.name }" title="Copy WTB whisper" @click="copy(row.whisper, 's:' + row.kind + row.name)">
                      <v-icon size="16">{{ copiedKey === 's:' + row.kind + row.name ? 'mdi-check' : 'mdi-content-copy' }}</v-icon>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-else class="an-cards">
            <div v-for="row in sourcePaged" :key="row.kind + row.name" class="an-card" :class="{ 'is-top': row === topSource }">
              <a class="an-card__head" :href="row.link" target="_blank" rel="noopener">
                <span class="an-kind" :class="'kind--' + row.kind">{{ row.kind }}</span>
                <div class="an-card__title">
                  <div class="an-card__name">{{ row.name }}<span v-if="row === topSource" class="an-badge">TOP</span></div>
                  <small class="an-sub">{{ row.sub }}</small>
                </div>
                <v-icon color="#4fb3bf">mdi-open-in-new</v-icon>
              </a>
              <div class="an-card__blocks">
                <div class="an-block">
                  <div class="an-block__lbl">Endo per plat</div>
                  <div class="an-block__row"><span>Rate</span><b class="up">{{ fmtNum(row.endoPerPlat) }}</b></div>
                  <div class="an-block__row"><span>Endo</span><b>{{ fmtEndo(row.endo) }}</b></div>
                  <div class="an-block__row"><span>Cost</span><b>{{ fmtPlat(row.plat) }}p</b></div>
                </div>
              </div>
              <button class="an-copybtn" :class="{ 'is-copied': copiedKey === 's:' + row.kind + row.name }" @click="copy(row.whisper, 's:' + row.kind + row.name)">
                <v-icon size="16">{{ copiedKey === 's:' + row.kind + row.name ? 'mdi-check' : 'mdi-content-copy' }}</v-icon>
                {{ copiedKey === 's:' + row.kind + row.name ? 'Copied whisper' : 'Copy buy whisper' }}
              </button>
            </div>
          </div>

          <div v-if="sourceFiltered.length > perPage" class="an-pager">
            <v-pagination v-model="page" :length="sourcePageCount" :total-visible="isMobile ? 5 : 9" color="#d4af5a"></v-pagination>
          </div>
        </template>
      </div>

      <v-alert class="an-disclaimer" color="blue-darken-4" type="info" density="compact">
        <template v-if="direction === 'flip'">
          Plat / 1k endo = <b>(maxed sell − buy-in) ÷ endo to finish × 1000</b>.
          By default it shows well-traded mods (≥50 maxed sales in 48h), valued at
          the <b>48h average</b> price and bought in via a competitive buy order —
          the most reliable read. Switch the pricing model or lower the volume
          filter under Filters &amp; settings for current-ask, instant, or thinner
          mods. Warframe takes no platinum trade tax; your cost is endo + credits.
          {{ t('disclaimer') }}
        </template>
        <template v-else>
          Endo / plat = endo gained ÷ platinum paid. Sculptures use fully-starred
          endo (always star before dissolving). Mods assume you buy a maxed copy
          at its current lowest sell and dissolve it (~75% of the fusion endo
          back). {{ t('disclaimer') }}
        </template>
      </v-alert>

      <!-- Donations -->
      <div class="px-0 pt-3">
        <div class="d-flex flex-wrap align-center top_container justify-space-between mb-md-4">
          <div class="my-3 mb-0 md-md-3 bg-grey-darken-3 pa-3 px-lg-5 text-subtitle-1 d-flex align-center flex-wrap donation_container">
            <div class="d-flex mt-2 align-center">
              <div class="text-white mr-3">Help us donating!</div>
              <a target="_blank" aria-label="Donar con Paypal" class="text-white d-flex mr-4 align-center justify-content-left donation_logo" href="https://ko-fi.com/cambio_uruguay">
                <picture>
                  <source srcset="/img/paypal_icon.webp" type="image/webp" />
                  <img src="/img/paypal_icon.png" alt="PayPal" width="50" height="50" class="donation_icon" />
                </picture>
              </a>
              <a aria-label="Donar con Mercado Pago" class="text-white d-flex align-center justify-content-left donation_logo" target="_blank" href="https://mpago.la/19j46vX">
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
  fmtPlat,
  fmtEndo,
  fmtEndoK,
  fmtNum,
  type EndoFlipRow,
  type EndoSourceRow,
  type FlipEval,
  type SellBasis,
} from '~/composables/useEndoValue'

dayjs.extend(relativeTime)

const config = useRuntimeConfig()
const apiBase = config.public.apiURL
const { t } = useI18n()

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

const flipSortOptions = [
  { text: 'Plat / 1k endo', value: 'eff' },
  { text: 'Maxed profit (plat)', value: 'profit' },
  { text: 'Endo to finish', value: 'endo' },
  { text: 'Buy-in price', value: 'buyat' },
  { text: 'Maxed sell price', value: 'sell' },
  { text: 'Maxed volume', value: 'volume' },
  { text: 'Name', value: 'name' },
]
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
  search.value = ''
  minVolume.value = 50
  maxBuyIn.value = null
  minProfit.value = null
  minEff.value = null
  maxEndoFinish.value = null
  rarityFilter.value = []
  partialOnly.value = false
  flipCat.value = 'All'
}

const flipFiltered = computed<FlipRowEval[]>(() => {
  const q = (search.value || '').trim().toLowerCase()
  const minV = Number(minVolume.value) || 0
  const raritySet = new Set(rarityFilter.value.map((x) => x.toLowerCase()))
  const list = flipRows.value.filter((r) => {
    const b = r.eval.best
    if (q && !r.item_name.toLowerCase().includes(q)) return false
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
const sourceSortOptions = [
  { text: 'Endo / plat', value: 'rate' },
  { text: 'Endo amount', value: 'endo' },
  { text: 'Cost', value: 'cost' },
  { text: 'Volume', value: 'volume' },
  { text: 'Name', value: 'name' },
]
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
      whisper: buyWhisper(el.item_name, plat),
      endo,
      plat,
      endoPerPlat: endoPerPlat(endo, plat),
      volume: Number(el.market?.volume) || 0,
      liquidity: 1,
      sub: 'fully starred',
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
      whisper: buyWhisper(name + ' (riven)', plat),
      endo,
      plat,
      endoPerPlat: Number(it.endoPerPlat) || endoPerPlat(endo, plat),
      liquidity: 1,
      sub: `${it.item?.re_rolls ?? 0} rerolls`,
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

// ---- helpers ----
function rankLabel(rank: number): string {
  return rank <= 0 ? 'Unranked' : `Rank ${rank}`
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
