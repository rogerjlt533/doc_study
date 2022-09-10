<template>
    <div class="contaniner">
    	<div class="content-center">
			<div class="left-logo" @click="goHome">
				<img src="@/assets/image/fangcun.png" alt="">
				<span>方寸笔迹</span>
			</div>
			<ul class="nav">
				<li v-for="(item,index) in navList" :key="index"
					:class="[navIndex === index ? 'actived' : '']">
                    <a v-if="item.text === '帮助'" :href="item.url" target="_blank">{{item.text}}</a>
                    <router-link v-else :to="item.url">{{item.text}}</router-link>
				</li>
			</ul>
			<div class="mobile-nav">
				<div>
					<span @click="showMobileNav = !showMobileNav">菜单</span>
				</div>
				<el-collapse-transition>
					<div v-show="showMobileNav" class="el-menu-nav">
						<el-menu
						 	router
							default-active="2"
							background-color="#f6f7ff"
						>
							<el-menu-item :index="item.url" v-for="(item,index) in navList" :key="index">
								<span>{{item.text}}</span>
							</el-menu-item>
						</el-menu>
					</div>
				</el-collapse-transition>
			</div>
		</div>
    </div>
</template>

<script>
	import { ref, watch, computed, onMounted } from "vue"
	import { useRoute, useRouter } from "vue-router"
	import { useStore } from "vuex"

	export default {
		name: 'Header',
		setup(){
			let route = useRoute()
			const router = useRouter();
			let store = useStore()

			let navList = ref([
				{ text: "功能", url: "/" },
				{ text: "价格", url: "/#price" },
				{ text: "帮助", url: "https://help.fangcun.in/help/note.html" },
				{ text: "下载", url: "/#download" },
				{ text: "登录", url: "/login" },
				{ text: "注册", url: "/register" }
			])
			let navIndex = ref(0)
			let showMobileNav = ref(false)

			const userInfo = computed(() => store.state.user.userInfo)
			const token = localStorage.getItem("token")

			onMounted(() => {
				if(route.path){
					goPath();
				}
				if(token && userInfo.value.name){
					navList.value.pop()
					navList.value.pop()
					let obj = {
						text: "进入笔迹", 
						url: "/Home"
					}
					navList.value.push(obj)
				}
			})
			
			watch(() => route.path, (res) => {
				if(res){
					goPath();
				}
			})
			watch(() => route.hash, (res) => {
				if(res){
					goPath();
				}else{
					navIndex.value = 0
				}
			})

			function goPath(){
				navIndex.value = navList.value.findIndex((item) => {
					let path = route.hash ? `/${route.hash}` : route.path
					return item.url === path
				})
			}

			function goHome(){
				router.push({
					path: "Home"
				})
			}


			return {
				navIndex,
				navList,
				showMobileNav,
				goHome
			}
		}
	}
</script>

<style scoped lang="scss">
	.contaniner{
		background: #fff;

		.content-center{
			display: flex;
			justify-content: space-between;
			align-items: center;
			max-width: 1100px;
			height: 80px;
			margin: 0 auto;

			.left-logo{
				display: flex;
				align-items: center;
				cursor: pointer;
				img{
					width: 40px;
				}
				span{
					color: $purple2;
					font-size: 16px;
					font-weight: 700;
					margin-left: 10px;
				}
			}
			.nav{
				display: flex;
				align-items: center;
				list-style: none;
				color: $purple2;
				font-size: 16px;
				font-weight: 700;
				z-index: 9;
				li{
					margin-left: 50px;
					cursor: pointer;
					a{
						color: $purple2;
						text-decoration: none;
						&:hover{
							color: $purple;
						}
					}
                    &:last-child{
                        border: 1px solid #eeeeee;
                        padding: 4px 16px;
                        border-radius: 34px;
                        &:hover{
                            background: $purple2;
                            a{
                                color: #ffffff;
                            }
                        }
                    }
				}
				.actived{
					a{
						color: $purple;
					}
				}
			}
			.mobile-nav{
				position: relative;
				display: none;
				.el-menu-nav{
					position: absolute;
					right: 0;
					top: 54px;

					::v-deep(.el-menu-item){
						height: 36px !important;
					}
				}
			}
			
		}
	}
	// 手机端
	@media (max-width: 600px) {
		.content-center{
			padding: 0 10px;
		}
		.nav{
			display: none !important;
		}
		.mobile-nav{
			display: block !important;
		}
	}
</style>
