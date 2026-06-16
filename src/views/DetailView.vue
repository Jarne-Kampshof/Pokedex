<script setup>
import { useRoute } from 'vue-router'
import { onMounted, ref } from 'vue'

const route = useRoute()
const code = route.params.name

const pokemon = ref(null)
const isLoading = ref(true)
const fout = ref(null)

onMounted(async () => {
    try {
        const response = await fetch(
            `https://pokeapi.co/api/v2/pokemon/${code}`
        )

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
        }

        const result = await response.json()

        pokemon.value = Array.isArray(result)
            ? result[0]
            : result

    } catch (error) {
        fout.value = 'Er ging iets mis.'
        console.error(error)
    } finally {
        isLoading.value = false
    }
})

</script>

<template>
   <h1 v-if="pokemon">{{ pokemon.name }}</h1>
</template>