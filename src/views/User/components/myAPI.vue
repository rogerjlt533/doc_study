<template>
    <div class="api">
        <a class="atag" target="_blank" href="https://help.fangcun.in/help/api.html">我的API能做什么？</a>
        <div>
            <span class="api-input">{{myApi}}</span>
            <el-button type="primary" plain color="#7885d1" @click="copyApi">点击复制</el-button>
        </div>
        <div class="explain">
            <h3>说明</h3>
            <p>
                方寸笔迹提供对有开发能力开发者的公共调用API，可以通过API的形式来实现方寸笔迹数据内容的交互。基于对安全性的考量，目前仅提供对笔记的录入功能，每位用户每日调用上限为1000次，即可通过API每日写入1000条笔记。其中笔记的格式与内容，跟直接写笔记的方式和语法一致，没有针对API进行额外的笔记负担。
            </p>
        </div>
        <div class="explain">
            <h3>使用方法</h3>
            <p>API可以在主界面获取，拿到API后，可以通过POST方式调用。</p>
            <div class="code">
                <pre><span class="token function">curl</span> -X POST <br> -d <span class="token string">'{"note": "Hello,#note this note was sended via API"}'</span><br><span class="token string">"https://api.fang-cun.net/api/open/note/...."</span></pre>
            </div>
            <h3>参数</h3>
            <el-table :data="tableData" border style="width: 100%">
                <el-table-column prop="props1" label="参数" />
                <el-table-column prop="props2" label="说明" />
                <el-table-column prop="props3" label="类型" />
                <el-table-column prop="props4" label="必传">
                    <template #default="scope">
                        <font-awesome-icon icon="check"></font-awesome-icon>
                    </template>
                </el-table-column>
            </el-table>
        </div>
        <div class="explain">
            <h3>插件中心</h3>
            <div>
                微信读书导入方寸笔迹（ <a class="atag" target="_blank" href="https://github.com/ivone-liu/ThoughtNote-Weread-Sync">github地址</a> / <a class="atag" target="_blank" href="https://gitee.com/ivonee/ThoughtNote-Weread-Sync">码云</a> ）
            </div>
        </div>
    </div>
</template>

<script setup>
    import { ref } from "vue"
    import { getUserApiApi } from "@/api/user"
    import {ElNotification} from "element-plus";

    getUserApi()

    let myApi = ref("我的API~~~~")
    function getUserApi(){
        getUserApiApi().then((res) => {
            if(res.code == 200){
                myApi.value = res.data.api
            }
        })
    }

    function copyApi(){
        let tag = document.createElement('input')
        tag.setAttribute('id', 'cp_hgz_input')
        tag.value = myApi.value
        document.getElementsByTagName('body')[0].appendChild(tag);
        document.getElementById('cp_hgz_input').select();
        document.execCommand('copy');
        document.getElementById('cp_hgz_input').remove();
        ElNotification.success("复制成功")
    }


    const tableData = [
        {
            props1: 'note',
            props2: 'string',
            props3: '笔记内容',
            props4: 'y'
        }
    ]
</script>

<style lang="scss" scoped>
    .api{
        padding-left: 40px;
        .api-input{
            display: inline-block;
            border: 1px solid #bfc5e1;
            padding: 3px 20px;
            border-radius: 4px;
            color: #666666;
            vertical-align: bottom;
        }
        textarea{
            display: none;
        }
    }
    .explain{
        p{
            color: #666;
            font-size: 14px;
        }
        div{
            color: #666;
            font-size: 14px;
        }

        .code{
            background: #232323;
            line-height: 22px;
            border-radius: 8px;
            padding: 10px;
            color: #ffffff;
            margin-top: 10px;
            pre{
                margin: 0;
                .function{
                    color: #f08d49
                }
                .string{
                    color: #7ec699;
                }
            }
        }
    }


</style>