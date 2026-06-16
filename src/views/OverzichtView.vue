<script setup>
import { onMounted, ref } from 'vue';

const data = ref([])
const isLoading = ref(true)
const fout = ref(null)

   onMounted(async () => {
    try {
        const response = await fetch(
            'https://pokeapi.co/api/v2/pokemon'
        )

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
        }

        const result = await response.json()
        data.value = result.results

    } catch (error) {
        fout.value = 'Er ging iets mis.'
        console.error(error)
    } finally {
        isLoading.value = false
    }
})

const getId = (url) => {
  return url.split('/').filter(Boolean).pop()
}

const drawer = ref(false)
</script>

<template>
  <v-app>
    <v-app-bar color="primary" elevation="4">
      <v-app-bar-nav-icon @click="drawer"/>
      <v-app-bar-title>Pokedex</v-app-bar-title>
    </v-app-bar>

    <!-- <v-navigation-drawer v-model="drawer" temporary>
      <v-list>
        <v-list-item prepend-icon="mdi-home" title="Home" to="/" />
        <v-list-item prepend-icon="mdi-chat" title="Chat" to="/chat" />
        <v-list-item prepend-icon="mdi-account" title="Account" to="/account" />
      </v-list>
    </v-navigation-drawer> -->

    <v-main>    
      <v-container>

        <div v-if="isLoading">Laden...</div>
        <div v-else-if="fout">{{ fout }}</div>

        <div v-else>
          <div v-for="pokemon in data" :key="pokemon.name">
            <RouterLink :to="`/pokemon/${pokemon.name}`">
              <img :src="`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${getId(pokemon.url)}.png`" alt="">
              <br>{{ pokemon.name }}
            </RouterLink>
          </div>
        </div>
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>

</style>