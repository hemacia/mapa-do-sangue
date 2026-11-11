<script setup lang="ts">
import { ref } from 'vue'
import { dataLocal, parseData } from '../domain/datas'
import { avaliarCandidato, type ResultadoAvaliacao, type Sexo } from '../domain/elegibilidade'

const props = defineProps<{ hoje?: Date }>()

const nascimento = ref('')
const sexo = ref<Sexo>('feminino')
const peso = ref('')
const ultimaDoacao = ref('')
const resultado = ref<ResultadoAvaliacao | null>(null)
const erro = ref('')

function verificar() {
  erro.value = ''
  resultado.value = null
  try {
    resultado.value = avaliarCandidato(
      {
        nascimento: parseData(nascimento.value),
        sexo: sexo.value,
        pesoKg: Number(peso.value),
        doacoes: ultimaDoacao.value ? [parseData(ultimaDoacao.value)] : [],
      },
      props.hoje ?? dataLocal(new Date()),
    )
  } catch {
    erro.value = 'Confira a data de nascimento, o peso e a data da última doação'
  }
}
</script>

<template>
  <section aria-labelledby="titulo-posso-doar">
    <h2 id="titulo-posso-doar">Posso doar?</h2>
    <form novalidate @submit.prevent="verificar">
      <label>
        Data de nascimento
        <input v-model="nascimento" name="nascimento" type="date" required />
      </label>
      <label>
        Sexo
        <select v-model="sexo" name="sexo">
          <option value="feminino">Feminino</option>
          <option value="masculino">Masculino</option>
        </select>
      </label>
      <label>
        Peso (kg)
        <input v-model="peso" name="peso" type="number" min="1" step="0.1" required />
      </label>
      <label>
        Data da última doação (deixe vazio se nunca doou)
        <input v-model="ultimaDoacao" name="ultima-doacao" type="date" />
      </label>
      <button type="submit">Verificar</button>
    </form>

    <p v-if="erro" role="alert">{{ erro }}</p>
    <div v-if="resultado" role="status">
      <p>
        <strong>{{ resultado.podeDoarHoje ? 'Você pode doar hoje' : 'Hoje você ainda não pode doar' }}</strong>
      </p>
      <ul v-if="resultado.mensagens.length">
        <li v-for="mensagem in resultado.mensagens" :key="mensagem">{{ mensagem }}</li>
      </ul>
      <p class="aviso">Resultado indicativo. A triagem no hemocentro é quem confirma.</p>
    </div>
  </section>
</template>
