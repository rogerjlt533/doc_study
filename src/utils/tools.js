export function isArray (arr) {
    return Object.prototype.toString.call(arr) === "[object Array]"
}
export function isObject (obj) {
    const type = typeof obj;
    return obj != null && (type === 'object' || type === 'function');
}

// 格式化时间
export function timeFormat(timestamp = null, format = 'yyyy-mm-dd'){
    timestamp = parseInt(timestamp)
    if(!timestamp) {
        timestamp = Number(new Date())
    }
    // 判断时间戳是秒还是毫秒
    if(timestamp.toString().length === 10){
        timestamp *= 1000;
    }
    let date = new Date(timestamp);
    let ret;
    let option = {
        "yyyy": date.getFullYear().toString(),
        "mm": (date.getMonth() + 1).toString(),
        "dd": date.getDate().toString(),
        "hh": date.getHours().toString(),
        "MM": date.getMinutes().toString(),
        "ss": date.getSeconds().toString()
    };

    for(let key in option){
        ret = new RegExp("(" + key + ")").exec(format);
        if(ret){
            format = format.replace(ret[1],
                ret[1].length == 1 ? option[key] : option[key].padStart(ret[1].length, 0)
            )
        }
    }
    return format
}

// 删除HTML标签
export function removeHtmlTag(str, replace = '') {
    return str.replace(/<[^>]+>/g, replace);
}

// 深度克隆
export function deepClone (obj) {
    // 对常见的“非”值，直接返回原来值
    if([null, undefined, NaN, false].includes(obj)) return obj;
    // 原始类型直接返回
    if( !isObject(obj) ){
        return obj
    }
    let o = isArray(obj) ? [] : {};
    for(let i in obj){
        if(obj.hasOwnProperty(i)){
            o[i] = typeof obj[i] === "object" ? deepClone(obj[i]) : obj[i]
        }
    }
    return o
}

// 防抖函数
export function debounceFun(fn, delay = 500){
    let timer = null;
    return function (){
        if (timer) clearTimeout(timer);
        timer = setTimeout(fn, delay);
    }
}

// 轮询函数
export function handleLoopCall({ func, startCount = 1, endCount = 1, time = 5 }){
    setTimeout(() => {
        func()

        startCount += 1
        if(startCount < endCount){
            handleLoopCall({
                func,
                startCount,
                endCount,
                time
            })
        }
    }, time * 1000)
}

// 过滤特殊字符的标签
export function filterSpecialFont(data){
    const reg = /^#{2,}/g
    return data?.length ? data.filter((tag) => !reg.test(tag)) : []
}

// 去除标签外包围的 span
export function handleTagHtml(json, html, isEdit){
    if(html.indexOf(`data-type="mention"`) !== -1){
        loopData(isEdit, json.content)
    }
    return json
}
function loopData(isEdit, data){
    if(data && data.length){
        data.forEach((item,index) => {
            if(item.content && item.content.length){
                loopData(isEdit, item.content)
            }else{
                if(tagsInCenter(item, data, index)){
                    item.type = 'text'
                    item.text = `${item.attrs.id || '#'}`
                    delete item.attrs
                }else if(tagsInFirst(item, data, index)){
                    item.type = 'text'
                    item.text = `#${item.attrs.id}`
                    delete item.attrs
                }else if(tagsInLast(item, data, index)){
                    item.type = 'text'
                    item.text = `${item.attrs.id || '#'}`
                    delete item.attrs
                }else if(onlyTag(item, data, index)){
                    item.type = 'text'
                    item.text = `#${item.attrs.id}`
                    delete item.attrs
                }
            }
        })
    }
    return data
}

function tagsInCenter(item, data, index){
    return item.type === 'mention'
        && (data[index - 1]?.type === 'text'
            && data[index - 1]?.text === '/'
            && data[index + 1]?.type === 'text'
            && data[index + 1]?.text === '/')
}
function tagsInLast(item, data, index){
    return item.type === 'mention'
        && (data[index - 1]
            && data[index - 1].type === 'text'
            && data[index - 1].text === '/'
            && (!data[index + 1]
                || data[index + 1].text !== '/'))
}
function tagsInFirst(item, data, index){
    return item.type === 'mention'
        && (data[index + 1]?.type === 'text'
            && data[index + 1]?.text === '/')
}
function onlyTag(item, data, index){
    return item.type === 'mention'
        &&  ((!data[index - 1]
            || data[index - 1].text !== '/')
            && (!data[index + 1]
                || data[index + 1].text !== '/'))
}