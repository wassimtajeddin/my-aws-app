import { createRouter, createWebHistory } from 'vue-router'

const Home = () => import('../views/Home.vue')
const ItemList = () => import('../views/ItemList.vue')
const CreateItem = () => import('../views/CreateItem.vue')
const EditItem = () => import('../views/EditItem.vue')
const ItemDetail = () => import('../views/ItemDetail.vue')
const About = () => import('../views/About.vue')

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: {
      title: 'Hem - AWS Fullstack App'
    }
  },
  {
    path: '/items',
    name: 'Items',
    component: ItemList,
    meta: {
      title: 'Produkter - AWS Fullstack App',
      requiresAuth: false
    }
  },
  {
    path: '/items/create',
    name: 'CreateItem',
    component: CreateItem,
    meta: {
      title: 'Skapa Produkt - AWS Fullstack App',
      requiresAuth: true
    }
  },
  {
    path: '/items/:id',
    name: 'ItemDetail',
    component: ItemDetail,
    props: true,
    meta: {
      title: 'Produktdetaljer - AWS Fullstack App'
    }
  },
  {
    path: '/items/:id/edit',
    name: 'EditItem',
    component: EditItem,
    props: true,
    meta: {
      title: 'Redigera Produkt - AWS Fullstack App',
      requiresAuth: true
    }
  },
  {
    path: '/about',
    name: 'About',
    component: About,
    meta: {
      title: 'Om Appen - AWS Fullstack App'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

router.beforeEach((to, from, next) => {
  if (to.meta.title) {
    document.title = to.meta.title
  }
  
  if (to.meta.requiresAuth) {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      next({
        path: '/',
        query: { redirect: to.fullPath }
      })
      return
    }
  }
  
  next()
})

export default router