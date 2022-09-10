import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../views/Home/Home.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/user',
    name: 'User',
    component: () => import('../views/User/user.vue')
  }, {
    path: '/Login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  }, {
    path: '/Register',
    name: 'Register',
    component: () => import('../views/Register.vue')
  }, {
    path: '/BuyPage',
    name: 'BuyPage',
    component: () => import('../views/BuyPage.vue')
  }, {
    path: '/Note',
    name: 'Note',
    component: () => import('../views/articleDetails.vue')
  },

  {path: '/:catchAll(.*)', redirect: '/home'}
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if(to.hash){
      return {
        el: to.hash,
        top: 20,
        behavior: 'smooth'
      }
    }
  },
})

// router.beforeEach((to, from, next) => {
//   // 路由拦截器 只要是登录状态 进入首页时直接跳转home页
//   if(to.path === "/" && getToken()){
//     next({
//       path: "/home"
//     })
//   }else{
//     next();
//   }
// })


export default router
