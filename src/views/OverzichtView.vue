<script setup>
import { onMounted, ref, computed } from 'vue';

const data = ref([])
const isLoading = ref(true)
const fout = ref(null)
const drawer = ref(false)
const selectedPokemon = ref(null)
const page = ref(1)
const perPage = 10
const zoekterm = ref('')
const actiefTabblad = ref('pokedex')

const favorieten = ref(JSON.parse(localStorage.getItem('pokedex-favorieten') || '[]'))

const slaFavorietenOp = () => {
  localStorage.setItem('pokedex-favorieten', JSON.stringify(favorieten.value))
}

const isFavoriet = (naam) => favorieten.value.includes(naam)

const toggleFavoriet = (pokemon, event) => {
  event?.stopPropagation()
  if (isFavoriet(pokemon.name)) {
    favorieten.value = favorieten.value.filter(n => n !== pokemon.name)
  } else {
    favorieten.value.push(pokemon.name)
  }
  slaFavorietenOp()
}

onMounted(async () => {
  try {
    const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=100000')
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const result = await response.json()
    data.value = result.results
  } catch (error) {
    fout.value = 'Er ging iets mis.'
    console.error(error)
  } finally {
    isLoading.value = false
  }
})

const getId = (url) => url.split('/').filter(Boolean).pop()

const openDrawer = (pokemon) => {
  selectedPokemon.value = pokemon
  drawer.value = true
}

const gefilterdeData = computed(() => {
  if (!zoekterm.value) return data.value
  return data.value.filter(p => p.name.includes(zoekterm.value.toLowerCase()))
})

const pagedData = computed(() => {
  const start = (page.value - 1) * perPage
  return gefilterdeData.value.slice(start, start + perPage)
})

const totaalPaginas = computed(() => Math.ceil(gefilterdeData.value.length / perPage))

const onZoek = () => { page.value = 1 }

const favorietPokemon = computed(() => {
  return data.value.filter(p => favorieten.value.includes(p.name))
})
</script>

<template>
  <v-app>
    <v-app-bar color="blue-darken-2" elevation="2">
      <v-app-bar-title class="navbar-title">Pokédex</v-app-bar-title>

    </v-app-bar>

    <v-navigation-drawer v-model="drawer" location="bottom" temporary height="400" style="border-radius: 16px 16px 0 0;">
      <div class="drawer-header">
        <img
          v-if="selectedPokemon"
          :src="`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${getId(selectedPokemon.url)}.png`"
          class="drawer-sprite"
        >
        <div>
          <p class="drawer-naam">{{ selectedPokemon?.name }}</p>
          <p class="drawer-id">#{{ selectedPokemon ? getId(selectedPokemon.url).padStart(4, '0') : '' }}</p>
        </div>
        <v-btn icon="mdi-close" variant="text" color="white" class="drawer-close" @click="drawer = false"></v-btn>
      </div>

      <div class="drawer-body">
        <p><strong>Naam:</strong> {{ selectedPokemon?.name }}</p>
        <p><strong>ID:</strong> {{ selectedPokemon ? getId(selectedPokemon.url) : '' }}</p>
      </div>
    </v-navigation-drawer>

    <v-main class="main-bg">
      <v-container class="container">

        <v-tabs v-model="actiefTabblad" color="blue-darken-2" grow class="mb-3">
          <v-tab value="pokedex">
            <v-icon start>mdi-pokeball</v-icon>
            Pokédex
          </v-tab>
          <v-tab value="favorieten">
            <v-icon start>mdi-star</v-icon>
            Favorieten
          </v-tab>
        </v-tabs>

        <v-window v-model="actiefTabblad">
          <v-window-item value="pokedex">
            <v-text-field
              v-model="zoekterm"
              placeholder="Zoek Pokémon..."
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              hide-details
              bg-color="white"
              class="zoekbalk"
              @update:model-value="onZoek"
            ></v-text-field>

            <div v-if="isLoading" class="loading">
              <v-progress-circular indeterminate color="blue"></v-progress-circular>
              <p>Pokémon laden...</p>
            </div>
            <div v-else-if="fout" class="fout">{{ fout }}</div>

            <div v-else>
              <p v-if="gefilterdeData.length === 0" class="geen-resultaten">
                Geen Pokémon gevonden voor "{{ zoekterm }}"
              </p>

              <div
                v-for="pokemon in pagedData"
                :key="pokemon.name"
                class="pokemon-card"
                @click="openDrawer(pokemon)"
              >
                <img
                  :src="`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${getId(pokemon.url)}.png`"
                  class="pokemon-sprite"
                >
                <span class="pokemon-naam">{{ pokemon.name }}</span>
                <span class="pokemon-id">#{{ getId(pokemon.url).padStart(4, '0') }}</span>
                <v-icon
                  class="ster-icon"
                  :color="isFavoriet(pokemon.name) ? 'yellow-darken-2' : ''"
                  @click="toggleFavoriet(pokemon, $event)"
                >
                  {{ isFavoriet(pokemon.name) ? 'mdi-star' : 'mdi-star-outline' }}
                </v-icon>
              </div>

              <div class="paginering" >
                <v-btn :disabled="page === 1" @click="page--" icon="mdi-chevron-left" color="blue" variant="outlined" size="small"></v-btn>
                <span class="pagina-tekst">Pagina {{ page }} / {{ totaalPaginas }}</span>
                <v-btn :disabled="page >= totaalPaginas" @click="page++" icon="mdi-chevron-right" color="blue" variant="outlined" size="small"></v-btn>
              </div>
            </div>
          </v-window-item>

          <v-window-item value="favorieten">
            <div v-if="favorietPokemon.length === 0" class="leeg-favorieten">
              <v-icon size="64" color="grey-lighten-1">mdi-star-outline</v-icon>
              <p class="leeg-tekst">Nog geen favorieten</p>
              <p class="leeg-subtekst">Tik op ★ bij een Pokémon om hem hier toe te voegen.</p>
            </div>

            <div v-else>
              <div
                v-for="pokemon in favorietPokemon"
                :key="pokemon.name"
                class="pokemon-card"
                @click="openDrawer(pokemon)"
              >
                <img
                  :src="`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${getId(pokemon.url)}.png`"
                  class="pokemon-sprite"
                >
                <span class="pokemon-naam">{{ pokemon.name }}</span>
                <span class="pokemon-id">#{{ getId(pokemon.url).padStart(4, '0') }}</span>
                <v-icon
                  class="ster-icon"
                  color="yellow-darken-2"
                  @click="toggleFavoriet(pokemon, $event)"
                >
                  mdi-star
                </v-icon>
              </div>
            </div>
          </v-window-item>
        </v-window>

      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>
.navbar-title {
  color: #FFD700;
  font-weight: bold;
}

.main-bg {
  background: #EEF4FF;
}

.container {
  max-width: 480px;
}

.zoekbalk {
  margin: 12px 0;
}

.loading {
  text-align: center;
  margin-top: 40px;
}

.fout {
  color: red;
  text-align: center;
}

.geen-resultaten {
  text-align: center;
  color: #888;
  margin-top: 24px;
}

.pokemon-card {
  display: flex;
  align-items: center;
  background: white;
  border-radius: 10px;
  padding: 10px 14px;
  margin-bottom: 10px;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.pokemon-sprite {
  width: 56px;
  height: 56px;
}

.pokemon-naam {
  margin-left: 12px;
  font-weight: 600;
  text-transform: capitalize;
  flex: 1;
}

.pokemon-id {
  color: #aaa;
  font-size: 13px;
}

.ster-icon {
  margin-left: 8px;
  color: #ccc;
}

.drawer-header {
  display: flex;
  align-items: center;
  background: #1565C0;
  padding: 12px 16px;
  border-radius: 16px 16px 0 0;
  position: relative;
}

.drawer-sprite {
  width: 70px;
  height: 70px;
}

.drawer-naam {
  color: #FFD700;
  font-weight: bold;
  font-size: 20px;
  text-transform: capitalize;
  margin: 0 0 4px 12px;
}

.drawer-id {
  color: white;
  font-size: 13px;
  margin: 0 0 0 12px;
}

.drawer-close {
  position: absolute;
  right: 8px;
  top: 8px;
}

.drawer-body {
  padding: 16px;
}

.paginering {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin: 16px 0;
}

.pagina-tekst {
  font-size: 14px;
  color: #555;
}

.leeg-favorieten {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 60px;
  gap: 8px;
}

.leeg-tekst {
  font-size: 18px;
  font-weight: 600;
  color: #888;
  margin: 0;
}

.leeg-subtekst {
  font-size: 14px;
  color: #aaa;
  text-align: center;
  margin: 0;
}

</style>