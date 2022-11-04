const fs = require('fs');
const sqlite = require('./sqlitepool');
const syncsqlite = require('./syncsqlitetool');
const logsqlite = require('./logsqlitetool');
const oplogsqlite = require('./oplogsqlitetool');
const path = require('path')
const env = require('../config/env');
const sd = require('silly-datetime');
const longhash = require('longhash')

exports.run = async function () {
    await this.runMain()
    await this.runSync()
    await this.runLog()
    await this.runOpLog()
}

exports.runMain = async function () {
    let sql = `
            CREATE TABLE IF NOT EXISTS migrations (
              id INTEGER PRIMARY KEY,
              migration VARCHAR (255) NOT NULL,
              created_at DATETIME DEFAULT NULL
            )
            `;
    // await sqlite.run(sql);
    await sqlite.connect().exec(sql);
    const baseDir = env.dbDir();
    const files = await fs.readdirSync(baseDir);
    if (files !== null) {
        const save_time = sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')
        for (let index in files) {
            let fileName = files[index];
            const row = await sqlite.get("select * from migrations where migration=?", [fileName])
            if (row === undefined || row === null) {
                let pathName = path.join(baseDir, fileName);
                let sql = await fs.readFileSync(pathName, 'utf-8').toString();
                // console.log(longhash.decode('fcdesktop', sql))
                await sqlite.connect().exec(longhash.decode('fcdesktop', sql))
                await sqlite.insert("INSERT INTO migrations(migration, created_at) VALUES (?, ?)", [fileName, save_time])
            }
        }
    }
}

exports.runSync = async function () {
    let sql = `
            CREATE TABLE IF NOT EXISTS migrations (
              id INTEGER PRIMARY KEY,
              migration VARCHAR (255) NOT NULL,
              created_at DATETIME DEFAULT NULL
            )
            `;
    await syncsqlite.connect().exec(sql);
    const fileName = 'syncs.sql'
    sql = 'CREATE TABLE IF NOT EXISTS syncs (\n' +
        '  id INTEGER PRIMARY KEY,\n' +
        '  user_id INTEGER NOT NULL DEFAULT 0,\n' +
        '  sync_type INTEGER NOT NULL DEFAULT 0,\n' +
        '  sync_direct INTEGER NOT NULL DEFAULT 0,\n' +
        '  collection_id INTEGER NOT NULL DEFAULT 0,\n' +
        '  member_id INTEGER NOT NULL DEFAULT 0,\n' +
        '  member_name INTEGER NOT NULL DEFAULT 0,\n' +
        '  member_avatar VARCHAR (255) DEFAULT NULL,\n' +
        '  note_id INTEGER NOT NULL DEFAULT 0,\n' +
        '  tag_id INTEGER NOT NULL DEFAULT 0,\n' +
        '  image_id INTEGER NOT NULL DEFAULT 0,\n' +
        '  postil_id INTEGER NOT NULL DEFAULT 0,\n' +
        '  note_status INTEGER NOT NULL DEFAULT 0,\n' +
        '  status INTEGER NOT NULL DEFAULT 0,\n' +
        '  hash_code VARCHAR (255) DEFAULT NULL,\n' +
        '  deleted_time DATETIME DEFAULT NULL,\n' +
        '  created_at DATETIME DEFAULT NULL,\n' +
        '  updated_at DATETIME DEFAULT NULL\n' +
        ')';
    const row = await syncsqlite.get("select * from migrations where migration=?", [fileName])
    const save_time = sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')
    if (row === undefined || row === null) {
        // console.log(sql)
        await syncsqlite.connect().exec(sql)
        await syncsqlite.insert("INSERT INTO migrations(migration, created_at) VALUES (?, ?)", [fileName, save_time])
    }
}

exports.runLog = async function () {
    let sql = `
            CREATE TABLE IF NOT EXISTS migrations (
              id INTEGER PRIMARY KEY,
              migration VARCHAR (255) NOT NULL,
              created_at DATETIME DEFAULT NULL
            )
            `;
    await logsqlite.connect().exec(sql);
    const fileName = 'note_log.sql'
    sql = 'CREATE TABLE IF NOT EXISTS note_log (\n' +
        '  "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,\n' +
        '  "remote_id" integer NOT NULL DEFAULT 0 UNIQUE,\n' +
        '  "user_id" integer NOT NULL DEFAULT 0,\n' +
        '  "note_id" integer NOT NULL DEFAULT 0,\n' +
        '  "action" integer NOT NULL DEFAULT 0,\n' +
        '  "sync_at" DATETIME DEFAULT NULL,\n' +
        '  "created_at" DATETIME DEFAULT NULL,\n' +
        '  "updated_at" DATETIME DEFAULT NULL\n' +
        ')'
    const row = await logsqlite.get("select * from migrations where migration=?", [fileName])
    const save_time = sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')
    if (row === undefined || row === null) {
        // console.log(sql)
        await logsqlite.connect().exec(sql)
        await logsqlite.insert("INSERT INTO migrations(migration, created_at) VALUES (?, ?)", [fileName, save_time])
    }
}

exports.runOpLog = async function () {
    let sql = `
            CREATE TABLE IF NOT EXISTS migrations (
              id INTEGER PRIMARY KEY,
              migration VARCHAR (255) NOT NULL,
              created_at DATETIME DEFAULT NULL
            )
            `;
    await oplogsqlite.connect().exec(sql);
    const fileName = 'user_operate_log.sql'
    sql = 'CREATE TABLE IF NOT EXISTS user_operate_log(\n' +
        '  id INTEGER PRIMARY KEY,\n' +
        '  user_id INTEGER NOT NULL DEFAULT 0,\n' +
        '  obj_type INTEGER NOT NULL DEFAULT 0,\n' +
        '  opr_direct INTEGER NOT NULL DEFAULT 0,\n' +
        '  obj_id INTEGER NOT NULL DEFAULT 0,\n' +
        '  behavior VARCHAR (255) DEFAULT NULL,\n' +
        '  remote_id INTEGER NOT NULL DEFAULT 0,\n' +
        '  download_value TEXT DEFAULT NULL,\n' +
        '  upload_value TEXT DEFAULT NULL,\n' +
        '  result_value INTEGER NOT NULL DEFAULT 0,\n' +
        '  response_value TEXT DEFAULT NULL,\n' +
        '  is_upload INTEGER NOT NULL DEFAULT 0,\n' +
        '  created_at DATETIME DEFAULT NULL,\n' +
        '  updated_at DATETIME DEFAULT NULL\n' +
        ')';
    const row = await oplogsqlite.get("select * from migrations where migration=?", [fileName])
    const save_time = sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')
    if (row === undefined || row === null) {
        // console.log(sql)
        await oplogsqlite.connect().exec(sql)
        await oplogsqlite.insert("INSERT INTO migrations(migration, created_at) VALUES (?, ?)", [fileName, save_time])
    }
}