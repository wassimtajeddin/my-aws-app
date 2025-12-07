import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    config.headers['X-Request-ID'] = generateRequestId()
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log(`✅ API Success: ${response.config.method.toUpperCase()} ${response.config.url}`)
    }
    return response
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          if (window.location.pathname !== '/login') {
            localStorage.removeItem('auth_token')
            window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname)
          }
          break
          
        case 403:
          showToast('Du har inte tillgång till denna resurs', 'error')
          break
          
        case 404:
          if (import.meta.env.DEV) {
            console.warn('Resource not found:', error.config.url)
          }
          break
          
        case 429:
          showToast('För många förfrågningar. Vänta en stund.', 'warning')
          break
          
        case 500:
          showToast('Serverfel. Försök igen senare.', 'error')
          break
          
        default:
          if (data && data.error) {
            showToast(data.error, 'error')
          } else {
            showToast('Ett oväntat fel uppstod', 'error')
          }
      }
      
      console.error('API Error:', {
        url: error.config.url,
        method: error.config.method,
        status: error.response.status,
        data: error.response.data
      })
    } else if (error.request) {
      console.error('No response received:', error.request)
      showToast('Inget svar från servern. Kontrollera din nätverksanslutning.', 'error')
    } else {
      console.error('Request setup error:', error.message)
    }
    
    return Promise.reject(error)
  }
)

function generateRequestId() {
  return 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container')
  if (!container) {
    container = document.createElement('div')
    container.className = 'toast-container'
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
    `
    document.body.appendChild(container)
  }
  
  const toast = document.createElement('div')
  toast.className = `toast toast-${type}`
  toast.style.cssText = `
    background: ${type === 'error' ? '#f44336' : type === 'warning' ? '#ff9800' : '#4CAF50'};
    color: white;
    padding: 12px 24px;
    margin-bottom: 10px;
    border-radius: 4px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    animation: slideIn 0.3s ease;
  `
  toast.textContent = message
  
  if (!document.querySelector('#toast-styles')) {
    const style = document.createElement('style')
    style.id = 'toast-styles'
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
    `
    document.head.appendChild(style)
  }
  
  container.appendChild(toast)
  
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease'
    setTimeout(() => {
      if (toast.parentNode === container) {
        container.removeChild(toast)
      }
      if (container.children.length === 0) {
        document.body.removeChild(container)
      }
    }, 300)
  }, 5000)
}

export default api
export { showToast }