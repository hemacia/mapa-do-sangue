<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { buscarTotalDoMes, registrarDoacao } from '../api/cliente'
import { TIPOS_SANGUINEOS, type TipoSanguineo } from '../domain/tipos'
import { UFS } from '../domain/ufs'

const props = withDefaults(
  defineProps<{
    registrar?: (uf: string, tipo: TipoSanguineo | null) => Promise<void>
    totalDoMes?: () => Promise<number>
  }>(),
  {
    registrar: (uf: string, tipo: TipoSanguineo | null) => registrarDoacao(uf, tipo),
    totalDoMes: () => buscarTotalDoMes(),
  },
)

const uf = ref('')
const tipo = ref<TipoSanguineo | ''>('')
const total = ref<number | null>(null)
const mensagem = ref('')
const erro = ref('')

onMounted(async () => {
  total.value = await props.totalDoMes().catch(() => null)
})

async function enviar() {
  mensagem.value = ''
  erro.value = ''
  try {
    await props.registrar(uf.value, tipo.value || null)
    mensagem.value = 'Obrigado por doar! Sua doação entrou no contador do mês.'
    if (total.value !== null) total.value += 1
  } catch (falha) {
    erro.value = falha instanceof Error ? falha.message : 'Não foi possível registrar'
  }
}
</script>

<template>
  <section aria-labelledby="titulo-eu-doei">
    <h2 id="titulo-eu-doei">Eu doei hoje!</h2>
    <p v-if="total !== null" data-testid="total-mes">{{ total }} doações registradas pelo Mapa do Sangue este mês</p>
    <form @submit.prevent="enviar">
      <label>
        Estado
        <select v-model="uf" name="uf" required>
          <option value="" disabled>Escolha</option>
          <option v-for="opcao in UFS" :key="opcao" :value="opcao">{{ opcao }}</option>
        </select>
      </label>
      <label>
        Tipo sanguíneo (opcional)
        <select v-model="tipo" name="tipo-doador">
          <option value="">Prefiro não dizer</option>
          <option v-for="opcao in TIPOS_SANGUINEOS" :key="opcao" :value="opcao">{{ opcao }}</option>
        </select>
      </label>
      <button type="submit">Registrar minha doação</button>
    </form>
    <p class="aviso">Não guardamos nome, e-mail nem nenhum dado pessoal.</p>
    <p v-if="mensagem" role="status">{{ mensagem }}</p>
    <p v-if="erro" role="alert">{{ erro }}</p>
  </section>
</template>
