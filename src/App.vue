<script setup lang="ts">
import Compatibilidade from './components/Compatibilidade.vue'
import EuDoei from './components/EuDoei.vue'
import PainelEstoque from './components/PainelEstoque.vue'
import PossoDoar from './components/PossoDoar.vue'
</script>

<template>
  <header>
    <h1>Mapa do Sangue</h1>
    <p>Estoque de sangue dos hemocentros do Brasil e tudo o que você precisa para doar.</p>
  </header>
  <main>
    <PainelEstoque />
    <PossoDoar />
    <Compatibilidade />
    <EuDoei />
  </main>
  <footer>
    <p>
      Dados coletados dos sites oficiais dos hemocentros. O nível é indicativo: confirme com o hemocentro antes de ir.
      <a href="https://github.com/hemacia/mapa-do-sangue">Código aberto no GitHub</a>
    </p>
  </footer>
</template>
