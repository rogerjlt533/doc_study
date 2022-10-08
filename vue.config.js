const path = require("path"); //引入path模块
const resolve = (dir) => path.join(__dirname, dir)
const HtmlWebpackPlugin = require('html-webpack-plugin')

process.env.VUE_APP_VERSION = require('./package.json').version

module.exports = {
    publicPath: process.env.NODE_ENV === 'production' ? 'https://stor-assets.fang-cun.net/' : '/',
    transpileDependencies: ['/zeed-dom/'],
    pages: {
        index: {
            entry: 'src/main.js',
            filename: 'index.html',
            template: 'public/index.html'
        },
        fastRecord: {
            entry: 'src/fastRecord/main.js',
            filename: 'fastRecord.html',
            template: 'public/index.html'
        }
    },
    chainWebpack(config) {
        config.resolve.alias.set('@', resolve('./src'))
        config.resolve.alias.set('service', resolve('./src/backService'))
        const oneOfsMap = config.module.rule('scss').oneOfs.store
        oneOfsMap.forEach(item => {
            item
                .use('sass-resources-loader')
                .loader('sass-resources-loader')
                .options({
                    // 要公用的scss的路径
                    resources: './src/styles/styleVariable.scss'
                })
                .end()
        })
    },
    configureWebpack: config => {
        config.plugins.forEach((val) => {
            if (val instanceof HtmlWebpackPlugin) {
                val.options.inject = 'body'
            }
        })
    },
    pluginOptions: {
        electronBuilder:{
            afterSign: "public/configure/notarize.js",
            nodeIntegration: true,
            externals: ['better-sqlite3'],
            builderOptions: {
                productName: '方寸笔迹 Beta',
                appId: '820723128@qq.com',
                asar: false,
                publish: [
                    {
                        provider: "generic",
                        url: "https://stor-client.fang-cun.net/update/"
                    }
                ],
                mac: {
                    target: 'default',
                    icon: 'public/fangcun.icns',
                    identity: '457V4P8JCX',
                    hardenedRuntime: true,
                    gatekeeperAssess: false,
                    entitlements: 'public/configure/entitlements.mac.plist',
                    entitlementsInherit: 'public/configure/entitlements.mac.plist'
                },
                dmg: {
                    sign: false,
                    title: '方寸笔迹 Beta',
                    icon: 'public/fangcun.icns',
                },
                win: {
                    icon: 'public/fangcun_256.png',
                    // 加密方式
                    signingHashAlgorithms: [
                        "sha256",
                        "sha1"
                    ],
                    // 安装前是否验证可用更新的签名
                    verifyUpdateCodeSignature: false,
                    rfc3161TimeStampServer: "http://timestamp.digicert.com",
                    certificateFile: "public/configure/fangcun.pfx",
                    certificatePassword: "fangcun888"
                },
                extraResources: {
                    from: "./src/backService/db/",
                    to: "db"
                },
                nsis: {
                    oneClick: false, // 是否一键安装
                    allowElevation: true, // 允许请求提升，如果为false，则用户必须使用提升的权限重新启动安装程序。
                    installerIcon: "./public/fangcun.ico",// 安装图标
                    uninstallerIcon: "./public/fangcun.ico",//卸载图标
                    installerHeaderIcon: "./public/fangcun.ico", // 安装时头部图标
                    allowToChangeInstallationDirectory: true, // 允许修改安装目录
                    createDesktopShortcut: true, // 创建桌面图标
                    createStartMenuShortcut: true, // 创建开始菜单图标
                }
            }
        }
    },
    css:{
        loaderOptions:{
            less: {
                javascriptEnabled: true,
            }
        }
    },
    devServer: {
        port: 8090,
        hot: true,
        inline: false,
    }
}