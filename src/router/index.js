// Composables
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('@/layouts/default/Default.vue'),
    children: [
      {
        path: '',
        name: 'Home',
        // route level code-splitting
        // this generates a separate chunk (about.[hash].js) for this route
        // which is lazy-loaded when the route is visited.
        component: () => import(/* webpackChunkName: "home" */ '@/views/Home.vue'),
      },
      {
        path: '/arved',
        name: 'Arved',
        component: () => import('@/views/Bills.vue'),
      },
      {
        path: '/statistika',
        name: 'Statistika',
        component: () => import('@/views/Statistics.vue'),
      },
      {
        path: '/logi',
        name: 'Logi',
        component: () => import('@/views/Admin.vue'),
      }
    ],
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
})

export default router
