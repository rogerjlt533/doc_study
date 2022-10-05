<template>
    <el-dialog
            v-model="showDialog"
            :title="title"
            width="350px"
    >
        <div class="container">
            <el-icon size="20px" color="#E6A23C"><Warning/></el-icon>
            <span>{{message}}</span>
        </div>
        <template #footer>
            <div class="dialog-footer flex align-center justify-between">
                <el-checkbox v-model="active" label="下次不再显示" size="small" fill="#6C56F6" @change="changeCheckbox" />
                <div>
                    <el-button color="#999999" plain @click="bindCancel">取消</el-button>
                    <el-button color="#6C56F6" type="primary" @click="bindConfirm">确定</el-button>
                </div>
            </div>
        </template>
    </el-dialog>
</template>

<script >
    import { ElCheckbox, ElDialog, ElButton, ElIcon } from "element-plus"
    import { Warning } from "@element-plus/icons-vue"
    import store from "@/store/index.js"
    export default {
        components:{
            ElCheckbox,
            ElDialog,
            ElButton,
            ElIcon,
            Warning
        },
        props: {
            title: String,
            message: String,
            onConfirm: Function,
            onCancel: Function
        },
        data () {
            return {
                showDialog: true
            }
        },
        computed: {
            active(){
                return store.state.showDialog
            }
        },
        methods: {
            bindCancel(){
                this.showDialog = false
                this.onConfirm()
            },
            bindConfirm(){
                this.showDialog = false
                this.onConfirm()
            },
            changeCheckbox(e){
                store.commit('SET_NEXT_NOT_SHOW_DIALOG', e)
            }
        }
    }

</script>

<style lang="scss" scoped>
    .container{
        display: flex;
        align-items: center;
        padding: 20px 10px;
        span{
            line-height: 14px;
            padding-left: 10px;
            font-size: 16px;
        }
    }
</style>
<style lang="scss">
    .dialog-footer{
        .el-checkbox__input.is-checked+.el-checkbox__label{
            color: #333333;
        }
        .el-checkbox__input.is-checked .el-checkbox__inner{
            background: #333333;
            border-color: #333333;
        }
    }

</style>