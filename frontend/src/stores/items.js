import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../services/api'

export const useItemStore = defineStore('items', () => {
  const items = ref([])
  const loading = ref(false)
  const error = ref(null)
  const selectedCategory = ref('all')
  const sortBy = ref('createdAt')
  const sortOrder = ref('desc')

  const filteredItems = computed(() => {
    let filtered = [...items.value]
    
    if (selectedCategory.value !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory.value)
    }
    
    filtered.sort((a, b) => {
      let aValue = a[sortBy.value]
      let bValue = b[sortBy.value]
      
      if (sortBy.value.includes('At')) {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      }
      
      if (sortOrder.value === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })
    
    return filtered
  })

  const categories = computed(() => {
    const cats = items.value.map(item => item.category)
    return ['all', ...new Set(cats)].filter(Boolean)
  })

  const totalValue = computed(() => {
    return items.value.reduce((sum, item) => {
      return sum + (parseFloat(item.price) || 0)
    }, 0)
  })

  async function fetchItems() {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.get('/items')
      items.value = response.data.data || response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Kunde inte hämta produkter'
      console.error('Error fetching items:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createItem(itemData) {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.post('/items', itemData)
      items.value.push(response.data.data || response.data)
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Kunde inte skapa produkt'
      console.error('Error creating item:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateItem(id, updates) {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.put(`/items/${id}`, updates)
      const index = items.value.findIndex(item => item.id === id)
      if (index !== -1) {
        items.value[index] = response.data.data || response.data
      }
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Kunde inte uppdatera produkt'
      console.error('Error updating item:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteItem(id) {
    loading.value = true
    error.value = null
    
    try {
      await api.delete(`/items/${id}`)
      items.value = items.value.filter(item => item.id !== id)
    } catch (err) {
      error.value = err.response?.data?.error || 'Kunde inte ta bort produkt'
      console.error('Error deleting item:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  function setCategory(category) {
    selectedCategory.value = category
  }

  function setSort(field, order) {
    sortBy.value = field
    sortOrder.value = order
  }

  function getItemById(id) {
    return items.value.find(item => item.id === id)
  }

  return {
    items,
    loading,
    error,
    selectedCategory,
    sortBy,
    sortOrder,
    
    filteredItems,
    categories,
    totalValue,
    
    fetchItems,
    createItem,
    updateItem,
    deleteItem,
    setCategory,
    setSort,
    getItemById
  }
})