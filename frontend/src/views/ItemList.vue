<template>
  <div class="item-list">
    <div class="controls">
      <div class="search-section">
        <div class="search-box">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Sök produkter..."
            class="search-input"
            @input="handleSearch"
          >
          <button class="search-button">
            <span class="search-icon">🔍</span>
          </button>
        </div>
        
        <div class="filter-controls">
          <select v-model="selectedCategory" @change="updateCategory" class="filter-select">
            <option value="all">Alla kategorier</option>
            <option v-for="category in categories" :key="category" :value="category">
              {{ formatCategory(category) }}
            </option>
          </select>
          
          <select v-model="sortBy" @change="updateSort" class="filter-select">
            <option value="name">Namn A-Ö</option>
            <option value="-name">Namn Ö-A</option>
            <option value="price">Pris Lägst-Högst</option>
            <option value="-price">Pris Högst-Lägst</option>
            <option value="createdAt">Nyast först</option>
            <option value="-createdAt">Äldst först</option>
          </select>
          
          <label class="stock-filter">
            <input type="checkbox" v-model="showInStockOnly" @change="toggleStockFilter">
            Visa endast i lager
          </label>
        </div>
      </div>
      
      <div class="stats">
        <div class="stat-card">
          <span class="stat-label">Totalt antal:</span>
          <span class="stat-value">{{ totalItems }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Totalt värde:</span>
          <span class="stat-value">{{ formattedTotalValue }} SEK</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">I lager:</span>
          <span class="stat-value">{{ inStockCount }}</span>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Laddar produkter...</p>
    </div>
    
    <div v-else-if="error" class="error-container">
      <div class="error-icon">⚠️</div>
      <p>{{ error }}</p>
      <button @click="fetchItems" class="retry-button">
        Försök igen
      </button>
    </div>
    
    <div v-else>
      <div v-if="filteredItems.length === 0" class="empty-state">
        <div class="empty-icon">📦</div>
        <h3>Inga produkter hittades</h3>
        <p v-if="searchQuery">Inga produkter matchade din sökning "{{ searchQuery }}"</p>
        <p v-else>Det finns inga produkter i katalogen än.</p>
        <router-link to="/items/create" class="create-button">
          Skapa din första produkt
        </router-link>
      </div>
      
      <div v-else class="items-grid">
        <div 
          v-for="item in paginatedItems" 
          :key="item.id" 
          class="item-card"
          @click="viewItem(item.id)"
        >
          <div class="item-header">
            <span class="item-category">{{ formatCategory(item.category) }}</span>
            <span class="item-stock" :class="{ 'in-stock': item.inStock, 'out-of-stock': !item.inStock }">
              {{ item.inStock ? 'I lager' : 'Slut' }}
            </span>
          </div>
          
          <div class="item-content">
            <h3 class="item-title">{{ item.name }}</h3>
            <p class="item-description">{{ truncateText(item.description, 100) }}</p>
            
            <div class="item-price-section">
              <span class="item-price">{{ formatPrice(item.price) }} SEK</span>
              <span class="item-date">
                {{ formatDate(item.createdAt) }}
              </span>
            </div>
          </div>
          
          <div class="item-actions">
            <button 
              @click.stop="editItem(item.id)" 
              class="action-button edit-button"
            >
              Redigera
            </button>
            <button 
              @click.stop="deleteItem(item.id)" 
              class="action-button delete-button"
            >
              Ta bort
            </button>
          </div>
        </div>
      </div>
      
      <div v-if="totalPages > 1" class="pagination">
        <button 
          @click="prevPage" 
          :disabled="currentPage === 1"
          class="pagination-button"
        >
          Föregående
        </button>
        
        <div class="page-numbers">
          <span 
            v-for="page in visiblePages" 
            :key="page"
            @click="goToPage(page)"
            :class="{ 'active': page === currentPage }"
            class="page-number"
          >
            {{ page }}
          </span>
        </div>
        
        <button 
          @click="nextPage" 
          :disabled="currentPage === totalPages"
          class="pagination-button"
        >
          Nästa
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useItemStore } from '../stores/items'
import { showToast } from '../services/api'

export default {
  name: 'ItemList',
  setup() {
    const router = useRouter()
    const itemStore = useItemStore()
    
    const searchQuery = ref('')
    const showInStockOnly = ref(false)
    const currentPage = ref(1)
    const itemsPerPage = ref(12)
    const searchTimeout = ref(null)

    const filteredItems = computed(() => {
      let items = itemStore.filteredItems
      
      if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase()
        items = items.filter(item => 
          item.name.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query) ||
          item.category?.toLowerCase().includes(query)
        )
      }
      
      if (showInStockOnly.value) {
        items = items.filter(item => item.inStock)
      }
      
      return items
    })

    const totalItems = computed(() => filteredItems.value.length)
    const inStockCount = computed(() => filteredItems.value.filter(item => item.inStock).length)
    const formattedTotalValue = computed(() => {
      const total = filteredItems.value.reduce((sum, item) => {
        return sum + (parseFloat(item.price) || 0)
      }, 0)
      return total.toLocaleString('sv-SE')
    })

    const paginatedItems = computed(() => {
      const start = (currentPage.value - 1) * itemsPerPage.value
      const end = start + itemsPerPage.value
      return filteredItems.value.slice(start, end)
    })

    const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value))
    
    const visiblePages = computed(() => {
      const pages = []
      const maxVisible = 5
      let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
      let end = Math.min(totalPages.value, start + maxVisible - 1)
      
      if (end - start + 1 < maxVisible) {
        start = Math.max(1, end - maxVisible + 1)
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      
      return pages
    })

    watch(searchQuery, () => {
      if (searchTimeout.value) {
        clearTimeout(searchTimeout.value)
      }
      searchTimeout.value = setTimeout(() => {
        currentPage.value = 1
      }, 300)
    })

    watch(showInStockOnly, () => {
      currentPage.value = 1
    })

    function viewItem(id) {
      router.push(`/items/${id}`)
    }

    function editItem(id) {
      router.push(`/items/${id}/edit`)
    }

    async function deleteItem(id) {
      const item = itemStore.getItemById(id)
      if (!item) return
      
      if (confirm(`Är du säker på att du vill ta bort "${item.name}"?`)) {
        try {
          await itemStore.deleteItem(id)
          showToast('Produkt borttagen', 'success')
        } catch (error) {
          showToast('Kunde inte ta bort produkten', 'error')
        }
      }
    }

    function updateCategory() {
      itemStore.setCategory(itemStore.selectedCategory)
      currentPage.value = 1
    }

    function updateSort() {
      const [field, order] = sortBy.value.startsWith('-') 
        ? [sortBy.value.slice(1), 'desc'] 
        : [sortBy.value, 'asc']
      itemStore.setSort(field, order)
    }

    function toggleStockFilter() {
      currentPage.value = 1
    }

    function handleSearch() {
      currentPage.value = 1
    }

    function prevPage() {
      if (currentPage.value > 1) {
        currentPage.value--
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }

    function nextPage() {
      if (currentPage.value < totalPages.value) {
        currentPage.value++
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }

    function goToPage(page) {
      currentPage.value = page
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    function formatCategory(category) {
      const categories = {
        electronics: 'Elektronik',
        clothing: 'Kläder',
        books: 'Böcker',
        other: 'Övrigt',
        all: 'Alla'
      }
      return categories[category] || category
    }

    function formatPrice(price) {
      return parseFloat(price).toLocaleString('sv-SE')
    }

    function formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleDateString('sv-SE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }

    function truncateText(text, maxLength) {
      if (!text) return 'Ingen beskrivning'
      if (text.length <= maxLength) return text
      return text.substring(0, maxLength) + '...'
    }

    const fetchItems = async () => {
      try {
        await itemStore.fetchItems()
      } catch (error) {
        console.error('Error fetching items:', error)
      }
    }

    fetchItems()

    return {
      searchQuery,
      showInStockOnly,
      currentPage,
      itemsPerPage,
      
      loading: computed(() => itemStore.loading),
      error: computed(() => itemStore.error),
      categories: computed(() => itemStore.categories),
      selectedCategory: computed(() => itemStore.selectedCategory),
      sortBy: ref('createdAt'),
      
      filteredItems,
      paginatedItems,
      totalItems,
      inStockCount,
      formattedTotalValue,
      totalPages,
      visiblePages,
      
      viewItem,
      editItem,
      deleteItem,
      updateCategory,
      updateSort,
      toggleStockFilter,
      handleSearch,
      prevPage,
      nextPage,
      goToPage,
      formatCategory,
      formatPrice,
      formatDate,
      truncateText,
      fetchItems
    }
  }
}
</script>

<style scoped>
.item-list {
  padding: 20px 0;
}

.controls {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 30px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.search-section {
  margin-bottom: 20px;
}

.search-box {
  display: flex;
  margin-bottom: 20px;
  max-width: 500px;
}

.search-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-right: none;
  border-radius: 8px 0 0 8px;
  font-size: 16px;
  transition: border-color 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #3498db;
}

.search-button {
  background: #3498db;
  color: white;
  border: none;
  border-radius: 0 8px 8px 0;
  padding: 0 20px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.search-button:hover {
  background: #2980b9;
}

.search-icon {
  font-size: 18px;
}

.filter-controls {
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
}

.filter-select {
  padding: 10px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  background: white;
  font-size: 14px;
  cursor: pointer;
  transition: border-color 0.3s ease;
}

.filter-select:focus {
  outline: none;
  border-color: #3498db;
}

.stock-filter {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.stock-filter input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-top: 20px;
}

.stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
}

.loading-container,
.error-container,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon {
  font-size: 48px;
  margin-bottom: 20px;
}

.retry-button {
  margin-top: 20px;
  padding: 10px 25px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.retry-button:hover {
  background: #2980b9;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
  opacity: 0.5;
}

.create-button {
  margin-top: 20px;
  padding: 12px 30px;
  background: #2ecc71;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 500;
  transition: background 0.3s ease;
}

.create-button:hover {
  background: #27ae60;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 25px;
  margin-bottom: 40px;
}

.item-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
}

.item-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.item-header {
  display: flex;
  justify-content: space-between;
  padding: 15px 20px;
  background: linear-gradient(90deg, #f8f9fa 0%, #e9ecef 100%);
}

.item-category {
  background: #3498db;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.item-stock {
  font-size: 12px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 12px;
}

.item-stock.in-stock {
  background: #d4edda;
  color: #155724;
}

.item-stock.out-of-stock {
  background: #f8d7da;
  color: #721c24;
}

.item-content {
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.item-title {
  margin: 0 0 10px 0;
  font-size: 18px;
  color: #2c3e50;
}

.item-description {
  color: #666;
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 20px;
  flex: 1;
}

.item-price-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
}

.item-price {
  font-size: 22px;
  font-weight: bold;
  color: #2c3;
}

.item-date {
  font-size: 12px;
  color: #95a5a6;
}

.item-actions {
  display: flex;
  border-top: 1px solid #eee;
}

.action-button {
  flex: 1;
  padding: 15px;
  border: none;
  background: none;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.action-button:hover {
  background: #f8f9fa;
}

.edit-button {
  color: #3498db;
  border-right: 1px solid #eee;
}

.delete-button {
  color: #e74c3c;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 40px;
  padding: 20px;
}

.pagination-button {
  padding: 10px 20px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.pagination-button:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.pagination-button:not(:disabled):hover {
  background: #2980b9;
}

.page-numbers {
  display: flex;
  gap: 8px;
}

.page-number {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
}

.page-number:hover {
  background: #f0f0f0;
}

.page-number.active {
  background: #3498db;
  color: white;
}
</style>