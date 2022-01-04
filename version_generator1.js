var fs = require('fs');
var path = require('path');
var crypto = require('crypto');



var bigVersion = '1';                                                                    // 大版本号
var smallVersion = '0';                                                                     // 小版本号
var domain = 'http://18.163.83.106'                                                  // 热更域名
var channel = 'normal'                                                                      // 渠道（appstore或者normal）
var brand = 'cuangshi'// 厅主
var subPackage = "Main"
var version = `${bigVersion}.${smallVersion}`;                                              // 版本号（总版本.不兼容版本.兼容版本）

var commonUrl = `${domain}/hotUpdate/${channel}/${brand}/`

var manifest = {
    packageUrl: commonUrl,
    remoteManifestUrl: `${commonUrl}/${subPackage}/project.manifest`,
    remoteVersionUrl: `${commonUrl}/${subPackage}/version.manifest`,
    version: version,
    assets: {},

    searchPaths: []
};

var dest = './assets/';
var src = './build/jsb-default/';
var folderName = '../WebServer/public/hot-update/remote-assets'

// Parse arguments
var i = 2;
while ( i < process.argv.length) {
    var arg = process.argv[i];

    switch (arg) {
        case '--url' :
        case '-u' :
            var url = process.argv[i+1];
            manifest.packageUrl = url;
            manifest.remoteManifestUrl = url + 'project.manifest';
            manifest.remoteVersionUrl = url + 'version.manifest';
            i += 2;
            break;
        case '--version' :
        case '-v' :
            manifest.version = process.argv[i+1];
            i += 2;
            break;
        case '--src' :
        case '-s' :
            src = process.argv[i+1];
            i += 2;
            break;
        case '--dest' :
        case '-d' :
            dest = process.argv[i+1];
            i += 2;
            break;
        default :
            i++;
            break;
    }
}


function readDir (dir, obj) {
    var stat = fs.statSync(dir);
    if (!stat.isDirectory()) {
        return;
    }
    var subpaths = fs.readdirSync(dir), subpath, size, md5, compressed, relative;
    for (var i = 0; i < subpaths.length; ++i) {
        if (subpaths[i][0] === '.') {
            continue;
        }
        subpath = path.join(dir, subpaths[i]);
        stat = fs.statSync(subpath);
        if (stat.isDirectory()) {
            readDir(subpath, obj);
        }
        else if (stat.isFile()) {
            // Size in Bytes
            size = stat['size'];
            md5 = crypto.createHash('md5').update(fs.readFileSync(subpath)).digest('hex');
            compressed = path.extname(subpath).toLowerCase() === '.zip';

            relative = path.relative(src, subpath);
            relative = relative.replace(/\\/g, '/');
            relative = encodeURI(relative);
            obj[relative] = {
                'size' : size,
                'md5' : md5
            };
            if (compressed) {
                obj[relative].compressed = true;
            }
        }
    }
}

var mkdirSync = function (path) {
    try {
        fs.mkdirSync(path);
    } catch(e) {
        if ( e.code != 'EEXIST' ) throw e;
    }
}

// Iterate assets and src folder
readDir(path.join(src, 'src'), manifest.assets);
readDir(path.join(src, 'assets'), manifest.assets);
//readDir(path.join(src, 'jsb-adapter'), manifest.assets);

var destManifest = path.join(dest, 'project.manifest');
var destVersion = path.join(dest, 'version.manifest');

mkdirSync(dest);

fs.writeFile(destManifest, JSON.stringify(manifest), (err) => {
    if (err) throw err;
    console.log('Manifest successfully generated');
});

delete manifest.assets;
delete manifest.searchPaths;
fs.writeFile(destVersion, JSON.stringify(manifest), (err) => {
    if (err) throw err;
    console.log('Version successfully generated');
});
