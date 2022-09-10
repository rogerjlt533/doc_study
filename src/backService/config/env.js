const fs = require('fs');
const path = require('path');
const remote = require("@electron/remote");

exports.SOURCE_DOMAIN = "https://stor.fang-cun.net"

/**
 * 获取环境变量
 * @returns {Promise<{}>}
 */
exports.options = function () {
    let envPath = path.join(__dirname, '../.env');
    if (!fs.existsSync(envPath)) {
        return {};
    }
    const chunks = fs.readFileSync(envPath).toString().replace(/ /g, '').replace('\r\n', '\n').split('\n').filter(Boolean);
    const options = {};
    for (let i = 0; i < chunks.length; i++) {
        const items = chunks[i].split('=');
        if (items.length === 2) {
            options[items[0]] = items[1];
        } else {
            options[items[0]] = ''
        }
    }
    return options;
}

exports.dataDir = function () {
    const options = this.options();
    let dirname = '';
    if (options['data_dir'] === '' || options['data_dir'] === null || options['data_dir'] === undefined) {
        dirname = path.join(__dirname, '../data');
    } else {
        dirname = options['data_dir'];
    }
    if (!fs.existsSync(dirname)) {
        fs.mkdirSync(dirname, 777);
    }
    return dirname;
}

exports.binDir = function () {
    const dirname = remote.app.getPath("userData")
    return dirname;
}

exports.dbDir = function () {
    const dirname = process.env.NODE_ENV === 'production' ? path.join(__dirname, '../db') : 'src/backService/db'
    if (!fs.existsSync(dirname)) {
        fs.mkdirSync(dirname, 777);
    }
    return dirname;
}

exports.resourceDir = function () {
    const dirname = ''
    if (!fs.existsSync(dirname)) {
        fs.mkdirSync(dirname, 777);
    }
    return dirname;
}