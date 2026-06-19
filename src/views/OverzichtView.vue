<script setup>
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter()

const data = ref([])
const isLoading = ref(true)
const fout = ref(null)
const drawer = ref(false)
const selectedPokemon = ref(null)
const selectedDetails = ref(null)
const selectedSpecies = ref(null)
const evolutionChain = ref(null)
const detailsLoading = ref(false)
const page = ref(1)
const perPage = 10
const zoekterm = ref('')
const actiefTabblad = ref('pokedex')
const deferredPrompt = ref(null)
const canInstall = ref(false)

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

const typeKleur = (type) => {
  const kleuren = {
    fire: 'deep-orange', water: 'blue', grass: 'green', electric: 'yellow-darken-2',
    psychic: 'pink', ice: 'cyan', dragon: 'deep-purple', dark: 'brown',
    fairy: 'pink-lighten-2', normal: 'grey', fighting: 'red-darken-2', flying: 'indigo-lighten-2',
    poison: 'purple', ground: 'amber-darken-2', rock: 'grey-darken-1', bug: 'light-green',
    ghost: 'deep-purple-lighten-2', steel: 'blue-grey', shadow: 'grey-darken-4'
  }
  return kleuren[type] || 'grey'
}

const statKleur = (waarde) => {
  if (waarde >= 100) {
    return 'green'
  }

  if (waarde >= 60) {
    return 'blue'
  }

  if (waarde >= 40) {
    return 'orange'
  }

  return 'red'
}

const flattenEvolution = (chain) => {
  const resultaat = []
  const doorloop = (pokemon) => {
    resultaat.push(pokemon.species)
    if (pokemon.evolves_to?.length) pokemon.evolves_to.forEach(doorloop)
  }
  doorloop(chain)
  return resultaat
}

const laadPokemonDetails = async (id) => {
  const response = await fetch(
    `https://pokeapi.co/api/v2/pokemon/${id}`
  )

  return await response.json()
}

const laadSpecies = async (id) => {
  const response = await fetch(
    `https://pokeapi.co/api/v2/pokemon-species/${id}`
  )

  return await response.json()
}

const openDrawer = async (pokemon) => {
  const id = getId(pokemon.url)

  selectedPokemon.value = pokemon
  drawer.value = true
  detailsLoading.value = true

  try {
    selectedDetails.value = await laadPokemonDetails(id)

    selectedSpecies.value = await laadSpecies(id)

    const evoResponse = await fetch(
      selectedSpecies.value.evolution_chain.url
    )

    const evoData = await evoResponse.json()

    evolutionChain.value = flattenEvolution(evoData.chain)
  } catch (error) {
    console.error(error)
  } finally {
    detailsLoading.value = false
  }
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

const statNaam = (naam) => {
  const namen = {
    hp: 'HP', attack: 'Aanval', defense: 'Verdediging',
    'special-attack': 'Sp. Aanval', 'special-defense': 'Sp. Verdediging', speed: 'Snelheid'
  }
  return namen[naam] || naam
}

onMounted(() => {
   window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt.value = e
    canInstall.value = true
  })

  window.addEventListener('appinstalled', () => {
    canInstall.value = false
    deferredPrompt.value = null
  })
})

const installApp = async () => {
  if (!deferredPrompt.value) return

  deferredPrompt.value.prompt()

  const { outcome } = await deferredPrompt.value.userChoice

  if (outcome === 'accepted') {
    console.log('App geïnstalleerd')
  }

  deferredPrompt.value = null
  canInstall.value = false
}

const onTabbladChange = (waarde) => {
  if (waarde === 'favorieten') {
    router.push('/favorieten')
  }
}
</script>

<template>
  <v-app>
    <v-app-bar color="blue-darken-2" elevation="2">
  <v-app-bar-title class="navbar-title">Pokédex</v-app-bar-title>

  <v-spacer />

  <v-btn
    v-if="canInstall"
    color="yellow-darken-2"
    variant="elevated"
    @click="installApp"
  >
    Installeer
  </v-btn>
</v-app-bar>
    <v-navigation-drawer v-model="drawer" location="left" temporary width="360"
      style="border-radius: 16px 16px 16px 16px; overflow-y: auto; height: 550px; top: 100px;">
      <div class="drawer-header">
        <img v-if="selectedPokemon"
          :src="`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${getId(selectedPokemon.url)}.png`"
          class="drawer-sprite">
        <div>
          <p class="drawer-naam">{{ selectedPokemon?.name }}</p>
          <p class="drawer-id">#{{ selectedPokemon ? getId(selectedPokemon.url).padStart(4, '0') : '' }}</p>
          <div v-if="selectedDetails" class="type-chips">
            <v-chip v-for="t in selectedDetails.types" :key="t.type.name" :color="typeKleur(t.type.name)" size="x-small"
              class="mr-1">{{ t.type.name }}</v-chip>
          </div>
        </div>
        <v-btn icon="mdi-close" variant="text" color="white" class="drawer-close" @click="drawer = false"></v-btn>
      </div>

      <div class="drawer-body">
        <div v-if="detailsLoading" class="text-center pa-4">
          <v-progress-circular indeterminate color="blue" size="28"></v-progress-circular>
        </div>

        <template v-else-if="selectedDetails">


          <p class="sectie-titel">Abilities</p>
          <div class="ability-rij">
            <v-chip v-for="a in selectedDetails.abilities" :key="a.ability.name"
              :variant="a.is_hidden ? 'outlined' : 'tonal'" color="blue-darken-2" size="small" class="mr-1 mb-1">
              {{ a.ability.name }}
            </v-chip>
          </div>

          <v-divider class="my-3"></v-divider>

          <p class="sectie-titel">Stats</p>
          <div v-for="stat in selectedDetails.stats" :key="stat.stat.name" class="stat-rij">
            <span class="stat-naam">{{ statNaam(stat.stat.name) }}</span>
            <span class="stat-waarde">{{ stat.base_stat }}</span>
            <v-progress-linear :model-value="stat.base_stat" :max="255" :color="statKleur(stat.base_stat)" rounded
              height="6" class="stat-bar"></v-progress-linear>
          </div>

          <v-divider class="my-3"></v-divider>

          <p class="sectie-titel">Evolutieketen</p>
          <div v-if="evolutionChain" class="evo-keten">
            <template v-for="(evo, index) in evolutionChain" :key="evo.name">
              <div class="evo-item" @click="openDrawer(evo)">
                <img
                  :src="`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${getId(evo.url)}.png`"
                  class="evo-sprite">
                <span class="evo-naam">{{ evo.name }}</span>
              </div>
              <v-icon v-if="index < evolutionChain.length - 1" color="grey" size="18">mdi-chevron-right</v-icon>
            </template>
          </div>

        </template>
      </div>
    </v-navigation-drawer>

    <v-main class="main-bg">
      <v-container class="container">

        <v-tabs v-model="actiefTabblad" color="blue-darken-2" grow class="mb-3" @update:model-value="onTabbladChange">
          <v-tab value="pokedex">
            <v-icon start>mdi-pokeball</v-icon>
            Pokédex
          </v-tab>
          <v-tab value="favorieten">
            <v-icon start>mdi-star</v-icon>
            Favorieten
          </v-tab>
        </v-tabs>

        <v-text-field v-model="zoekterm" placeholder="Zoek Pokémon..." prepend-inner-icon="mdi-magnify"
          variant="outlined" density="compact" hide-details bg-color="white" class="zoekbalk"
          @update:model-value="onZoek"></v-text-field>

        <div v-if="isLoading" class="loading">
          <v-progress-circular indeterminate color="blue"></v-progress-circular>
          <p>Pokémon laden...</p>
        </div>
        <div v-else-if="fout" class="fout">{{ fout }}</div>

        <div v-else>
          <p v-if="gefilterdeData.length === 0" class="geen-resultaten">
            Geen Pokémon gevonden voor "{{ zoekterm }}"
          </p>

          <div v-for="pokemon in pagedData" :key="pokemon.name" class="pokemon-card" @click="openDrawer(pokemon)">
            <img
              :src="`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${getId(pokemon.url)}.png`"
              class="pokemon-sprite">
            <span class="pokemon-naam">{{ pokemon.name }}</span>
            <span class="pokemon-id">#{{ getId(pokemon.url).padStart(4, '0') }}</span>
            <v-icon class="ster-icon" :color="isFavoriet(pokemon.name) ? 'yellow-darken-2' : ''"
              @click="toggleFavoriet(pokemon, $event)">
              {{ isFavoriet(pokemon.name) ? 'mdi-star' : 'mdi-star-outline' }}
            </v-icon>
          </div>

          <div class="paginering">
            <v-btn :disabled="page === 1" @click="page--" icon="mdi-chevron-left" color="blue" variant="outlined"
              size="small"></v-btn>
            <span class="pagina-tekst">Pagina {{ page }} / {{ totaalPaginas }}</span>
            <v-btn :disabled="page >= totaalPaginas" @click="page++" icon="mdi-chevron-right" color="blue"
              variant="outlined" size="small"></v-btn>
          </div>
        </div>

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
  width: 80px;
  height: 80px;
  image-rendering: pixelated;
}

.drawer-naam {
  color: #FFD700;
  font-weight: bold;
  font-size: 20px;
  text-transform: capitalize;
  margin: 0 0 2px 12px;
}

.drawer-id {
  color: white;
  font-size: 13px;
  margin: 0 0 6px 12px;
}

.type-chips {
  margin-left: 12px;
}

.drawer-close {
  position: absolute;
  right: 8px;
  top: 8px;
}

.drawer-body {
  padding: 16px;
}

.info-rij {
  display: flex;
  gap: 8px;
}

.info-blok {
  flex: 1;
  background: #F0F4FF;
  border-radius: 8px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.info-label {
  font-size: 11px;
  color: #888;
  margin-bottom: 2px;
}

.info-waarde {
  font-size: 15px;
  font-weight: 600;
  color: #1565C0;
}

.sectie-titel {
  font-weight: 600;
  font-size: 13px;
  color: #555;
  margin: 0 0 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.ability-rij {
  display: flex;
  flex-wrap: wrap;
}

.stat-rij {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.stat-naam {
  font-size: 12px;
  color: #666;
  width: 90px;
  flex-shrink: 0;
}

.stat-waarde {
  font-size: 13px;
  font-weight: 600;
  width: 32px;
  text-align: right;
  flex-shrink: 0;
}

.stat-bar {
  flex: 1;
}

.evo-keten {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}

.evo-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: background 0.15s;
}

.evo-item:hover {
  background: #EEF4FF;
}

.evo-sprite {
  width: 56px;
  height: 56px;
}

.evo-naam {
  font-size: 11px;
  text-transform: capitalize;
  color: #555;
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
