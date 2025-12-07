<template>
  <div id="app">
    <nav class="navbar">
      <router-link to="/">Hem</router-link>
      <router-link to="/items">Produkter</router-link>
      <router-link to="/create">Skapa Ny</router-link>
      <router-link to="/about">Om Appen</router-link>
    </nav>
    
    <div class="container">
      <router-view />
    </div>
    
    <footer class="footer">
      <p>Fullstack AWS App &copy; {{ currentYear }}</p>
      <p class="status" :class="{ 'online': isOnline }">
        Status: {{ isOnline ? 'Online' : 'Offline' }}
      </p>
    </footer>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import { useItemStore } from './stores/items'

export default {
  name: 'App',
  setup() {
    const itemStore = useItemStore()
    const currentYear = ref(new Date().getFullYear())
    const isOnline = ref(navigator.onLine)

    onMounted(async () => {
      try {
        await itemStore.fetchItems()
      } catch (error) {
        console.error('Kunde inte ladda produkter:', error)
      }
    })

    onMounted(() => {
      window.addEventListener('online', updateOnlineStatus)
      window.addEventListener('offline', updateOnlineStatus)
    })

    onUnmounted(() => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    })

    function updateOnlineStatus() {
      isOnline.value = navigator.onLine
    }

    return {
      currentYear,
      isOnline
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f5f5f5;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
  padding: 1rem 2rem;
  display: flex;
  gap: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.navbar a {
  color: white;
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background-color 0.3s ease;
}

.navbar a:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.navbar a.router-link-active {
  background-color: rgba(255, 255, 255, 0.2);
}

.container {
  flex: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  width: 100%;
}

.footer {
  background: #2c3e50;
  color: white;
  text-align: center;
  padding: 1.5rem;
  margin-top: auto;
}

.footer p {
  margin: 0.5rem 0;
}

.status {
  font-size: 0.9rem;
}

.status.online {
  color: #2ecc71;
}

.status:not(.online) {
  color: #e74c3c;
}
</style>