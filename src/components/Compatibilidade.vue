<script setup lang="ts">
import { computed, ref } from 'vue'
import { doadoresDeHemacias, receptoresDeHemacias } from '../domain/compatibilidade'
import { TIPOS_SANGUINEOS, type TipoSanguineo } from '../domain/tipos'

const tipo = ref<TipoSanguineo>('O-')
const doaPara = computed(() => receptoresDeHemacias(tipo.value).join(', '))
const recebeDe = computed(() => doadoresDeHemacias(tipo.value).join(', '))
</script>

<template>
  <section aria-labelledby="titulo-compatibilidade">
    <h2 id="titulo-compatibilidade">Quem doa para quem</h2>
    <label>
      Seu tipo sanguíneo
      <select v-model="tipo" name="tipo">
        <option v-for="opcao in TIPOS_SANGUINEOS" :key="opcao" :value="opcao">{{ opcao }}</option>
      </select>
    </label>
    <dl>
      <dt>Pode doar hemácias para</dt>
      <dd data-testid="doa-para">{{ doaPara }}</dd>
      <dt>Pode receber hemácias de</dt>
      <dd data-testid="recebe-de">{{ recebeDe }}</dd>
    </dl>
  </section>
</template>
