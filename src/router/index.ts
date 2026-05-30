import { createRouter, createWebHashHistory } from 'vue-router'
import StacksView from '../views/StacksView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'stacks', component: StacksView },
    {
      path: '/study/:id',
      name: 'study',
      component: () => import('../views/StudyView.vue'),
      props: (route) => ({ id: Number(route.params.id) }),
    },
    {
      path: '/test/:group',
      name: 'test',
      component: () => import('../views/TestView.vue'),
      props: (route) => ({ group: Number(route.params.group) }),
    },
    {
      path: '/progress',
      name: 'progress',
      component: () => import('../views/ProgressView.vue'),
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue'),
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
