<template>
  <v-dialog
    v-model="dialog"
    :fullscreen="$vuetify.breakpoint.mobile"
    width="1500px"
  >
    <template #activator="{ on, attrs }">
      <a
        class="white--text"
        :href="maps"
        target="_blank"
        v-bind="attrs"
        @click.prevent="get_data"
        v-on="on"
        >{{ $t('buscarSucursal') }}</a
      >
    </template>
    <v-card>
      <v-toolbar dark color="primary">
        <v-toolbar-title>
          <div class="d-flex align-center">
            <span class="mr-4">Sucursales{{ getLocation() }}</span>
            <v-btn
              v-if="!$vuetify.breakpoint.mobile"
              color="blue darken-4"
              link
              target="_blank"
              :href="maps"
              >GOOGLE MAPS</v-btn
            >
          </div>
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon dark @click="dialog = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>
      <v-btn
        v-if="$vuetify.breakpoint.mobile"
        class="w-100 mt-0 elevation-0"
        tile
        color="blue darken-4"
        link
        target="_blank"
        :href="maps"
        >GOOGLE MAPS</v-btn
      >
      <div v-if="!loaded" class="px-4 pt-3 text-h5">
        {{ $t('cargando') }}...
      </div>
      <div v-else-if="message">
        <p class="ma-0 pa-3 text-h5">
          {{ message }}
        </p>
      </div>
      <div v-else>
        <v-data-table
          :sort-by.sync="sortBy"
          :sort-desc.sync="sortDesc"
          mobile-breakpoint="1100"
          :headers="getHeaders()"
          :items="d"
          :footer-props="{
            'items-per-page-options': [10, 20, 30, 40, 50],
          }"
          :items-per-page="10"
          class="elevation-0 search_exchange"
        >
          <template #item.Direccion="{ item }">
            <a target="_blank" class="white--text" :href="getHref(item)">
              {{ item.Direccion }}
            </a>
          </template>
          <template #item.CorreoElectronico="{ item }">
            <a
              v-if="item.CorreoElectronico"
              class="white--text"
              :href="'mailto:' + item.CorreoElectronico"
            >
              {{ item.CorreoElectronico }}
            </a>
          </template>
          <template #item.Telefono="{ item }">
            <span v-if="item.Telefono">
              <a
                v-for="(x, index) in getPhones(item.Telefono)"
                :key="index"
                class="white--text"
                :href="'tel:' + x.phone"
              >
                <span>{{ x.phone }}</span>
                <span v-if="x.int">int. {{ x.int }}</span>
              </a>
            </span>
          </template>
          <template #item.distance="{ item }">
            <a class="white--text" :href="getMaps(item)" target="_blank">
              {{ formatDistance(item.distance) }}</a
            >
          </template>
        </v-data-table>
      </div>
      <v-card-actions>
        <v-spacer></v-spacer>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { notFound } from '../services/not_found'
export default {
  props: {
    type: {
      type: String,
      required: true,
    },
    maps: {
      type: String,
      required: true,
    },
    origin: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    latitude: {
      type: Number,
      required: false,
      default: 0,
    },
    longitude: {
      type: Number,
      required: false,
      default: 0,
    },
    localData: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      message: '',
      sortBy: undefined,
      sortDesc: undefined,
      dialog: false,
      loaded: false,
      d: null,
    }
  },
  methods: {
    getMaps(item: any) {
      if (item.map) return item.map
      const latitude = item.latitude
      const longitude = item.longitude
      if (!notFound.includes(origin)) {
        return `https://www.google.com.uy/maps/search/${encodeURI(
          this.localData.name
        )}/@${latitude},${longitude},18.77z`
      } else {
        return `https://www.google.com.uy/maps/search/${latitude},${longitude}`
      }
    },
    formatDistance(item: number) {
      if (!item || item === 9999999) return '-'
      if (item >= 1000) {
        return Math.round(item / 1000.0) + ' km'
      } else if (item >= 100) {
        return Math.round(item) + ' m'
      } else {
        return item.toFixed(1) + ' m'
      }
    },
    capitalize(str: string) {
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
    },
    getLocation() {
      return this.location !== 'TODOS'
        ? ' de ' + this.capitalize(this.location)
        : ''
    },
    getInt(phones: string) {
      return phones.split(/y|-/g).map((el) => el.trim().split('int.')[1])
    },
    getPhones(phones: string) {
      return phones.split(/y|-/g).map((el) => {
        const arrEl = el.trim().split('int.')
        return {
          phone: arrEl[0],
          int: arrEl[1],
        }
      })
    },
    getHref(item: any) {
      if (item.map) {
        return item.map
      }
      // Fix BUG Cambial in BCU.
      if (this.origin === 'cambial') {
        return (
          'https://www.google.com.uy/maps/search/' +
          encodeURI(item.Direccion.trim())
        )
      }
      if (!item.Direccion) item.Direccion = ''
      if (!item.Localidad) item.Localidad = ''
      if (!item.Departamento) item.Departamento = ''
      const loc =
        item.Direccion.trim() +
        ', ' +
        item.Localidad.trim() +
        ', ' +
        item.Departamento.trim()
      return 'https://www.google.com.uy/maps/search/' + encodeURI(loc)
    },
    getHeaders() {
      const toReturn = [
        {
          text: this.$t('codigo'),
          value: 'NroSucursal',
          width: '30px',
          sortable: false,
        },
        {
          text: this.$t('nombre'),
          align: 'start',
          sortable: false,
          width: 'auto',
          value: 'Nombre',
        },
        { text: this.$t('departamento'), value: 'Departamento' },
        { text: this.$t('localidad'), value: 'Localidad' },
        { text: this.$t('direccion'), value: 'Direccion' },
        { text: this.$t('telefono'), value: 'Telefono' },
        { text: this.$t('email'), value: 'CorreoElectronico', sortable: false },
        { text: this.$t('horarios'), value: 'Horarios', sortable: false },
        {
          text: this.$t('observaciones'),
          value: 'Observaciones',
          width: 'auto',
        },
      ]
      if (this.latitude && this.longitude) {
        toReturn.push({
          text: this.$t('distancia'),
          value: 'distance',
          width: 'auto',
        })
      }
      return toReturn
    },
    async get_data() {
      this.loaded = false
      this.message = ''
      if (this.origin === 'prex') {
        const loc = {
          es: 'Se requiere la tarjeta prex y realizar el trámite por la aplicación',
          en: 'A prex card is required and the application must be completed.',
          pt: 'O cartão prex é necessário e o requerimento deve ser preenchido através do requerimento.',
        }
        this.message = loc[this.$i18n.locale]
      } else if (this.type === 'EBROU') {
        const loc = {
          es: 'Se requiere una cuenta de EBROU, una caja de ahorro en dólares y realizar el cambio por la aplicación',
          en: 'It requires an EBROU account, a savings account in US dollars and exchange through the application.',
          pt: 'É necessária uma conta EBROU, uma conta poupança em dólares e troca através da aplicação.',
        }
        this.message = loc[this.$i18n.locale]
      } else {
        let url =
          'https://cambio.shellix.cc/exchanges/' +
          this.origin +
          '/' +
          this.location
        if (this.latitude && this.longitude) {
          url += `?latitude=${this.latitude}&longitude=${this.longitude}`
          this.sortBy = 'distance'
          this.sortDesc = false
        }
        this.d = await this.$axios.get(url).then((res) => res.data)
      }
      this.loaded = true
    },
  },
}
</script>