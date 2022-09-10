const md5 = require('blueimp-md5')
const Hashids = require('hashids/cjs')
const sd = require('silly-datetime');
const NodeRSA = require('node-rsa');
const adm_zip = require("adm-zip")
const pinyin = require('tiny-pinyin')

let hashids = null, hashidDesktop = null;

exports.sd = sd
exports.login_key = '-----BEGIN PUBLIC KEY-----\n' +
    'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC1TAnbBvEduk/gGwehAcVxig97\n' +
    'ld4iZnPb3OO9QmmZ9CWWGOI+6wdzvI+o/OOKCG0Frlt4on2YrHnzTv4egtRgtsw/\n' +
    'uo9RX3MSrLmdqgEPpaDCSBjVZzwMm4ddpZ6bilkKKiRNMroCy773sFerOiXAyvv5\n' +
    'RlSecpFWnSM/dlmpxwIDAQAB\n' +
    '-----END PUBLIC KEY-----\n'

exports.empty = function (value) {
    if (value === undefined || value === null || value === '' || value === 0) {
        return true
    }
    return false
}

exports.md5 = function (value) {
    return md5(value)
}

exports.randomcode = function (n) {
    let chars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
        'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
        'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'
    ];
    let result = '';
    for (let i = 0; i < n; i++) {
        let id = Math.ceil(Math.random() * chars.length);
        result = result + '' + chars[id];
    }
    return result;
}

exports.encode = function (...values) {
    if (this.empty(this.hashids)) {
        const salt = 'base64:EbLMdFqxjFFfcPtxk/Qb0p/vOaN0fhK3gzthH6AZsS0=';
        this.hashids = new Hashids(salt, 4);
    }
    return this.hashids.encode(values);
}

exports.decode = function (code) {
    if (this.empty(this.hashids)) {
        const salt = 'base64:EbLMdFqxjFFfcPtxk/Qb0p/vOaN0fhK3gzthH6AZsS0=';
        this.hashids = new Hashids(salt, 4);
    }
    return this.hashids.decode(code)[0];
}

exports.encodeDesktop = function (...values) {
    if (this.empty(this.hashidDesktop)) {
        const salt = 'Thought_Note_Desktop';
        this.hashidDesktop = new Hashids(salt, 4);
    }
    return this.hashidDesktop.encode(values);
}

exports.decodeDesktop = function (code) {
    if (this.empty(this.hashidDesktop)) {
        const salt = 'Thought_Note_Desktop';
        this.hashidDesktop = new Hashids(salt, 4);
    }
    return this.hashidDesktop.decode(code)[0];
}

exports.getPageOffset = function (page, size) {
    page = page > 0 ? page : 1
    size = size > 0 ? size : 20
    return (page - 1) * size
}

exports.list_column = function (arr, key) {
    const list = []
    for (const item of arr) {
        list.push(item[key])
    }
    return list
}

exports.array_sum = function (arr, key) {
    let total = 0;
    total = arr.reduce(function (total, currentValue, currentIndex, arr){
        return currentValue[key] ? (total + currentValue[key]) : total;
    }, 0);
    return total;
}

exports.array_map = function (arr, key, column) {
    let result = {}
    arr.forEach(function (item) {
        result[item[key]] = item[column]
    })
    return result
}

exports.array_set = function (arr, key, value) {
    const keys = key.split('.')
    for (const index in keys) {
        if (index < keys.length - 1) {
            arr = arr[keys[index]]
        } else {
            arr[keys[index]] = value
        }
    }
}

exports.array_exists = function (arr, key) {
    if (this.empty(arr)) {
        return false
    }
    const keys = key.split('.')
    let temp = arr
    for (const index in keys) {
        if (this.empty(temp)) {
            return false
        }
        if (this.empty(temp[keys[index]])) {
            return false
        }
        temp = temp[keys[index]]
    }
    return true
}

exports.publicEncrypt = function (key, content) {
    const rsa = new NodeRSA(key)
    rsa.setOptions({encryptionScheme: 'pkcs1'});
    return rsa.encrypt(content, 'base64', 'utf8')
}

/**
 * 比较时间大小
 * @param source
 * @param compare
 * @returns {number}
 */
exports.compareTime = function (source, compare) {
    const sourceTime = new Date(source), compareTime = new Date(compare)
    if (sourceTime.getTime() > compareTime.getTime()) {
        return 1
    } else if (sourceTime.getTime() < compareTime.getTime()) {
        return -1
    }
    return 0
}

/**
 * 解压文件
 * @param source
 * @param dest
 * @returns {*|void}
 */
exports.unzip = function (source, dest) {
    const unzip = new adm_zip(source);
    return unzip.extractAllTo(dest, true);
}

/**
 * 处理内容标签的空格，无空格补空格
 * @param value
 * @returns {*}
 */
exports.processTagSpace = function (value) {
    const contents = value.match(/#(\S+?)?<\/(\S+?>)/g)
    if (this.empty(contents)) {
        return value
    }
    for (const content of contents) {
        let origin_content = content
        const tags = content.match(/<\/(\S+?>)/g)
        for (let tag of tags) {
            const regex = new RegExp(tag.replace(/\\/g, '\\\\'), 'g')
            origin_content = origin_content.replace(regex, ' ' + tag)
        }
        const regex = new RegExp(content, 'g')
        value = value.replace(regex, origin_content)
    }
    return value
}

exports.unlink = function (file) {
    fs.unlink(file, (err) => {
        if (err) {
            console.log(err?.message)
        } else {
            console.log('文件已删除')
        }
    })
}

exports.rmdir = function (file) {
    fs.rmdir(file,(err)=>{
        if (err) {
            console.log(err?.message)
        } else {
            console.log('目录已删除')
        }
    })
}

/**
 * 获取拼音
 * @param value
 * @param space
 * @returns {*}
 */
exports.tinypinyin = function (value, space = '/') {
    if (pinyin.isSupported()) {
        return pinyin.convertToPinyin(value, space, true)
    }
    return ''
}

/**
 * 获取声母
 * @param value
 * @param space
 * @returns {string}
 */
exports.initial = function (value, space = '/') {
    const words = this.tinypinyin(value, space).split('')
    if (words.length > 0) {
        return words[0].toLocaleUpperCase()
    }
    return ''
}