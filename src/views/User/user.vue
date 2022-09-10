<template>
	<div class="container-user">
		<div class="center">
            <div class="back">

                <router-link to="/home" replace>
                    <h3>
                        <font-awesome-icon icon="chevron-circle-left" style="font-size: 18px;" color="#666666" />
                        返回方寸笔迹
                    </h3>
                </router-link>
            </div>
            <el-row>
                <el-col :span="6">
                    <el-menu
                        :default-active="defaultActive"
                        class="el-menu-vertical-demo"
                        active-text-color="#7885d1"
                        style="height: calc(100vh - 120px)"
                    >
                        <el-menu-item
                            v-for="(nav,index) in navList"
                            :key="index"
                            :index="index"
                            @click="selectItem(nav,index)"
                        >
                            <font-awesome-icon :icon="nav.icon" class="mr4 font-14" />
                            <span>{{nav.label}}</span>
                            <pro v-if="nav.label === '笔记同步' || nav.label === 'API工具'"></pro>
                        </el-menu-item>
                    </el-menu>
                </el-col>
                <el-col :span="18">
                    <div class="right-content">
                        <transition name="transition">
                            <keep-alive>
                                <component
                                    :is="routeView"
                                    :userInfo="userInfo"
                                    :userRight="userRight"
                                    :setting="setting"
                                ></component>
                            </keep-alive>
                        </transition>
                    </div>
                </el-col>
            </el-row>
		</div>
	</div>
</template>

<script setup>
import {ref, onMounted, computed, nextTick} from "vue"
	import { useStore } from "vuex"
    import { useRoute } from "vue-router";
	import { domainApi } from "@/api/user"
    // 组件
	import { ElMessage, ElMessageBox } from "element-plus"
    import accountSetting from "./components/accountSetting";
    import storage from "./components/storage"
    import share from "./components/share"
    import syncNote from "./components/syncNote"
    import noteSetting from "./components/noteSetting"
    import exportNote from "./components/exportNote"
    import myAPI from "./components/myAPI"
    import pro from "../../components/element/pro"


    const store = useStore();
    const route = useRoute();

	onMounted(() => {
		// store.dispatch("user/getUserInfo")
		store.dispatch("user/getUserSetting")
		store.dispatch("user/getUserRight")
	})

	// 获取用户信息
	let userInfo = computed(() => { return store.state.user.userInfo });
	let setting = computed(() => { return store.state.user.userSetting });
	let userRight = computed(() => {
        if(store.state.user.userRight){
            store.state.user.userRight.percent = Number(store.state.user.userRight.percent)
        }
		return store.state.user.userRight
	});
    const navList = [
        { icon: 'cog', label: "账户设置", route: accountSetting },
        { icon: 'hdd', label: "储存空间", route: storage },
        { icon: 'envelope-open-text', label: "通知设置", route: share },
        { icon: 'sticky-note', label: "笔记设置", route: noteSetting },
        { icon: 'sync', label: "笔记同步", route: syncNote },
        { icon: 'link', label: "API工具", route: myAPI },
        { icon: 'file-export', label: "笔记导出", route: exportNote }
    ]

    let routeView = ref(accountSetting)
    let defaultActive = ref(0)
    function selectItem(nav,index){
        defaultActive.value = index
        routeView.value = nav.route
    }

    // 判断是否从notion进入
    if(route.query?.code && route.query?.state === "notion"){
        nextTick(() => {
            routeView.value = syncNote
            defaultActive.value = 3
        })
    }


	//  分享设置部分
	let shareRadio = ref(setting.value.note_public);


</script>

<style lang="scss">
    .container-user{
        .el-button {
            border-color: #bfc5e1;
        }
        .el-button--text{
            border-color: transparent;
            color: $purple;
        }
    }

	.el-form--label-top .el-form-item__label{
		padding: 0;
	}

	.personal-text-add{
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 4px 0 10px;
		.icon{
			margin: 0 20px;
		}
	}
	.personal-text{
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 10px;
		.text{
			width: 78px;
            height: 20px;
			text-align: center;
			font-size: 14px;
			color: #333;
			padding: 4px 10px;
			border: 1px solid #eee;
			border-radius: 4px;
		}
		.icon{
			margin: 0 20px;
		}
		.close{
			font-size: 24px;
			margin-left: 10px; 
			cursor: pointer;
			&:active{
				opacity: 0.8;
			}
		}
	}
    .personal-text-none{
        color: #999999;
        font-size: 12px;
        text-align: center;
        line-height: 60px;
    }
	.personal-btn{
		display: flex;
		justify-content: flex-end;
	}

    .note-set, .share-set{
        ul{
            li{
                display: flex;
                align-items: center;
                margin-bottom: 20px;
                .name{
                    width: 120px;
                    color: #333;
                    font-size: 14px;
                    margin-right: 20px;
                }
                >div{
                    width: 400px;
                    display: flex;
                    align-items: center;
                    .sure-btn{
                        margin-left: 20px;
                    }
                }
                .domain{
                    color: #999;
                    font-size: 16px;
                }
            }
        }
    }
    .tips{
        color: #999999;
        font-size: 14px;
        padding-left: 40px;
    }
    .atag{
        color: $purple;
        text-decoration: none;
        font-size: 14px;
        &:hover{
            text-decoration: underline;
        }
    }
</style>
<style lang="scss" scoped>
	.container-user{
		.center{
			width: 900px;
			margin: 20px auto;
			background: #fff;
			border-radius: 4px;
			padding: 20px;
			.back{
				padding-bottom: 10px;
				border-bottom: 1px solid #eee;
				a{
					> h3{
						display: inline-block;
						margin: 0;
						color: #333;
						cursor: pointer;
						&:hover{
							color: $purple;
							.svg-inline--fa{
								color: $purple;
							}
						}
					}
				}
			}
		}
        .right-content{
            padding: 20px 0;
        }
	}

    .transition-enter-active {
        opacity: 0;
        transform: translateY(50px);
        transition: transform 0.5s;
    }
    .transition-enter-to {
        opacity: 1;
        transform: translateY(0px);
    }
    .transition-leave-active {
        opacity: 0;
    }
</style>