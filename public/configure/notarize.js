const { notarize } = require('electron-notarize');

exports.default = async function notarizing(context) {
    const { electronPlatformName, appOutDir } = context;
    if (electronPlatformName !== 'darwin') {
        return;
    }

    const appName = context.packager.appInfo.productFilename;

    return await notarize({
        appBundleId: 'com.fangcun.desktop',
        appPath: `${appOutDir}/${appName}.app`,
        appleId: '820723128@qq.com',
        appleIdPassword: 'kxqm-ubvq-yalo-llph',
    });
}