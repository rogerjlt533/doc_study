<template>
    <div class="notice-contaniner">
		<div class="header flex align-center">
			<h3>消息通知</h3>
			<span v-if="noticeList.length > 0" @click="haveReadAll">全标已读</span>
		</div>
		
		<div class="list-con">
			<template v-if="noticeList.length > 0">
				<div class="list" :class="[item.read_status == 1 ? 'isRead' : '']" v-for="item,index in noticeList" :key="index" @click="readMessage(item,index)">
					<div class="time">{{item.created_at}}</div>
					<div class="content">{{item.msg_content}}</div>
				</div>
			</template>
			<el-empty v-else description="暂无更多消息提示~~~"></el-empty>
		</div>
    </div>
</template>

<script setup>
	import { computed, ref } from "vue"
	import { storeKey, useStore } from "vuex"
	import { useRouter } from 'vue-router'
	import bus from '@/utils/bus'
	import { haveReadAllApi, haveReadApi }  from "@/api/user.js"

	const store = useStore();

	// 获取用户信息;
	store.dispatch("user/getUserNoticeList")
	let noticeList = computed(() => {
		return store.state.user.noticeList
	});

	function haveReadAll(){
		haveReadAllApi().then((res) => {
			if(res.code == 200){
				noticeList.value.forEach(item => {
					item.read_status = 1
				});
			}
		})	
	}

	function readMessage(item,index){
		let data = {
			message_id: item.id
		}
		haveReadApi(data).then((res) => {
			if(res.code == 200){
				noticeList.value[index].read_status = 1;
				bus.emit("checkNoReading")
			}
		})	
	}
</script>

<style scoped lang="scss">
	.notice-contaniner{
		width: 620px;
		.header{
			justify-content: space-between;
			h3{
				margin: 10px 0;
			}
			span{
				color: #999;
				font-size: 14px;
				cursor: pointer;
				&:hover{
					color: #333;
				}
			}
		}
		.list-con{
			height: 90vh;
			overflow: auto;
			&::-webkit-scrollbar { width: 0 !important }
		}
		.list{
			border-radius: 4px;
			background: #fff;
			padding: 12px 16px;
			margin: 10px 0;
			.time{
				color: #666;
				font-size: 12px;
			}
			.content{
				color: #333;
				font-size: 14px;
				margin-top: 10px;
			}
		}
		.isRead{
			background: #f5f5f5;
			.time{
				color: #999;
			}
			.content{
				color: #666;
			}
		}
	}
</style>
