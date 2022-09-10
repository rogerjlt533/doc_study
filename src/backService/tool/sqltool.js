const fs = require('fs');
const path = require('path')
const env = require('../config/env');
const longhash = require('longhash')

exports.encodeSql = async function () {
    const baseDir = env.dbDir() + '/../dbsource';
    const files = await fs.readdirSync(baseDir);
    if (files != null && files.length > 0) {
        for (const file of files) {
            let pathName = path.join(baseDir, file)
            let sql = await fs.readFileSync(pathName, 'utf-8').toString()
            await fs.writeFileSync(path.join(env.dbDir(), file), longhash.encode('fcdesktop', sql))
        }
    }
}