<script setup lang="ts">
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { onMounted, ref, watch } from 'vue'
import type { EstoqueHemocentro } from '../api/estoque'
import { ROTULOS_NIVEL } from '../domain/nivel'
import type { TipoSanguineo } from '../domain/tipos'

const props = defineProps<{ hemocentros: EstoqueHemocentro[]; tipo: TipoSanguineo }>()

const COR_POR_NIVEL = { critico: '#b3261e', alerta: '#e8a33d', estavel: '#4f8fd6', adequado: '#2e7d4f' }

const elemento = ref<HTMLElement>()
let marcadores: L.LayerGroup | undefined

function desenhar() {
  marcadores?.clearLayers()
  for (const hemocentro of props.hemocentros) {
    const nivel = hemocentro.estoque[props.tipo]
    if (hemocentro.latitude === null || hemocentro.longitude === null) continue
    L.circleMarker([hemocentro.latitude, hemocentro.longitude], {
      radius: 10,
      color: '#1f1f1f',
      weight: 1,
      fillColor: nivel ? COR_POR_NIVEL[nivel] : '#9e9e9e',
      fillOpacity: 0.9,
    })
      .bindPopup(`<strong>${hemocentro.nome}</strong><br>${props.tipo}: ${nivel ? ROTULOS_NIVEL[nivel] : 'sem dado'}`)
      .addTo(marcadores!)
  }
}

onMounted(() => {
  const mapa = L.map(elemento.value!).setView([-14.5, -52], 4)
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 12,
    attribution: '&copy; colaboradores do OpenStreetMap',
  }).addTo(mapa)
  marcadores = L.layerGroup().addTo(mapa)
  desenhar()
})

watch(() => [props.hemocentros, props.tipo], desenhar)
</script>

<template>
  <div ref="elemento" class="mapa" role="img" :aria-label="`Mapa do estoque de ${tipo} nos hemocentros`"></div>
</template>

<style scoped>
.mapa {
  height: 360px;
  border-radius: 8px;
}
</style>
