<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { buscarEstoque } from '../api/cliente'
import type { EstoqueHemocentro } from '../api/estoque'
import { ROTULOS_NIVEL } from '../domain/nivel'
import { TIPOS_SANGUINEOS, type TipoSanguineo } from '../domain/tipos'
import MapaEstoque from './MapaEstoque.vue'

const props = withDefaults(defineProps<{ carregar?: () => Promise<EstoqueHemocentro[]> }>(), {
  carregar: () => buscarEstoque(),
})

const hemocentros = ref<EstoqueHemocentro[]>([])
const tipo = ref<TipoSanguineo>('O-')
const erro = ref('')

function rotulo(hemocentro: EstoqueHemocentro): string {
  const nivel = hemocentro.estoque[tipo.value]
  return nivel ? ROTULOS_NIVEL[nivel] : 'Sem dado'
}

const criticos = computed(() => hemocentros.value.filter((h) => h.estoque[tipo.value] === 'critico').length)

onMounted(async () => {
  try {
    hemocentros.value = await props.carregar()
  } catch (falha) {
    erro.value = falha instanceof Error ? falha.message : 'Erro ao carregar o estoque'
  }
})
</script>

<template>
  <section aria-labelledby="titulo-estoque">
    <h2 id="titulo-estoque">Estoque nos hemocentros</h2>
    <p v-if="erro" role="alert">{{ erro }}</p>
    <template v-else>
      <label>
        Tipo sanguíneo no mapa
        <select v-model="tipo" name="tipo-estoque">
          <option v-for="opcao in TIPOS_SANGUINEOS" :key="opcao" :value="opcao">{{ opcao }}</option>
        </select>
      </label>
      <p data-testid="resumo">{{ tipo }} está crítico em {{ criticos }} de {{ hemocentros.length }} hemocentros</p>
      <MapaEstoque :hemocentros="hemocentros" :tipo="tipo" />
      <table>
        <caption>Nível de {{ tipo }} por hemocentro</caption>
        <thead>
          <tr>
            <th scope="col">Hemocentro</th>
            <th scope="col">Local</th>
            <th scope="col">Nível</th>
            <th scope="col">Atualizado na fonte</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="hemocentro in hemocentros" :key="hemocentro.id">
            <th scope="row">{{ hemocentro.nome }}</th>
            <td>{{ hemocentro.cidade }} ({{ hemocentro.uf }})</td>
            <td>
              <span :class="['nivel', hemocentro.estoque[tipo] ?? 'sem-dado']">
                {{ rotulo(hemocentro) }}
              </span>
            </td>
            <td>{{ hemocentro.atualizadoNaFonte ?? 'Não informado' }}</td>
          </tr>
        </tbody>
      </table>
    </template>
  </section>
</template>

<style scoped>
.nivel {
  padding: 2px 8px;
  border-radius: 999px;
  font-weight: 600;
}
.critico { background: #f9dedc; color: #8c1d18; }
.alerta { background: #fdebc8; color: #6b4a00; }
.estavel { background: #dce9f7; color: #1b4a7a; }
.adequado { background: #d7efe0; color: #1d5233; }
.sem-dado { background: #eee; color: #444; }
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 12px;
}
th, td {
  text-align: left;
  padding: 6px 4px;
  border-bottom: 1px solid #ddd;
}
</style>
