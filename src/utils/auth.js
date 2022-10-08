import { handleRestructureConfig } from '@/assets/js/restructureConfig'
import { JSEncrypt } from "jsencrypt";

handleRestructureConfig(1)

const Store = require('electron-store');

const electronStore = new Store();

const TOKEN_KEY = "token"
const USER_HASH = "user_hash"

export function getToken(){
    return electronStore.get(TOKEN_KEY)
    // return localStorage.getItem(TOKEN_KEY)
}
export function setToken(token){
    return electronStore.set(TOKEN_KEY, token)
    // return localStorage.setItem(TOKEN_KEY, token)
}
export function removeToken(){
    return electronStore.delete(TOKEN_KEY)
    // return localStorage.removeItem(TOKEN_KEY)
}

export function encryption(value){
    // 新建JSEncrypt对象
    let encryptor = new JSEncrypt();
    // 设置公钥
    encryptor.setPublicKey(process.env.VUE_APP_SECRET_KEY);
    // 加密数据
    return encryptor.encrypt(value);
}
