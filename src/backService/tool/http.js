const fs = require('fs');
const common = require('./common');
const rp = require('request-promise');

exports.host = 'https://api.fang-cun.net/'
exports.sync_host = 'https://steam.fang-cun.net/'

/**
 * get请求
 * @param route
 * @param query
 * @param headers
 * @returns {Promise<void>}
 */
exports.get = async function (route, query = {}, headers = {}) {
    query = common.empty(query) ? {} : query
    headers = common.empty(headers) ? {} : headers
    let data = {}
    if (!headers.hasOwnProperty('User-Agent')) {
        headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:93.0) Gecko/20100101 Firefox/93.0'
    }
    const query_params = []
    if (Object.keys(query).length > 0) {
        for (const key in query) {
            query_params.push(key + "=" + query[key])
        }
        route += '?' + query_params.join('&')
    }
    await rp({url: route, headers}).then(function (result) {
        data = JSON.parse(result)
    }).catch(function (err) {
        data = {message: '请求失败'}
    })
    return data
}

/**
 * post form 请求
 * @param route
 * @param body
 * @param headers
 * @returns {Promise<void>}
 */
exports.post = async function (route, body = {}, headers = {}) {
    headers = common.empty(headers) ? {} : headers
    let data = {}
    if (!headers.hasOwnProperty('User-Agent')) {
        headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:93.0) Gecko/20100101 Firefox/93.0'
    }
    if (!headers.hasOwnProperty('content-Type')) {
        headers['content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8'
    }
    await rp({url: route, method: 'POST', form: body, headers}).then(function (result) {
        data = JSON.parse(result)
    }).catch(function (err) {
        data = {message: '请求失败'}
        console.log(err)
    })
    return data
}

exports.upload = async function (route, path, headers = {}) {
    headers = common.empty(headers) ? {} : headers
    let data = {}
    if (!headers.hasOwnProperty('User-Agent')) {
        headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:93.0) Gecko/20100101 Firefox/93.0'
    }
    headers['Content-Type'] = 'multipart/form-data'
    await rp({
        url: route,
        method: 'POST',
        formData: {
            file: fs.createReadStream(path),   // 这里是关键
        },
        headers
    }).then(function (result) {
        data = JSON.parse(result)
    }).catch(function (err) {
        data = {message: '请求失败'}
        console.log(err)
    })
    return data
}

