<script setup lang="ts">
import Compatibilidade from './components/Compatibilidade.vue'
import PossoDoar from './components/PossoDoar.vue'
</script>

<template>
  <header>
    <h1>Mapa do Sangue</h1>
    <p>Estoque de sangue dos hemocentros do Brasil e tudo o que você precisa para doar.</p>
  </header>
  <main>
    <PossoDoar />
    <Compatibilidade />
  </main>
</template>
