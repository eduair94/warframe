<template>
  <div>
    <v-tooltip top>
      <template #activator="{ on, attrs }">
        <v-btn
          color="primary"
          v-bind="attrs"
          :loading="loadingDistances"
          v-on="on"
          @click="geoLocation"
        >
          <v-icon class="mr-1">mdi-map-marker</v-icon>
          <span>{{ $t('loadDistances') }}</span>
        </v-btn>
      </template>
      <span>{{ $t('locationTooltip') }}</span>
    </v-tooltip>
    <v-dialog v-model="dialog" persistent fullscreen width="700px" hide-overlay>
      <v-card>
        <v-toolbar dark color="primary">
          <v-toolbar-title>{{ $t('confirmarUbicacion') }}</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon dark @click="dialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>
        <v-card-text v-if="latitude">
          <div class="adress_lookup mt-3 d-flex">
            <input
              id="search"
              ref="search"
              v-model="search"
              :placeholder="$t('direccion')"
              type="text"
              @keyup.enter="onEnter(search)"
            />
            <v-btn
              class="adress_lookup_btn"
              color="primary"
              @click="onEnter(search)"
            >
              Search
            </v-btn>
          </div>
          <div class="location_map">
            <client-only>
              <l-map
                ref="map"
                :zoom="13"
                :center="[latitude, longitude]"
                @click="changeMarker"
              >
                <l-tile-layer
                  url="http://{s}.tile.osm.org/{z}/{x}/{y}.png"
                ></l-tile-layer>
                <l-circle
                  v-if="radius"
                  :lat-lng="[latitude, longitude]"
                  :radius="radius * 1000"
                ></l-circle>
                <l-marker :lat-lng="[latitude, longitude]"></l-marker>
              </l-map>
            </client-only>
          </div>
          <v-text-field
            v-model="radius"
            type="number"
            class="mt-2 search_range"
            :label="$t('search_radius')"
            clearable
            hide-details
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="reset">Reset</v-btn>
          <v-btn color="red" @click="dialog = false">{{ $t('cerrar') }}</v-btn>
          <v-btn color="green darken-3" @click="confirmGeo">{{
            $t('confirmar')
          }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
export default {
  data() {
    return {
      radius: '',
      loadingDistances: false,
      prevResult: '',
      dialog: false,
      latitude: 0,
      search: '',
      longitude: 0,
      apiKey: 'XFXIuNUKjvNkruE6DSkR',
    }
  },
  watch: {
    dialog(val) {
      if (val) {
        this.setMap()
      }
    },
  },
  methods: {
    async onEnter(value) {
      startLoading()
      const data = await this.$axios
        .post('https://cambio.shellix.cc/geocoding', { address: value })
        .then((res) => res.data)
        .catch((e) => console.log(e))
      if (data && data.length) {
        this.latitude = parseFloat(data[0].lat)
        this.longitude = parseFloat(data[0].lon)
        stopLoading()
        return true
      }
      stopLoading()
      return false
    },
    searchAddress() {
      const geocoder = new maptiler.Geocoder({
        input: 'search',
        key: this.apiKey,
      })
      geocoder.setLanguage(this.$i18n.locale)
      geocoder.setProximity([this.longitude, this.latitude])
      geocoder.on('select', async (item) => {
        this.$nextTick(() => {
          this.$refs.search.value = this.search
          this.latitude = item.center[1]
          this.longitude = item.center[0]
        })
      })
    },
    setMap() {
      const apiKey = this.apiKey
      if (!this.$refs.map) return setTimeout(this.setMap, 1000)
      this.$L
        .tileLayer(
          `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${apiKey}`,
          {
            tileSize: 512,
            zoomOffset: -1,
            minZoom: 1,
            attribution:
              '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a>, ' +
              '<a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>',
            crossOrigin: true,
          }
        )
        .addTo(this.$refs.map.mapObject)
      this.searchAddress()
    },
    changeMarker(e) {
      this.latitude = e.latlng.lat
      this.longitude = e.latlng.lng
      this.reverseGeo()
    },
    async reverseGeo() {
      const url = `https://cambio.shellix.cc/position_stack?query=${this.latitude},${this.longitude}&limit=1`
      const res = await this.$axios
        .get(url)
        .then((res) => res.data)
        .catch(() => null)
      if (res) {
        const data = res.data
        if (data.length) {
          this.search = data[0].label
        }
      }
    },
    async geoLocationSuccess(info) {
      const latitude = info.coords.latitude
      const longitude = info.coords.longitude
      this.latitude = latitude
      this.longitude = longitude
      this.dialog = true
      this.loadingDistances = false
      await this.reverseGeo()
      this.setMap()
    },
    async confirmGeo() {
      const distances = await this.$axios
        .get(
          `https://cambio.shellix.cc/distances?latitude=${this.latitude}&longitude=${this.longitude}`
        )
        .then((res) => res.data)
      const distanceData = distances.distanceData
      this.$emit(
        'geoLocationSuccess',
        distances,
        this.latitude,
        this.longitude,
        distanceData,
        this.radius * 1000
      )
      this.dialog = false
    },
    geoLocationError() {
      this.loadingDistances = false
      this.latitude = -34.88073035118606
      this.longitude = -56.167630709298805
      this.search =
        '2532 Boulevard General Jose Gervasio Artigas, Montevideo, Uruguay'
      this.setMap()
    },
    reset() {
      this.search = ''
      navigator.geolocation.getCurrentPosition(
        this.geoLocationSuccess,
        this.geoLocationError
      )
    },
    geoLocation() {
      if (!this.latitude) {
        this.loadingDistances = true
        navigator.geolocation.getCurrentPosition(
          this.geoLocationSuccess,
          this.geoLocationError
        )
      } else {
        this.dialog = true
        this.loadingDistances = false
        this.setMap()
      }
      this.dialog = true
    },
  },
}
</script>

<style>
#search {
  width: 100%;
  color: white;
  background: black;
  padding: 10px;
  margin-bottom: 12px;
  border: 1px solid white;
  font-size: 16px;
}
.location_map {
  height: calc(100vh - 270px);
}
.adress_lookup .v-input {
  max-width: 600px;
}
.adress_lookup_btn {
  height: 44px !important;
}
.search_range {
  max-width: 300px;
}
@media (max-width: 768px) {
  .location_map {
    height: 63vh;
  }
}
</style>