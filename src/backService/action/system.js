const http = require('../tool/http');

/**
 *
 * 获取最新版本号
 * @returns {Promise<{status_code: number, data: (*|((message?: any, ...optionalParams: any[]) => void)|Int8Array|Int16Array|Int32Array|Uint8Array|Uint16Array|Uint32Array|Uint8ClampedArray|Float32Array|Float64Array|DataView|ArrayBuffer), message: string}>}
 */
exports.version = async function () {
    const response = await http.get(http.host + 'api/desktop/version', {platform: 1})
    return {status_code: 200, message: 'success', data: response.data.info}
}