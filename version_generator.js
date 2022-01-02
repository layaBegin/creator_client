var fs = require('fs');
var path = require('path');
var crypto = require('crypto');

var timeStamp = (new Date()).valueOf();

var serverIP = 'http://wgc.tjcyyl.com/hot-update/';

var manifest = {
    packageUrl: serverIP + 'remote-assets/ver' + timeStamp + '/',
    remoteManifestUrl: serverIP + 'remote-assets/project.manifest',
    remoteVersionUrl: serverIP + 'remote-assets/version.manifest',
    version: '1.0.0',
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
            md5 = crypto.createHash('md5').update(fs.readFileSync(subpath, 'utf8')).digest('hex');
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

// Iterate res and src folder
readDir(path.join(src, 'src'), manifest.assets);
readDir(path.join(src, 'res'), manifest.assets);

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


/*
 * 复制目录中的所有文件包括子目录
 * @param{ String } 需要复制的目录
 * @param{ String } 复制到指定的目录
 */
stat = fs.stat;
var copy = function( src, dst ){
    // 读取目录中的所有文件/目录
    fs.readdir( src, function( err, paths ){
        if( err ){
            throw err;
        }

        paths.forEach(function( path ){
            var _src = src + '/' + path,
                _dst = dst + '/' + path,
                readable, writable;        
            stat( _src, function( err, st ){
                if( err ){
                    throw err;
                }
                // 判断是否为文件
                if( st.isFile() ){
                    // 创建读取流
                    readable = fs.createReadStream( _src );
                    // 创建写入流
                    writable = fs.createWriteStream( _dst );   
                    // 通过管道来传输流
                    readable.pipe( writable );
                }
                // 如果是目录则递归调用自身
                else if( st.isDirectory() ){
                    exists( _src, _dst, copy );
                }
            });
        });
    });
};
// 在复制目录前需要判断该目录是否存在，不存在需要先创建目录
var exists = function( src, dst, callback ){
    fs.exists( dst, function( exists ){
        // 已存在
        if( exists ){
            callback( src, dst );
        }
        // 不存在
        else{
            fs.mkdir( dst, function(){
                callback( src, dst );
            });
        }
    });
};

//创建更新文件存放目录
fs.exists(folderName, function (exists) {
    if (exists) {
    } else {
        fs.mkdirSync(folderName);
    }
})

//copy project.manifest, version.manifest
//文件流读取方法，适合大文件的读写(小文件也可以使用)
var files = {
    'assets/project.manifest': folderName + '/project.manifest',
    'assets/version.manifest': folderName + '/version.manifest'
}

var copyManifest = function () {
    var count = 0
    for (x in files) {
        var crstream = fs.createReadStream(x);
        crstream.pipe(fs.createWriteStream(files[x]));

        crstream.on('end', function() {
            count = count + 1;
            console.log(count + 'files copied')
        })
    }
}


//复制游戏资源文件到更新文件目录
var newVerPath = folderName + '/ver' + timeStamp;
fs.mkdir(newVerPath);
var newVerPath_src = newVerPath + '/src'
var newVerPath_res = newVerPath + '/res'
exists(src + 'src', newVerPath_src, copy );
exists(src + 'res', newVerPath_res, copy );
setTimeout(function () {
    copyManifest();
}, 2000);