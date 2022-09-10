<template>
    <div class="contaniner">
    	<div class="content-center">
			<div class="left">
                <div class="ml20">
                    <p class="nav size14">联系</p>
                    <ul class="concate">
                        <li class="flex align-center">
                            <img src="@/assets/image/home/xin.png" alt="">
                            <span class="size14 color9 ml10">ivone@fang-cun.net</span>
                        </li>
                        <li class="flex align-center">
                            <img src="@/assets/image/home/xin.png" alt="">
                            <span class="size14 color9 ml10">jiaolongtian@fang-cun.net</span>
                        </li>
                        <li class="flex align-center">
                            <img src="@/assets/image/home/xin.png" alt="">
                            <span class="size14 color9 ml10">cuimengchao@fang-cun.net</span>
                        </li>
                    </ul>
                    <div class="mt20">
                        <img class="mr10" src="@/assets/image/home/lx1.png" width="32" alt="">
                        <img class="mr10" src="@/assets/image/home/lx2.png" width="32" alt="">
                        <img class="mr10" src="@/assets/image/home/lx3.png" width="32" alt="">
                    </div>
                </div>
                <div class="ml20 pl20">
                    <p class="nav size14 color9">友情链接</p>
                    <ul class="concate">
                        <li class="flex align-center">
                            <font-awesome-icon icon="circle" color="#999999" class="mr4" style="font-size: 10px;"></font-awesome-icon>
                            <span class="size14 color9"><a href="https://www.grabox.net/" target="_blank">Grabox · 网络收藏夹</a></span>
                        </li>
                        <li class="flex align-center">
                            <font-awesome-icon icon="circle" color="#999999" class="mr4" style="font-size: 10px;"></font-awesome-icon>
                            <span class="size14 color9"><a href="https://ivone.me/" target="_blank">刘一峰的网络日志</a></span>
                        </li>
                    </ul>
                </div>
            </div>
            <div class="right">
                <p class="nav size14">关注方寸笔迹</p>
                <div class="f-flex">
                    <div class="mr20 pr20">
                        <img src="@/assets/image/home/wx1.png" alt="">
                        <p class="color-9 font-14 text-center">方寸社区群</p>
                    </div>
                    <div class="mr20 pr20">
                        <img src="@/assets/image/home/wx3.png" alt="">
                        <p class="color-9 font-14 text-center">方寸公众号</p>
                    </div>
                    <div class="mr20 pr20">
                        <img src="@/assets/image/home/wx2.png" alt="">
                        <p class="color-9 font-14 text-center">方寸手机端</p>
                    </div>
                </div>
            </div>
		</div>
    </div>
    <div class="beian text-center">ICP备案证书号: <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">鲁ICP备2021030472号-1</a> POWERED BY方寸笔迹®</div>
</template>

<script>
	export default {
		name: 'Footer',
		setup(){
			
		}
	}
</script>

<style scoped lang="scss">
    ul{
        padding: 0;
        margin: 0;
        li{
            list-style: none;
        }
    }
	.contaniner{
        border-top: 1px solid #eee;
		border-bottom: 1px solid #eee;
		background: #fff;

		.content-center{
			display: flex;
			justify-content: space-between;
			align-items: flex-start;
			max-width: 1100px;
			margin: 0 auto;
            padding: 40px 0;
            
            .size14{
                font-size: 14px;
            }
            .color9{
                color: #999;
            }
            .nav{
                cursor: pointer;
                font-weight: 700;
                font-size: 16px;
                margin-bottom: 20px;
                color: $purple2;
            }
            .left{
                display: flex;
                align-items: flex-start;
                .logo{
                    width: 40px;
                }
                .concate{
                    li{
                        margin-bottom: 10px;
                        img{
                            width: 20px;
                        }
                        a{
                            color: #999;
                            text-decoration: none;
                            &:hover{
                                color: $purple;
                            }
                        }
                    }
                }
            }
            .right{
                img{
                    width: 110px;
                }
            }
		}
	}
    .beian{
        background: #FAFAFC;
        height: 40px;
        color: #999;
        font-size: 14px;
        line-height: 40px;
        a{
            color: #999;
            text-decoration: none;
            &:hover{
                color: #44445f;
            }
        }
    }
    @media (max-width: 600px) {
		.content-center{
            flex-direction: column !important;
            .left{
                flex-direction: column !important;
                .logo{
                    display: block;
                    margin: 0 auto;
                }
            }

            .right{
                img{
                    width: 180px;
                }
            }
        }
        .beian{
            font-size: 12px;
        }
	}
</style>
