<template>
  <div class="create-item">
    <div class="page-header">
      <h1>Skapa Ny Produkt</h1>
      <router-link to="/items" class="back-link">
        ← Tillbaka till produkter
      </router-link>
    </div>

    <div class="form-container">
      <form @submit.prevent="submitForm" class="item-form">
        <div class="form-section">
          <h2 class="section-title">Grundinformation</h2>
          
          <div class="form-group">
            <label for="name" class="form-label">
              Produktnamn *
              <span class="character-count">{{ name.length }}/100</span>
            </label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              required
              maxlength="100"
              placeholder="Ange produktnamn"
              :class="{ 'error': errors.name }"
              @input="validateField('name')"
              class="form-input"
            />
            <div v-if="errors.name" class="error-message">
              {{ errors.name }}
            </div>
          </div>

          <div class="form-group">
            <label for="description" class="form-label">
              Beskrivning
              <span class="character-count">{{ form.description.length }}/500</span>
            </label>
            <textarea
              id="description"
              v-model="form.description"
              rows="5"
              maxlength="500"
              placeholder="Beskriv produkten..."
              class="form-textarea"
            ></textarea>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="price" class="form-label">
              Pris (SEK) *
              <span class="hint">Exkl. moms</span>
            </label>
            <div class="price-input-wrapper">
              <input
                id="price"
                v-model.number="form.price"
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="0.00"
                :class="{ 'error': errors.price }"
                @input="validateField('price')"
                class="form-input"
              />
              <span class="price-suffix">SEK</span>
            </div>
            <div v-if="errors.price" class="error-message">
              {{ errors.price }}
            </div>
          </div>

          <div class="form-group">
            <label for="category" class="form-label">Kategori *</label>
            <select
              id="category"
              v-model="form.category"
              required
              class="form-select"
            >
              <option value="" disabled>Välj kategori</option>
              <option value="electronics">Elektronik</option>
              <option value="clothing">Kläder</option>
              <option value="books">Böcker</option>
              <option value="other">Övrigt</option>
            </select>
          </div>
        </div>

        <div class="form-section">
          <h2 class="section-title">Övrig Information</h2>
          
          <div class="form-row">
            <div class="form-group">
              <label for="sku" class="form-label">SKU/Artikelnummer</label>
              <input
                id="sku"
                v-model="form.sku"
                type="text"
                placeholder="Ex: PROD-001"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="quantity" class="form-label">Antal i lager</label>
              <input
                id="quantity"
                v-model.number="form.quantity"
                type="number"
                min="0"
                placeholder="0"
                class="form-input"
              />
            </div>
          </div>

          <div class="form-group checkbox-group">
            <label class="checkbox-label">
              <input
                v-model="form.inStock"
                type="checkbox"
                class="checkbox"
              />
              <span class="checkbox-custom"></span>
              Finns i lager
            </label>
          </div>

          <div class="form-group">
            <label for="tags" class="form-label">Taggar</label>
            <div class="tags-input">
              <input
                id="tags"
                v-model="tagInput"
                type="text"
                placeholder="Lägg till taggar (tryck Enter)"
                @keydown.enter.prevent="addTag"
                class="form-input"
              />
              <div v-if="form.tags.length > 0" class="tags-list">
                <span
                  v-for="(tag, index) in form.tags"
                  :key="index"
                  class="tag"
                >
                  {{ tag }}
                  <button
                    type="button"
                    @click="removeTag(index)"
                    class="tag-remove"
                  >
                    ×
                  </button>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button
            type="submit"
            :disabled="loading || !isFormValid"
            class="submit-button"
          >
            <span v-if="loading" class="button-loader"></span>
            {{ loading ? 'Skapar produkt...' : 'Skapa Produkt' }}
          </button>
          
          <button
            type="button"
            @click="resetForm"
            class="secondary-button"
          >
            Rensa formulär
          </button>
          
          <router-link to="/items" class="cancel-link">
            Avbryt
          </router-link>
        </div>
      </form>

      <div class="form-preview">
        <h2 class="preview-title">Förhandsvisning</h2>
        <div class="preview-card">
          <div class="preview-header">
            <span class="preview-category">
              {{ getCategoryLabel(form.category) || 'Kategori' }}
            </span>
            <span class="preview-stock" :class="{ 'in-stock': form.inStock }">
              {{ form.inStock ? 'I lager' : 'Slut' }}
            </span>
          </div>
          
          <div class="preview-content">
            <h3 class="preview-name">
              {{ form.name || 'Produktnamn' }}
            </h3>
            <p class="preview-description">
              {{ form.description || 'Produktbeskrivning kommer här...' }}
            </p>
            
            <div class="preview-details">
              <div class="detail-item">
                <span class="detail-label">Pris:</span>
                <span class="detail-value">
                  {{ form.price ? form.price.toLocaleString('sv-SE') + ' SEK' : '0 SEK' }}
                </span>
              </div>
              
              <div v-if="form.sku" class="detail-item">
                <span class="detail-label">SKU:</span>
                <span class="detail-value">{{ form.sku }}</span>
              </div>
              
              <div v-if="form.quantity !== undefined" class="detail-item">
                <span class="detail-label">Antal:</span>
                <span class="detail-value">{{ form.quantity }}</span>
              </div>
            </div>
            
            <div v-if="form.tags.length > 0" class="preview-tags">
              <span
                v-for="(tag, index) in form.tags"
                :key="index"
                class="preview-tag"
              >
                {{ tag }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useItemStore } from '../stores/items'
import { showToast } from '../services/api'

export default {
  name: 'CreateItem',
  setup() {
    const router = useRouter()
    const itemStore = useItemStore()

    const form = reactive({
      name: '',
      description: '',
      price: 0,
      category: '',
      sku: '',
      quantity: undefined,
      inStock: true,
      tags: []
    })
    
    const errors = reactive({
      name: '',
      price: ''
    })
    
    const tagInput = ref('')
    const loading = ref(false)

    const isFormValid = computed(() => {
      return form.name.trim() && form.price > 0 && form.category && !errors.name && !errors.price
    })

    function validateField(field) {
      switch (field) {
        case 'name':
          if (form.name.length < 2) {
            errors.name = 'Namnet måste vara minst 2 tecken'
          } else if (form.name.length > 100) {
            errors.name = 'Namnet får max vara 100 tecken'
          } else {
            errors.name = ''
          }
          break
        
        case 'price':
          if (form.price < 0) {
            errors.price = 'Priset kan inte vara negativt'
          } else if (form.price > 1000000) {
            errors.price = 'Priset är för högt'
          } else {
            errors.price = ''
          }
          break
      }
    }

    function addTag() {
      const tag = tagInput.value.trim()
      if (tag && !form.tags.includes(tag)) {
        form.tags.push(tag)
        tagInput.value = ''
      }
    }

    function removeTag(index) {
      form.tags.splice(index, 1)
    }

    function getCategoryLabel(category) {
      const categories = {
        electronics: 'Elektronik',
        clothing: 'Kläder',
        books: 'Böcker',
        other: 'Övrigt'
      }
      return categories[category]
    }

    async function submitForm() {
      validateField('name')
      validateField('price')
      
      if (errors.name || errors.price || !form.category) {
        showToast('Vänligen fyll i alla obligatoriska fält korrekt', 'error')
        return
      }

      loading.value = true
      
      try {
        const itemData = {
          name: form.name.trim(),
          description: form.description.trim(),
          price: parseFloat(form.price),
          category: form.category,
          inStock: form.inStock,
          metadata: {}
        }
        
        if (form.sku.trim()) itemData.sku = form.sku.trim()
        if (form.quantity !== undefined) itemData.quantity = parseInt(form.quantity)
        if (form.tags.length > 0) itemData.metadata.tags = form.tags
        
        await itemStore.createItem(itemData)
    
        showToast('Produkten har skapats!', 'success')
        
        router.push('/items')
        
      } catch (error) {
        console.error('Error creating item:', error)
        showToast('Kunde inte skapa produkten. Försök igen.', 'error')
      } finally {
        loading.value = false
      }
    }

    function resetForm() {
      if (confirm('Är du säker på att du vill rensa formuläret?')) {
        form.name = ''
        form.description = ''
        form.price = 0
        form.category = ''
        form.sku = ''
        form.quantity = undefined
        form.inStock = true
        form.tags = []
        tagInput.value = ''
        
        errors.name = ''
        errors.price = ''
      }
    }

    return {
      form,
      errors,
      tagInput,
      loading,
      isFormValid,
      validateField,
      addTag,
      removeTag,
      getCategoryLabel,
      submitForm,
      resetForm
    }
  }
}
</script>

<style scoped>
.create-item {
  padding: 20px 0;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
}

.page-header h1 {
  font-size: 28px;
  color: #2c3e50;
  margin: 0;
}

.back-link {
  color: #3498db;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

.back-link:hover {
  color: #2980b9;
  text-decoration: underline;
}

.form-container {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 40px;
}

@media (max-width: 992px) {
  .form-container {
    grid-template-columns: 1fr;
  }
}

.item-form {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.form-section {
  margin-bottom: 30px;
  padding-bottom: 30px;
  border-bottom: 1px solid #eee;
}

.section-title {
  font-size: 20px;
  color: #2c3e50;
  margin: 0 0 20px 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-title::before {
  content: '';
  display: block;
  width: 4px;
  height: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 2px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}

.form-group {
  margin-bottom: 25px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #2c3e50;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.character-count {
  font-size: 12px;
  font-weight: normal;
  color: #95a5a6;
}

.hint {
  font-size: 12px;
  font-weight: normal;
  color: #7f8c8d;
  font-style: italic;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.3s ease;
  background: white;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.form-input.error,
.form-textarea.error,
.form-select.error {
  border-color: #e74c3c;
}

.form-input.error:focus,
.form-textarea.error:focus,
.form-select.error:focus {
  box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.price-input-wrapper {
  position: relative;
}

.price-suffix {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #95a5a6;
  font-weight: 500;
}

.error-message {
  color: #e74c3c;
  font-size: 14px;
  margin-top: 5px;
}

.checkbox-group {
  margin-top: 25px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
  font-weight: 500;
}

.checkbox {
  display: none;
}

.checkbox-custom {
  width: 22px;
  height: 22px;
  border: 2px solid #3498db;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.checkbox:checked + .checkbox-custom {
  background: #3498db;
}

.checkbox:checked + .checkbox-custom::after {
  content: '✓';
  color: white;
  font-size: 14px;
  font-weight: bold;
}

.tags-input {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 5px;
}

.tag {
  background: #e3f2fd;
  color: #1976d2;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.tag-remove {
  background: none;
  border: none;
  color: #1976d2;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s ease;
}

.tag-remove:hover {
  background: rgba(25, 118, 210, 0.1);
}

.form-actions {
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
  padding-top: 20px;
  border-top: 1px solid #eee;
  margin-top: 30px;
}

.submit-button,
.secondary-button,
.cancel-link {
  padding: 12px 30px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.submit-button {
  background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
  color: white;
  border: none;
  flex: 1;
  min-width: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(46, 204, 113, 0.3);
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

.button-loader {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.secondary-button {
  background: #ecf0f1;
  color: #2c3e50;
  border: none;
  flex: 1;
  min-width: 140px;
}

.secondary-button:hover {
  background: #dde4e6;
}

.cancel-link {
  color: #95a5a6;
  text-decoration: none;
  padding: 12px 20px;
}

.cancel-link:hover {
  color: #7f8c8d;
  text-decoration: underline;
}

.form-preview {
  position: sticky;
  top: 20px;
  height: fit-content;
}

.preview-title {
  font-size: 20px;
  color: #2c3e50;
  margin: 0 0 20px 0;
}

.preview-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 2px solid #f0f0f0;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  padding: 15px 20px;
  background: linear-gradient(90deg, #f8f9fa 0%, #e9ecef 100%);
  border-bottom: 1px solid #e0e0e0;
}

.preview-category {
  background: #3498db;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.preview-stock {
  font-size: 12px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 12px;
}

.preview-stock.in-stock {
  background: #d4edda;
  color: #155724;
}

.preview-stock:not(.in-stock) {
  background: #f8d7da;
  color: #721c24;
}

.preview-content {
  padding: 20px;
}

.preview-name {
  font-size: 18px;
  color: #2c3e50;
  margin: 0 0 15px 0;
  line-height: 1.4;
}

.preview-description {
  color: #666;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 20px;
  white-space: pre-wrap;
}

.preview-details {
  margin-bottom: 20px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.detail-label {
  color: #7f8c8d;
  font-weight: 500;
}

.detail-value {
  color: #2c3e50;
  font-weight: 600;
}

.preview-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.preview-tag {
  background: #f0f0f0;
  color: #666;
  padding: 4px 10px;
  border-radius: 15px;
  font-size: 12px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>