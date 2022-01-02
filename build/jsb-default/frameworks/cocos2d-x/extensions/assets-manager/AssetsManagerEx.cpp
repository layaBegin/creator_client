/****************************************************************************
 Copyright (c) 2014 cocos2d-x.org
 Copyright (c) 2015-2016 Chukong Technologies Inc.
 Copyright (c) 2017-2018 Xiamen Yaji Software Co., Ltd.

 http://www.cocos2d-x.org

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 ****************************************************************************/
#include "AssetsManagerEx.h"
#include "base/ccUTF8.h"
#include "CCAsyncTaskPool.h"

#include <stdio.h>
#include <errno.h>

#ifdef MINIZIP_FROM_SYSTEM
#include <minizip/unzip.h>
#else // from our embedded sources
#include "unzip/unzip.h"
#endif

NS_CC_EXT_BEGIN

#define VERSION_FILENAME "version.manifest"
#define TEMP_MANIFEST_FILENAME "project.manifest.temp"
#define TEMP_PACKAGE_SUFFIX "_temp"
#define MANIFEST_FILENAME "project.manifest"

#define BUFFER_SIZE 8192
#define MAX_FILENAME 512

#define DEFAULT_CONNECTION_TIMEOUT 45

#define SAVE_POINT_INTERVAL 0.1

const std::string AssetsManagerEx::VERSION_ID = "@version";
const std::string AssetsManagerEx::MANIFEST_ID = "@manifest";

static ThreadPool *copyFileThreadPool = ThreadPool::newCachedThreadPool(1, 2, 5, 2, 2);
// Implementation of AssetsManagerEx

AssetsManagerEx::AssetsManagerEx(const std::string &manifestUrl, const std::string &storagePath)
    : _updateState(State::UNINITED), _assets(nullptr), _storagePath(""), _tempVersionPath(""), _cacheManifestPath(""), _tempManifestPath(""), _localManifest(nullptr), _tempManifest(nullptr), _remoteManifest(nullptr), _updateEntry(UpdateEntry::NONE), _percent(0), _percentByFile(0), _totalSize(0), _sizeCollected(0), _totalDownloaded(0), _totalToDownload(0), _totalWaitToDownload(0), _nextSavePoint(0.0), _downloadResumed(false), _maxConcurrentTask(32), _currConcurrentTask(0), _verifyCallback(nullptr), _inited(false)
{
    init(manifestUrl, storagePath);
}

AssetsManagerEx::AssetsManagerEx(const std::string &manifestUrl, const std::string &storagePath, const VersionCompareHandle &handle)
    : _updateState(State::UNINITED), _assets(nullptr), _storagePath(""), _tempVersionPath(""), _cacheManifestPath(""), _tempManifestPath(""), _localManifest(nullptr), _tempManifest(nullptr), _remoteManifest(nullptr), _updateEntry(UpdateEntry::NONE), _percent(0), _percentByFile(0), _totalSize(0), _sizeCollected(0), _totalDownloaded(0), _totalToDownload(0), _totalWaitToDownload(0), _nextSavePoint(0.0), _downloadResumed(false), _maxConcurrentTask(32), _currConcurrentTask(0), _versionCompareHandle(handle), _verifyCallback(nullptr), _eventCallback(nullptr), _inited(false)
{
    init(manifestUrl, storagePath);
}

void AssetsManagerEx::init(const std::string &manifestUrl, const std::string &storagePath)
{
    // Init variables
    std::string pointer = StringUtils::format("%p", this);
    _eventName = "__cc_assets_manager_" + pointer;
    _fileUtils = FileUtils::getInstance();

    network::DownloaderHints hints =
        {
            static_cast<uint32_t>(_maxConcurrentTask),
            DEFAULT_CONNECTION_TIMEOUT,
            ".tmp"};
    _downloader = std::shared_ptr<network::Downloader>(new network::Downloader(hints));
    _downloader->onTaskError = std::bind(&AssetsManagerEx::onError, this, std::placeholders::_1, std::placeholders::_2, std::placeholders::_3, std::placeholders::_4);
    _downloader->onTaskProgress = [this](const network::DownloadTask &task,
                                         int64_t /*bytesReceived*/,
                                         int64_t totalBytesReceived,
                                         int64_t totalBytesExpected) {
        this->onProgress(totalBytesExpected, totalBytesReceived, task.requestURL, task.identifier);
    };
    _downloader->onFileTaskSuccess = [this](const network::DownloadTask &task) {
        this->onSuccess(task.requestURL, task.storagePath, task.identifier);
    };
    setStoragePath(storagePath);
    _tempVersionPath = _tempStoragePath + VERSION_FILENAME;
    _cacheManifestPath = _storagePath + MANIFEST_FILENAME;
    _tempManifestPath = _tempStoragePath + TEMP_MANIFEST_FILENAME;

    if (manifestUrl.size() > 0)
    {
        loadLocalManifest(manifestUrl);
    }
}

AssetsManagerEx::~AssetsManagerEx()
{
    _downloader->onTaskError = (nullptr);
    _downloader->onFileTaskSuccess = (nullptr);
    _downloader->onTaskProgress = (nullptr);
    CC_SAFE_RELEASE(_localManifest);
    // _tempManifest could share a ptr with _remoteManifest or _localManifest
    if (_tempManifest != _localManifest && _tempManifest != _remoteManifest)
        CC_SAFE_RELEASE(_tempManifest);
    CC_SAFE_RELEASE(_remoteManifest);
}

AssetsManagerEx *AssetsManagerEx::create(const std::string &manifestUrl, const std::string &storagePath)
{
    AssetsManagerEx *ret = new (std::nothrow) AssetsManagerEx(manifestUrl, storagePath);
    if (ret)
    {
        ret->autorelease();
    }
    else
    {
        CC_SAFE_DELETE(ret);
    }
    return ret;
}

void AssetsManagerEx::initManifests()
{
    _inited = true;
    // Init and load temporary manifest
    _tempManifest = new (std::nothrow) Manifest();
    if (_tempManifest)
    {
        _tempManifest->parseFile(_tempManifestPath);
        // Previous update is interrupted
        if (_fileUtils->isFileExist(_tempManifestPath))
        {
            // Manifest parse failed, remove all temp files
            if (!_tempManifest->isLoaded())
            {
                _fileUtils->removeDirectory(_tempStoragePath);
                CC_SAFE_RELEASE(_tempManifest);
                _tempManifest = nullptr;
            }
        }
    }
    else
    {
        _inited = false;
    }

    // Init remote manifest for future usage
    _remoteManifest = new (std::nothrow) Manifest();
    if (!_remoteManifest)
    {
        _inited = false;
    }

    if (!_inited)
    {
        CC_SAFE_RELEASE(_localManifest);
        CC_SAFE_RELEASE(_tempManifest);
        CC_SAFE_RELEASE(_remoteManifest);
        _localManifest = nullptr;
        _tempManifest = nullptr;
        _remoteManifest = nullptr;
    }
}

void AssetsManagerEx::prepareLocalManifest()
{
    // An alias to assets
    _assets = &(_localManifest->getAssets());

    // Add search paths
    _localManifest->prependSearchPaths();
}

bool AssetsManagerEx::loadLocalManifest(Manifest *localManifest, const std::string &storagePath)
{
    if (_updateState > State::UNINITED)
    {
        return false;
    }
    if (!localManifest || !localManifest->isLoaded())
    {
        return false;
    }
    _inited = true;
    // Reset storage path
    if (storagePath.size() > 0)
    {
        setStoragePath(storagePath);
        _tempVersionPath = _tempStoragePath + VERSION_FILENAME;
        _cacheManifestPath = _storagePath + MANIFEST_FILENAME;
        _tempManifestPath = _tempStoragePath + TEMP_MANIFEST_FILENAME;
    }
    // Release existing local manifest
    if (_localManifest)
    {
        CC_SAFE_RELEASE(_localManifest);
    }
    _localManifest = localManifest;
    _localManifest->retain();
    // Find the cached manifest file
    Manifest *cachedManifest = nullptr;
    if (_fileUtils->isFileExist(_cacheManifestPath))
    {
        cachedManifest = new (std::nothrow) Manifest();
        if (cachedManifest)
        {
            cachedManifest->parseFile(_cacheManifestPath);
            if (!cachedManifest->isLoaded())
            {
                _fileUtils->removeFile(_cacheManifestPath);
                CC_SAFE_RELEASE(cachedManifest);
                cachedManifest = nullptr;
            }
        }
    }
    // Compare with cached manifest to determine which one to use
    if (cachedManifest)
    {
        bool localNewer = _localManifest->versionGreater(cachedManifest, _versionCompareHandle);
        if (localNewer)
        {
            // Recreate storage, to empty the content
            _fileUtils->removeDirectory(_storagePath);
            _fileUtils->createDirectory(_storagePath);
            CC_SAFE_RELEASE(cachedManifest);
        }
        else
        {
            CC_SAFE_RELEASE(_localManifest);
            _localManifest = cachedManifest;
        }
    }
    prepareLocalManifest();

    // Init temp manifest and remote manifest
    initManifests();

    if (!_inited)
    {
        return false;
    }
    else
    {
        _updateState = State::UNCHECKED;
        return true;
    }
}

bool AssetsManagerEx::loadLocalManifest(const std::string &manifestUrl)
{
    if (manifestUrl.size() == 0)
    {
        return false;
    }
    if (_updateState > State::UNINITED)
    {
        return false;
    }
    _manifestUrl = manifestUrl;
    // Init and load local manifest
    _localManifest = new (std::nothrow) Manifest();
    if (!_localManifest)
    {
        return false;
    }
    Manifest *cachedManifest = nullptr;
    // Find the cached manifest file
    if (_fileUtils->isFileExist(_cacheManifestPath))
    {
        cachedManifest = new (std::nothrow) Manifest();
        if (cachedManifest)
        {
            cachedManifest->parseFile(_cacheManifestPath);
            if (!cachedManifest->isLoaded())
            {
                _fileUtils->removeFile(_cacheManifestPath);
                CC_SAFE_RELEASE(cachedManifest);
                cachedManifest = nullptr;
            }
        }
    }

    // Ensure no search path of cached manifest is used to load this manifest
    std::vector<std::string> searchPaths = _fileUtils->getSearchPaths();
    if (cachedManifest)
    {
        std::vector<std::string> cacheSearchPaths = cachedManifest->getSearchPaths();
        std::vector<std::string> trimmedPaths = searchPaths;
        for (auto path : cacheSearchPaths)
        {
            const auto pos = std::find(trimmedPaths.begin(), trimmedPaths.end(), path);
            if (pos != trimmedPaths.end())
            {
                trimmedPaths.erase(pos);
            }
        }
        _fileUtils->setSearchPaths(trimmedPaths);
    }
    // Load local manifest in app package
    _localManifest->parseFile(_manifestUrl);
    if (cachedManifest)
    {
        // Restore search paths
        _fileUtils->setSearchPaths(searchPaths);
    }
    if (_localManifest->isLoaded())
    {
        // Compare with cached manifest to determine which one to use
        if (cachedManifest)
        {
            bool localNewer = _localManifest->versionGreater(cachedManifest, _versionCompareHandle);
            if (localNewer)
            {
                // Recreate storage, to empty the content
                _fileUtils->removeDirectory(_storagePath);
                _fileUtils->createDirectory(_storagePath);
                CC_SAFE_RELEASE(cachedManifest);
            }
            else
            {
                CC_SAFE_RELEASE(_localManifest);
                _localManifest = cachedManifest;
            }
        }
        prepareLocalManifest();
    }

    // Fail to load local manifest
    if (!_localManifest->isLoaded())
    {
        CCLOG("AssetsManagerEx : No local manifest file found error.\n");
        dispatchUpdateEvent(EventAssetsManagerEx::EventCode::ERROR_NO_LOCAL_MANIFEST);
        return false;
    }
    initManifests();
    _updateState = State::UNCHECKED;
    return true;
}

bool AssetsManagerEx::loadRemoteManifest(Manifest *remoteManifest)
{
    if (!_inited || _updateState > State::UNCHECKED)
    {
        return false;
    }
    if (!remoteManifest || !remoteManifest->isLoaded())
    {
        return false;
    }
    // Release existing remote manifest
    if (_remoteManifest)
    {
        CC_SAFE_RELEASE(_remoteManifest);
    }
    _remoteManifest = remoteManifest;
    _remoteManifest->retain();
    // Compare manifest version and set state
    if (_localManifest->versionGreaterOrEquals(_remoteManifest, _versionCompareHandle))
    {
        _updateState = State::UP_TO_DATE;
        _fileUtils->removeDirectory(_tempStoragePath);
        dispatchUpdateEvent(EventAssetsManagerEx::EventCode::ALREADY_UP_TO_DATE);
    }
    else
    {
        _updateState = State::NEED_UPDATE;
        dispatchUpdateEvent(EventAssetsManagerEx::EventCode::NEW_VERSION_FOUND);
    }
    return true;
}

std::string AssetsManagerEx::basename(const std::string &path) const
{
    size_t found = path.find_last_of("/\\");

    if (std::string::npos != found)
    {
        return path.substr(0, found);
    }
    else
    {
        return path;
    }
}

std::string AssetsManagerEx::get(const std::string &key) const
{
    auto it = _assets->find(key);
    if (it != _assets->cend())
    {
        return _storagePath + it->second.path;
    }
    else
        return "";
}

const Manifest *AssetsManagerEx::getLocalManifest() const
{
    return _localManifest;
}

const Manifest *AssetsManagerEx::getRemoteManifest() const
{
    return _remoteManifest;
}

const std::string &AssetsManagerEx::getStoragePath() const
{
    return _storagePath;
}

void AssetsManagerEx::setStoragePath(const std::string &storagePath)
{
    _storagePath = storagePath;
    adjustPath(_storagePath);
    _fileUtils->createDirectory(_storagePath);

    _tempStoragePath = _storagePath;
    _tempStoragePath.insert(_storagePath.size() - 1, TEMP_PACKAGE_SUFFIX);
    _fileUtils->createDirectory(_tempStoragePath);
}

void AssetsManagerEx::adjustPath(std::string &path)
{
    if (path.size() > 0 && path[path.size() - 1] != '/')
    {
        path.append("/");
    }
}

bool AssetsManagerEx::decompress(const std::string &zip)
{
    // Find root path for zip file
    size_t pos = zip.find_last_of("/\\");
    if (pos == std::string::npos)
    {
        CCLOG("AssetsManagerEx : no root path specified for zip file %s\n", zip.c_str());
        return false;
    }
    const std::string rootPath = zip.substr(0, pos + 1);

    // Open the zip file
    unzFile zipfile = unzOpen(FileUtils::getInstance()->getSuitableFOpen(zip).c_str());
    if (!zipfile)
    {
        CCLOG("AssetsManagerEx : can not open downloaded zip file %s\n", zip.c_str());
        return false;
    }

    // Get info about the zip file
    unz_global_info global_info;
    if (unzGetGlobalInfo(zipfile, &global_info) != UNZ_OK)
    {
        CCLOG("AssetsManagerEx : can not read file global info of %s\n", zip.c_str());
        unzClose(zipfile);
        return false;
    }

    // Buffer to hold data read from the zip file
    char readBuffer[BUFFER_SIZE];
    // Loop to extract all files.
    uLong i;
    for (i = 0; i < global_info.number_entry; ++i)
    {
        // Get info about current file.
        unz_file_info fileInfo;
        char fileName[MAX_FILENAME];
        if (unzGetCurrentFileInfo(zipfile,
                                  &fileInfo,
                                  fileName,
                                  MAX_FILENAME,
                                  NULL,
                                  0,
                                  NULL,
                                  0) != UNZ_OK)
        {
            CCLOG("AssetsManagerEx : can not read compressed file info\n");
            unzClose(zipfile);
            return false;
        }
        const std::string fullPath = rootPath + fileName;

        // Check if this entry is a directory or a file.
        const size_t filenameLength = strlen(fileName);
        if (fileName[filenameLength - 1] == '/')
        {
            //There are not directory entry in some case.
            //So we need to create directory when decompressing file entry
            if (!_fileUtils->createDirectory(basename(fullPath)))
            {
                // Failed to create directory
                CCLOG("AssetsManagerEx : can not create directory %s\n", fullPath.c_str());
                unzClose(zipfile);
                return false;
            }
        }
        else
        {
            // Create all directories in advance to avoid issue
            std::string dir = basename(fullPath);
            if (!_fileUtils->isDirectoryExist(dir))
            {
                if (!_fileUtils->createDirectory(dir))
                {
                    // Failed to create directory
                    CCLOG("AssetsManagerEx : can not create directory %s\n", fullPath.c_str());
                    unzClose(zipfile);
                    return false;
                }
            }
            // Entry is a file, so extract it.
            // Open current file.
            if (unzOpenCurrentFile(zipfile) != UNZ_OK)
            {
                CCLOG("AssetsManagerEx : can not extract file %s\n", fileName);
                unzClose(zipfile);
                return false;
            }

            // Create a file to store current file.
            FILE *out = fopen(FileUtils::getInstance()->getSuitableFOpen(fullPath).c_str(), "wb");
            if (!out)
            {
                CCLOG("AssetsManagerEx : can not create decompress destination file %s (errno: %d)\n", fullPath.c_str(), errno);
                unzCloseCurrentFile(zipfile);
                unzClose(zipfile);
                return false;
            }

            // Write current file content to destinate file.
            int error = UNZ_OK;
            do
            {
                error = unzReadCurrentFile(zipfile, readBuffer, BUFFER_SIZE);
                if (error < 0)
                {
                    CCLOG("AssetsManagerEx : can not read zip file %s, error code is %d\n", fileName, error);
                    fclose(out);
                    unzCloseCurrentFile(zipfile);
                    unzClose(zipfile);
                    return false;
                }

                if (error > 0)
                {
                    fwrite(readBuffer, error, 1, out);
                }
            } while (error > 0);

            fclose(out);
        }

        unzCloseCurrentFile(zipfile);

        // Goto next entry listed in the zip file.
        if ((i + 1) < global_info.number_entry)
        {
            if (unzGoToNextFile(zipfile) != UNZ_OK)
            {
                CCLOG("AssetsManagerEx : can not read next file for decompressing\n");
                unzClose(zipfile);
                return false;
            }
        }
    }

    unzClose(zipfile);
    return true;
}

void AssetsManagerEx::decompressDownloadedZip(const std::string &customId, const std::string &storagePath)
{
    struct AsyncData
    {
        std::string customId;
        std::string zipFile;
        bool succeed;
    };

    AsyncData *asyncData = new AsyncData;
    asyncData->customId = customId;
    asyncData->zipFile = storagePath;
    asyncData->succeed = false;

    std::function<void(void *)> decompressFinished = [this](void *param) {
        auto dataInner = reinterpret_cast<AsyncData *>(param);
        if (dataInner->succeed)
        {
            fileSuccess(dataInner->customId, dataInner->zipFile);
        }
        else
        {
            std::string errorMsg = "Unable to decompress file " + dataInner->zipFile;
            // Ensure zip file deletion (if decompress failure cause task thread exit anormally)
            _fileUtils->removeFile(dataInner->zipFile);
            dispatchUpdateEvent(EventAssetsManagerEx::EventCode::ERROR_DECOMPRESS, "", errorMsg);
            fileError(dataInner->customId, errorMsg);
        }
        delete dataInner;
    };
    AsyncTaskPool::getInstance()->enqueue(AsyncTaskPool::TaskType::TASK_OTHER, decompressFinished, (void *)asyncData, [this, asyncData]() {
        // Decompress all compressed files
        if (decompress(asyncData->zipFile))
        {
            asyncData->succeed = true;
        }
        _fileUtils->removeFile(asyncData->zipFile);
    });
}

void AssetsManagerEx::dispatchUpdateEvent(EventAssetsManagerEx::EventCode code, const std::string &assetId /* = ""*/, const std::string &message /* = ""*/, int curle_code /* = CURLE_OK*/, int curlm_code /* = CURLM_OK*/)
{
    switch (code)
    {
    case EventAssetsManagerEx::EventCode::ERROR_UPDATING:
    case EventAssetsManagerEx::EventCode::ERROR_PARSE_MANIFEST:
    case EventAssetsManagerEx::EventCode::ERROR_NO_LOCAL_MANIFEST:
    case EventAssetsManagerEx::EventCode::ERROR_DECOMPRESS:
    case EventAssetsManagerEx::EventCode::ERROR_DOWNLOAD_MANIFEST:
    case EventAssetsManagerEx::EventCode::UPDATE_FAILED:
    case EventAssetsManagerEx::EventCode::UPDATE_FINISHED:
    case EventAssetsManagerEx::EventCode::ALREADY_UP_TO_DATE:
        _updateEntry = UpdateEntry::NONE;
        break;
    case EventAssetsManagerEx::EventCode::UPDATE_PROGRESSION:
        break;
    case EventAssetsManagerEx::EventCode::ASSET_UPDATED:
        break;
    case EventAssetsManagerEx::EventCode::NEW_VERSION_FOUND:
        if (_updateEntry == UpdateEntry::CHECK_UPDATE)
        {
            _updateEntry = UpdateEntry::NONE;
        }
        break;
    default:
        break;
    }

    if (_eventCallback != nullptr)
    {
        EventAssetsManagerEx *event = new (std::nothrow) EventAssetsManagerEx(_eventName, this, code, assetId, message, curle_code, curlm_code);
        _eventCallback(event);
        event->release();
    }
}

AssetsManagerEx::State AssetsManagerEx::getState() const
{
    return _updateState;
}

void AssetsManagerEx::downloadVersion()
{
    if (_updateState > State::PREDOWNLOAD_VERSION)
        return;

    std::string versionUrl = _localManifest->getVersionFileUrl();

    if (versionUrl.size() > 0)
    {
        _updateState = State::DOWNLOADING_VERSION;
        // Download version file asynchronously
        _downloader->createDownloadFileTask(versionUrl, _tempVersionPath, VERSION_ID);
    }
    // No version file found
    else
    {
        CCLOG("AssetsManagerEx : No version file found, step skipped\n");
        _updateState = State::PREDOWNLOAD_MANIFEST;
        downloadManifest();
    }
}

void AssetsManagerEx::parseVersion()
{
    if (_updateState != State::VERSION_LOADED)
        return;

    _remoteManifest->parseVersion(_tempVersionPath);

    if (!_remoteManifest->isVersionLoaded())
    {
        CCLOG("AssetsManagerEx : Fail to parse version file, step skipped\n");
        _updateState = State::PREDOWNLOAD_MANIFEST;
        downloadManifest();
    }
    else
    {
        if (_localManifest->versionGreaterOrEquals(_remoteManifest, _versionCompareHandle))
        {
            _updateState = State::UP_TO_DATE;
            _fileUtils->removeDirectory(_tempStoragePath);
            dispatchUpdateEvent(EventAssetsManagerEx::EventCode::ALREADY_UP_TO_DATE);
        }
        else
        {
            _updateState = State::NEED_UPDATE;

            // Wait to update so continue the process
            if (_updateEntry == UpdateEntry::DO_UPDATE)
            {
                // dispatch after checking update entry because event dispatching may modify the update entry
                dispatchUpdateEvent(EventAssetsManagerEx::EventCode::NEW_VERSION_FOUND);
                _updateState = State::PREDOWNLOAD_MANIFEST;
                downloadManifest();
            }
            else
            {
                dispatchUpdateEvent(EventAssetsManagerEx::EventCode::NEW_VERSION_FOUND);
            }
        }
    }
}

void AssetsManagerEx::downloadManifest()
{
    if (_updateState != State::PREDOWNLOAD_MANIFEST)
        return;

    std::string manifestUrl = _localManifest->getManifestFileUrl();

    if (manifestUrl.size() > 0)
    {
        _updateState = State::DOWNLOADING_MANIFEST;
        // Download version file asynchronously
        _downloader->createDownloadFileTask(manifestUrl, _tempManifestPath, MANIFEST_ID);
    }
    // No manifest file found
    else
    {
        CCLOG("AssetsManagerEx : No manifest file found, check update failed\n");
        dispatchUpdateEvent(EventAssetsManagerEx::EventCode::ERROR_DOWNLOAD_MANIFEST);
        _updateState = State::UNCHECKED;
    }
}

void AssetsManagerEx::parseManifest()
{
    if (_updateState != State::MANIFEST_LOADED)
        return;

    _remoteManifest->parseFile(_tempManifestPath);

    if (!_remoteManifest->isLoaded())
    {
        CCLOG("AssetsManagerEx : Error parsing manifest file, %s", _tempManifestPath.c_str());
        dispatchUpdateEvent(EventAssetsManagerEx::EventCode::ERROR_PARSE_MANIFEST);
        _updateState = State::UNCHECKED;
    }
    else
    {
        if (_localManifest->versionGreaterOrEquals(_remoteManifest, _versionCompareHandle))
        {
            _updateState = State::UP_TO_DATE;
            _fileUtils->removeDirectory(_tempStoragePath);
            dispatchUpdateEvent(EventAssetsManagerEx::EventCode::ALREADY_UP_TO_DATE);
        }
        else
        {
            _updateState = State::NEED_UPDATE;
            dispatchUpdateEvent(EventAssetsManagerEx::EventCode::NEW_VERSION_FOUND);

            if (_updateEntry == UpdateEntry::DO_UPDATE)
            {
                startUpdate();
            }
        }
    }
}

void AssetsManagerEx::prepareUpdate()
{
    if (_updateState != State::NEED_UPDATE)
        return;

    // Clean up before update
    _failedUnits.clear();
    _downloadUnits.clear();
    _totalWaitToDownload = _totalToDownload = 0;
    _nextSavePoint = 0;
    _percent = _percentByFile = _sizeCollected = _totalDownloaded = _totalSize = 0;
    _downloadResumed = false;
    _downloadedSize.clear();
    _totalEnabled = false;

    // Temporary manifest exists, previously updating and equals to the remote version, resuming previous download
    if (_tempManifest && _tempManifest->isLoaded() && _tempManifest->isUpdating() && _tempManifest->versionEquals(_remoteManifest))
    {
        _tempManifest->saveToFile(_tempManifestPath);
        _tempManifest->genResumeAssetsList(&_downloadUnits);
        _totalWaitToDownload = _totalToDownload = (int)_downloadUnits.size();
        _downloadResumed = true;
    }
    else
    {
        // Temporary manifest exists, but can't be parsed or version doesn't equals remote manifest (out of date)
        if (_tempManifest)
        {
            // Remove all temp files
            _fileUtils->removeDirectory(_tempStoragePath);
            CC_SAFE_RELEASE(_tempManifest);
            // Recreate temp storage path and save remote manifest
            _fileUtils->createDirectory(_tempStoragePath);
            _remoteManifest->saveToFile(_tempManifestPath);
        }

        // Temporary manifest will be used to register the download states of each asset,
        // in this case, it equals remote manifest.
        _tempManifest = _remoteManifest;

        // Check difference between local manifest and remote manifest
        std::unordered_map<std::string, Manifest::AssetDiff> diff_map = _localManifest->genDiff(_remoteManifest);
        if (diff_map.size() == 0)
        {
            updateSucceed();
            return;
        }
        else
        {
            // Generate download units for all assets that need to be updated or added
            std::string packageUrl = _remoteManifest->getPackageUrl();
            // Preprocessing local files in previous version and creating download folders
            for (auto it = diff_map.begin(); it != diff_map.end(); ++it)
            {
                Manifest::AssetDiff diff = it->second;
                if (diff.type == Manifest::DiffType::DELETED)
                {
                    std::string exsitedPath = _storagePath + diff.asset.path;
                    _fileUtils->removeFile(exsitedPath);
                }
                else
                {
                    std::string path = diff.asset.path;
                    DownloadUnit unit;
                    unit.customId = it->first;
                    unit.srcUrl = packageUrl + path;
                    unit.storagePath = _tempStoragePath + path;
                    unit.size = diff.asset.size;
                    _downloadUnits.emplace(unit.customId, unit);
                    _tempManifest->setAssetDownloadState(it->first, Manifest::DownloadState::UNSTARTED);
                }
            }
            // Start updating the temp manifest
            _tempManifest->setUpdating(true);
            // Save current download manifest information for resuming
            _tempManifest->saveToFile(_tempManifestPath);

            _totalWaitToDownload = _totalToDownload = (int)_downloadUnits.size();
        }
    }
    _updateState = State::READY_TO_UPDATE;
}

void AssetsManagerEx::startUpdate()
{
    if (_updateState == State::NEED_UPDATE)
    {
        prepareUpdate();
    }
    if (_updateState == State::READY_TO_UPDATE)
    {
        _updateState = State::UPDATING;
        std::string msg;
        if (_downloadResumed)
        {
            msg = StringUtils::format("Resuming from previous unfinished update, %d files remains to be finished.", _totalToDownload);
        }
        else
        {
            msg = StringUtils::format("Start to update %d files from remote package.", _totalToDownload);
        }
        dispatchUpdateEvent(EventAssetsManagerEx::EventCode::UPDATE_PROGRESSION, "", msg);
        batchDownload();
    }
}
/**
 * 热更完成 拷贝文件改为在线程中执行
 */
void AssetsManagerEx::updateSucceed()
{
    copyFileThreadPool->pushTask([=](int tid) {
        // Set temp manifest's updating
        _tempManifest->setUpdating(false);
        // Every thing is correctly downloaded, do the following
        // 1. rename temporary manifest to valid manifest
        _fileUtils->renameFile(_tempStoragePath, TEMP_MANIFEST_FILENAME, MANIFEST_FILENAME);
        // 2. merge temporary storage path to storage path so that temporary version turns to cached version
        if (_fileUtils->isDirectoryExist(_tempStoragePath))
        {
            // Merging all files in temp storage path to storage path
            std::vector<std::string> files;
            _fileUtils->listFilesRecursively(_tempStoragePath, &files);
            int baseOffset = (int)_tempStoragePath.length();
            std::string relativePath, dstPath;
            for (std::vector<std::string>::iterator it = files.begin(); it != files.end(); ++it)
            {
                relativePath.assign((*it).substr(baseOffset));
                dstPath.assign(_storagePath + relativePath);
                // Create directory
                if (relativePath.back() == '/')
                {
                    _fileUtils->createDirectory(dstPath);
                }
                // Copy file
                else
                {
                    if (_fileUtils->isFileExist(dstPath))
                    {
                        _fileUtils->removeFile(dstPath);
                    }
                    _fileUtils->renameFile(*it, dstPath);
                }
            }
            // Remove temp storage path
            _fileUtils->removeDirectory(_tempStoragePath);
        }
        // 3. swap the localManifest
        CC_SAFE_RELEASE(_localManifest);
        _localManifest = _remoteManifest;
        _localManifest->setManifestRoot(_storagePath);
        _remoteManifest = nullptr;
        // 4. make local manifest take effect
        prepareLocalManifest();
        // 5. Set update state
        _updateState = State::UP_TO_DATE;
        // 6. Notify finished event
        Application::getInstance()->getScheduler()->performFunctionInCocosThread([&] {
            CCLOG("hotupdate finished");
            dispatchUpdateEvent(EventAssetsManagerEx::EventCode::UPDATE_FINISHED);
        });
    });
}

void AssetsManagerEx::checkUpdate()
{
    if (_updateEntry != UpdateEntry::NONE)
    {
        CCLOGERROR("AssetsManagerEx::checkUpdate, updateEntry isn't NONE");
        return;
    }

    if (!_inited)
    {
        CCLOG("AssetsManagerEx : Manifests uninited.\n");
        dispatchUpdateEvent(EventAssetsManagerEx::EventCode::ERROR_NO_LOCAL_MANIFEST);
        return;
    }
    if (!_localManifest->isLoaded())
    {
        CCLOG("AssetsManagerEx : No local manifest file found error.\n");
        dispatchUpdateEvent(EventAssetsManagerEx::EventCode::ERROR_NO_LOCAL_MANIFEST);
        return;
    }

    _updateEntry = UpdateEntry::CHECK_UPDATE;

    switch (_updateState)
    {
    case State::FAIL_TO_UPDATE:
        _updateState = State::UNCHECKED;
    case State::UNCHECKED:
    case State::PREDOWNLOAD_VERSION:
    {
        downloadVersion();
    }
    break;
    case State::UP_TO_DATE:
    {
        dispatchUpdateEvent(EventAssetsManagerEx::EventCode::ALREADY_UP_TO_DATE);
    }
    break;
    case State::NEED_UPDATE:
    {
        dispatchUpdateEvent(EventAssetsManagerEx::EventCode::NEW_VERSION_FOUND);
    }
    break;
    default:
        break;
    }
}

void AssetsManagerEx::update()
{
    if (_updateEntry != UpdateEntry::NONE)
    {
        CCLOGERROR("AssetsManagerEx::update, updateEntry isn't NONE");
        return;
    }

    if (!_inited)
    {
        CCLOG("AssetsManagerEx : Manifests uninited.\n");
        dispatchUpdateEvent(EventAssetsManagerEx::EventCode::ERROR_NO_LOCAL_MANIFEST);
        return;
    }
    if (!_localManifest->isLoaded())
    {
        CCLOG("AssetsManagerEx : No local manifest file found error.\n");
        dispatchUpdateEvent(EventAssetsManagerEx::EventCode::ERROR_NO_LOCAL_MANIFEST);
        return;
    }

    _updateEntry = UpdateEntry::DO_UPDATE;

    switch (_updateState)
    {
    case State::UNCHECKED:
    {
        _updateState = State::PREDOWNLOAD_VERSION;
    }
    case State::PREDOWNLOAD_VERSION:
    {
        downloadVersion();
    }
    break;
    case State::VERSION_LOADED:
    {
        parseVersion();
    }
    break;
    case State::PREDOWNLOAD_MANIFEST:
    {
        downloadManifest();
    }
    break;
    case State::MANIFEST_LOADED:
    {
        parseManifest();
    }
    break;
    case State::FAIL_TO_UPDATE:
    case State::NEED_UPDATE:
    {
        // Manifest not loaded yet
        if (!_remoteManifest->isLoaded())
        {
            _updateState = State::PREDOWNLOAD_MANIFEST;
            downloadManifest();
        }
        else
        {
            startUpdate();
        }
    }
    break;
    case State::UP_TO_DATE:
    case State::UPDATING:
    case State::UNZIPPING:
        _updateEntry = UpdateEntry::NONE;
        break;
    default:
        break;
    }
}

void AssetsManagerEx::updateAssets(const DownloadUnits &assets)
{
    if (!_inited)
    {
        CCLOG("AssetsManagerEx : Manifests uninited.\n");
        dispatchUpdateEvent(EventAssetsManagerEx::EventCode::ERROR_NO_LOCAL_MANIFEST);
        return;
    }

    if (_updateState != State::UPDATING && _localManifest->isLoaded() && _remoteManifest->isLoaded())
    {
        _updateState = State::UPDATING;
        _downloadUnits.clear();
        _downloadedSize.clear();
        _percent = _percentByFile = _sizeCollected = _totalDownloaded = _totalSize = 0;
        _totalWaitToDownload = _totalToDownload = (int)assets.size();
        _nextSavePoint = 0;
        _totalEnabled = false;
        if (_totalToDownload > 0)
        {
            _downloadUnits = assets;
            this->batchDownload();
        }
        else if (_totalToDownload == 0)
        {
            onDownloadUnitsFinished();
        }
    }
}

const DownloadUnits &AssetsManagerEx::getFailedAssets() const
{
    return _failedUnits;
}

void AssetsManagerEx::downloadFailedAssets()
{
    CCLOG("AssetsManagerEx : Start update %lu failed assets.\n", static_cast<unsigned long>(_failedUnits.size()));
    updateAssets(_failedUnits);
}

void AssetsManagerEx::fileError(const std::string &identifier, const std::string &errorStr, int errorCode, int errorCodeInternal)
{
    auto unitIt = _downloadUnits.find(identifier);
    // Found unit and add it to failed units
    if (unitIt != _downloadUnits.end())
    {
        _totalWaitToDownload--;

        DownloadUnit unit = unitIt->second;
        _failedUnits.emplace(unit.customId, unit);
    }
    dispatchUpdateEvent(EventAssetsManagerEx::EventCode::ERROR_UPDATING, identifier, errorStr, errorCode, errorCodeInternal);
    _tempManifest->setAssetDownloadState(identifier, Manifest::DownloadState::UNSTARTED);

    _currConcurrentTask = std::max(0, _currConcurrentTask - 1);
    queueDowload();
}

void AssetsManagerEx::fileSuccess(const std::string &customId, const std::string &storagePath)
{
    // Set download state to SUCCESSED
    _tempManifest->setAssetDownloadState(customId, Manifest::DownloadState::SUCCESSED);

    auto unitIt = _failedUnits.find(customId);
    // Found unit and delete it
    if (unitIt != _failedUnits.end())
    {
        // Remove from failed units list
        _failedUnits.erase(unitIt);
    }

    unitIt = _downloadUnits.find(customId);
    if (unitIt != _downloadUnits.end())
    {
        // Reduce count only when unit found in _downloadUnits
        _totalWaitToDownload--;

        _percentByFile = 100 * (float)(_totalToDownload - _totalWaitToDownload) / _totalToDownload;
        // Notify progression event
        dispatchUpdateEvent(EventAssetsManagerEx::EventCode::UPDATE_PROGRESSION, "");
    }
    // Notify asset updated event
    dispatchUpdateEvent(EventAssetsManagerEx::EventCode::ASSET_UPDATED, customId);

    _currConcurrentTask = std::max(0, _currConcurrentTask - 1);
    queueDowload();
}

void AssetsManagerEx::onError(const network::DownloadTask &task,
                              int errorCode,
                              int errorCodeInternal,
                              const std::string &errorStr)
{
    // Skip version error occurred
    if (task.identifier == VERSION_ID)
    {
        CCLOG("AssetsManagerEx : Fail to download version file, step skipped\n");
        _updateState = State::PREDOWNLOAD_MANIFEST;
        downloadManifest();
    }
    else if (task.identifier == MANIFEST_ID)
    {
        dispatchUpdateEvent(EventAssetsManagerEx::EventCode::ERROR_DOWNLOAD_MANIFEST, task.identifier, errorStr, errorCode, errorCodeInternal);
        _updateState = State::FAIL_TO_UPDATE;
    }
    else
    {
        fileError(task.identifier, errorStr, errorCode, errorCodeInternal);
    }
}

void AssetsManagerEx::onProgress(double total, double downloaded, const std::string & /*url*/, const std::string &customId)
{
    if (customId == VERSION_ID || customId == MANIFEST_ID)
    {
        _percent = 100 * downloaded / total;
        // Notify progression event
        dispatchUpdateEvent(EventAssetsManagerEx::EventCode::UPDATE_PROGRESSION, customId);
        return;
    }
    else
    {
        // Calcul total downloaded
        bool found = false;
        _totalDownloaded = 0;
        for (auto it = _downloadedSize.begin(); it != _downloadedSize.end(); ++it)
        {
            if (it->first == customId)
            {
                it->second = downloaded;
                found = true;
            }
            _totalDownloaded += it->second;
        }
        // Collect information if not registed
        if (!found)
        {
            // Set download state to DOWNLOADING, this will run only once in the download process
            _tempManifest->setAssetDownloadState(customId, Manifest::DownloadState::DOWNLOADING);
            // Register the download size information
            _downloadedSize.emplace(customId, downloaded);
            // Check download unit size existance, if not exist collect size in total size
            if (_downloadUnits[customId].size == 0)
            {
                _totalSize += total;
                _sizeCollected++;
                // All collected, enable total size
                if (_sizeCollected == _totalToDownload)
                {
                    _totalEnabled = true;
                }
            }
        }

        if (_totalEnabled && _updateState == State::UPDATING)
        {
            float currentPercent = 100 * _totalDownloaded / _totalSize;
            // Notify at integer level change
            if ((int)currentPercent != (int)_percent)
            {
                _percent = currentPercent;
                // Notify progression event
                dispatchUpdateEvent(EventAssetsManagerEx::EventCode::UPDATE_PROGRESSION, customId);
            }
        }
    }
}

void AssetsManagerEx::onSuccess(const std::string & /*srcUrl*/, const std::string &storagePath, const std::string &customId)
{
    if (customId == VERSION_ID)
    {
        _updateState = State::VERSION_LOADED;
        parseVersion();
    }
    else if (customId == MANIFEST_ID)
    {
        _updateState = State::MANIFEST_LOADED;
        parseManifest();
    }
    else
    {
        bool ok = true;
        auto &assets = _remoteManifest->getAssets();
        auto assetIt = assets.find(customId);
        if (assetIt != assets.end())
        {
            Manifest::Asset asset = assetIt->second;
            if (_verifyCallback != nullptr)
            {
                ok = _verifyCallback(storagePath, asset);
            }
        }

        if (ok)
        {
            bool compressed = assetIt != assets.end() ? assetIt->second.compressed : false;
            if (compressed)
            {
                decompressDownloadedZip(customId, storagePath);
            }
            else
            {
                fileSuccess(customId, storagePath);
            }
        }
        else
        {
            fileError(customId, "Asset file verification failed after downloaded");
        }
    }
}

void AssetsManagerEx::destroyDownloadedVersion()
{
    _fileUtils->removeDirectory(_storagePath);
    _fileUtils->removeDirectory(_tempStoragePath);
}

void AssetsManagerEx::batchDownload()
{
    _queue.clear();
    for (auto iter : _downloadUnits)
    {
        const DownloadUnit &unit = iter.second;
        if (unit.size > 0)
        {
            _totalSize += unit.size;
            _sizeCollected++;
        }

        _queue.push_back(iter.first);
    }
    // All collected, enable total size
    if (_sizeCollected == _totalToDownload)
    {
        _totalEnabled = true;
    }

    queueDowload();
}

void AssetsManagerEx::queueDowload()
{
    if (_totalWaitToDownload == 0)
    {
        this->onDownloadUnitsFinished();
        return;
    }

    while (_currConcurrentTask < _maxConcurrentTask && _queue.size() > 0)
    {
        std::string key = _queue.back();
        _queue.pop_back();

        _currConcurrentTask++;
        DownloadUnit &unit = _downloadUnits[key];
        _fileUtils->createDirectory(basename(unit.storagePath));
        _downloader->createDownloadFileTask(unit.srcUrl, unit.storagePath, unit.customId);

        _tempManifest->setAssetDownloadState(key, Manifest::DownloadState::DOWNLOADING);
    }
    if (_percentByFile / 100 > _nextSavePoint)
    {
        // Save current download manifest information for resuming
        _tempManifest->saveToFile(_tempManifestPath);
        _nextSavePoint += SAVE_POINT_INTERVAL;
    }
}

void AssetsManagerEx::onDownloadUnitsFinished()
{
    // Finished with error check
    if (_failedUnits.size() > 0)
    {
        // Save current download manifest information for resuming
        _tempManifest->saveToFile(_tempManifestPath);

        _updateState = State::FAIL_TO_UPDATE;
        dispatchUpdateEvent(EventAssetsManagerEx::EventCode::UPDATE_FAILED);
    }
    else if (_updateState == State::UPDATING)
    {
        updateSucceed();
    }
}
//////////////////////////   MD5

static void MD5Init(MD5_CTX *context)
{
    context->count[0] = context->count[1] = 0;
    context->state[0] = 0x67452301;
    context->state[1] = 0xefcdab89;
    context->state[2] = 0x98badcfe;
    context->state[3] = 0x10325476;
}

static void MD5Update(
    MD5_CTX *context,     /* context */
    unsigned char *input, /* input block */
    unsigned int inputLen /* length of input block */
)
{
    unsigned int i, index, partLen;

    index = (unsigned int)((context->count[0] >> 3) & 0x3F);

    if ((context->count[0] += ((UINT4)inputLen << 3)) < ((UINT4)inputLen << 3))
        context->count[1]++;
    context->count[1] += ((UINT4)inputLen >> 29);

    partLen = 64 - index;

    if (inputLen >= partLen)
    {
        MD5_memcpy((POINTER)&context->buffer[index], (POINTER)input, partLen);
        MD5Transform(context->state, context->buffer);

        for (i = partLen; i + 63 < inputLen; i += 64)
            MD5Transform(context->state, &input[i]);

        index = 0;
    }
    else
        i = 0;

    MD5_memcpy((POINTER)&context->buffer[index], (POINTER)&input[i],
               inputLen - i);
}

static void MD5Final(
    unsigned char digest[16], /* message digest */
    MD5_CTX *context          /* context */
)
{
    unsigned char bits[8];
    unsigned int index, padLen;

    Encode(bits, context->count, 8);

    index = (unsigned int)((context->count[0] >> 3) & 0x3f);
    padLen = (index < 56) ? (56 - index) : (120 - index);
    MD5Update(context, PADDING, padLen);

    MD5Update(context, bits, 8);

    Encode(digest, context->state, 16);

    MD5_memset((POINTER)context, 0, sizeof(*context));
}

static void MD5Transform(
    UINT4 state[4],
    unsigned char block[64])
{
    UINT4 a = state[0], b = state[1], c = state[2], d = state[3], x[16];

    Decode(x, block, 64);

    /* Round 1 */
    FF(a, b, c, d, x[0], S11, 0xd76aa478);  /* 1 */
    FF(d, a, b, c, x[1], S12, 0xe8c7b756);  /* 2 */
    FF(c, d, a, b, x[2], S13, 0x242070db);  /* 3 */
    FF(b, c, d, a, x[3], S14, 0xc1bdceee);  /* 4 */
    FF(a, b, c, d, x[4], S11, 0xf57c0faf);  /* 5 */
    FF(d, a, b, c, x[5], S12, 0x4787c62a);  /* 6 */
    FF(c, d, a, b, x[6], S13, 0xa8304613);  /* 7 */
    FF(b, c, d, a, x[7], S14, 0xfd469501);  /* 8 */
    FF(a, b, c, d, x[8], S11, 0x698098d8);  /* 9 */
    FF(d, a, b, c, x[9], S12, 0x8b44f7af);  /* 10 */
    FF(c, d, a, b, x[10], S13, 0xffff5bb1); /* 11 */
    FF(b, c, d, a, x[11], S14, 0x895cd7be); /* 12 */
    FF(a, b, c, d, x[12], S11, 0x6b901122); /* 13 */
    FF(d, a, b, c, x[13], S12, 0xfd987193); /* 14 */
    FF(c, d, a, b, x[14], S13, 0xa679438e); /* 15 */
    FF(b, c, d, a, x[15], S14, 0x49b40821); /* 16 */

    /* Round 2 */
    GG(a, b, c, d, x[1], S21, 0xf61e2562);  /* 17 */
    GG(d, a, b, c, x[6], S22, 0xc040b340);  /* 18 */
    GG(c, d, a, b, x[11], S23, 0x265e5a51); /* 19 */
    GG(b, c, d, a, x[0], S24, 0xe9b6c7aa);  /* 20 */
    GG(a, b, c, d, x[5], S21, 0xd62f105d);  /* 21 */
    GG(d, a, b, c, x[10], S22, 0x2441453);  /* 22 */
    GG(c, d, a, b, x[15], S23, 0xd8a1e681); /* 23 */
    GG(b, c, d, a, x[4], S24, 0xe7d3fbc8);  /* 24 */
    GG(a, b, c, d, x[9], S21, 0x21e1cde6);  /* 25 */
    GG(d, a, b, c, x[14], S22, 0xc33707d6); /* 26 */
    GG(c, d, a, b, x[3], S23, 0xf4d50d87);  /* 27 */
    GG(b, c, d, a, x[8], S24, 0x455a14ed);  /* 28 */
    GG(a, b, c, d, x[13], S21, 0xa9e3e905); /* 29 */
    GG(d, a, b, c, x[2], S22, 0xfcefa3f8);  /* 30 */
    GG(c, d, a, b, x[7], S23, 0x676f02d9);  /* 31 */
    GG(b, c, d, a, x[12], S24, 0x8d2a4c8a); /* 32 */

    /* Round 3 */
    HH(a, b, c, d, x[5], S31, 0xfffa3942);  /* 33 */
    HH(d, a, b, c, x[8], S32, 0x8771f681);  /* 34 */
    HH(c, d, a, b, x[11], S33, 0x6d9d6122); /* 35 */
    HH(b, c, d, a, x[14], S34, 0xfde5380c); /* 36 */
    HH(a, b, c, d, x[1], S31, 0xa4beea44);  /* 37 */
    HH(d, a, b, c, x[4], S32, 0x4bdecfa9);  /* 38 */
    HH(c, d, a, b, x[7], S33, 0xf6bb4b60);  /* 39 */
    HH(b, c, d, a, x[10], S34, 0xbebfbc70); /* 40 */
    HH(a, b, c, d, x[13], S31, 0x289b7ec6); /* 41 */
    HH(d, a, b, c, x[0], S32, 0xeaa127fa);  /* 42 */
    HH(c, d, a, b, x[3], S33, 0xd4ef3085);  /* 43 */
    HH(b, c, d, a, x[6], S34, 0x4881d05);   /* 44 */
    HH(a, b, c, d, x[9], S31, 0xd9d4d039);  /* 45 */
    HH(d, a, b, c, x[12], S32, 0xe6db99e5); /* 46 */
    HH(c, d, a, b, x[15], S33, 0x1fa27cf8); /* 47 */
    HH(b, c, d, a, x[2], S34, 0xc4ac5665);  /* 48 */

    /* Round 4 */
    II(a, b, c, d, x[0], S41, 0xf4292244);  /* 49 */
    II(d, a, b, c, x[7], S42, 0x432aff97);  /* 50 */
    II(c, d, a, b, x[14], S43, 0xab9423a7); /* 51 */
    II(b, c, d, a, x[5], S44, 0xfc93a039);  /* 52 */
    II(a, b, c, d, x[12], S41, 0x655b59c3); /* 53 */
    II(d, a, b, c, x[3], S42, 0x8f0ccc92);  /* 54 */
    II(c, d, a, b, x[10], S43, 0xffeff47d); /* 55 */
    II(b, c, d, a, x[1], S44, 0x85845dd1);  /* 56 */
    II(a, b, c, d, x[8], S41, 0x6fa87e4f);  /* 57 */
    II(d, a, b, c, x[15], S42, 0xfe2ce6e0); /* 58 */
    II(c, d, a, b, x[6], S43, 0xa3014314);  /* 59 */
    II(b, c, d, a, x[13], S44, 0x4e0811a1); /* 60 */
    II(a, b, c, d, x[4], S41, 0xf7537e82);  /* 61 */
    II(d, a, b, c, x[11], S42, 0xbd3af235); /* 62 */
    II(c, d, a, b, x[2], S43, 0x2ad7d2bb);  /* 63 */
    II(b, c, d, a, x[9], S44, 0xeb86d391);  /* 64 */

    state[0] += a;
    state[1] += b;
    state[2] += c;
    state[3] += d;

    MD5_memset((POINTER)x, 0, sizeof(x));
}

static void Encode(
    unsigned char *output,
    UINT4 *input,
    unsigned int len)
{
    unsigned int i, j;

    for (i = 0, j = 0; j < len; i++, j += 4)
    {
        output[j] = (unsigned char)(input[i] & 0xff);
        output[j + 1] = (unsigned char)((input[i] >> 8) & 0xff);
        output[j + 2] = (unsigned char)((input[i] >> 16) & 0xff);
        output[j + 3] = (unsigned char)((input[i] >> 24) & 0xff);
    }
}

static void Decode(
    UINT4 *output,
    unsigned char *input,
    unsigned int len)
{
    unsigned int i, j;

    for (i = 0, j = 0; j < len; i++, j += 4)
        output[i] = ((UINT4)input[j]) | (((UINT4)input[j + 1]) << 8) |
                    (((UINT4)input[j + 2]) << 16) | (((UINT4)input[j + 3]) << 24);
}

static void MD5_memcpy(
    POINTER output,
    POINTER input,
    unsigned int len)
{
    unsigned int i;

    for (i = 0; i < len; i++)
        output[i] = input[i];
}

static void MD5_memset(
    POINTER output,
    int value,
    unsigned int len)
{
    unsigned int i;

    for (i = 0; i < len; i++)
        ((char *)output)[i] = (char)value;
}

char *MD5String(char *string)
{
    MD5_CTX context;
    unsigned char digest[16];
    char output1[33];
    static char output[33] = {""};
    unsigned int len = strlen(string);
    int i;

    MD5Init(&context);
    MD5Update(&context, (unsigned char *)string, len);
    MD5Final(digest, &context);

    for (i = 0; i < 16; i++)

    {
        sprintf(&(output1[2 * i]), "%02x", (unsigned char)digest[i]);
        sprintf(&(output1[2 * i + 1]), "%02x", (unsigned char)(digest[i] << 4));
    }
    for (i = 0; i < 32; i++)

    {
        output[i] = output1[i];
    }
    return output;
}

static void StringAddOne(char *orstring)
{
    unsigned int len;
    int i, n;

    len = strlen(orstring);
    n = len - 1;
    for (i = n; i >= 0; i--)

    {
        if (orstring[i] == '9')

        {
            orstring[i] = 'A';
            break;
        }
        else if (orstring[i] == 'Z')

        {
            orstring[i] = 'a';
            break;
        }
        else if (orstring[i] == 'z')

        {
            orstring[i] = '0';
            continue;
        }
        else
            orstring[i] += 1;
        break;
    }
}

bool MD5Check(char *md5string, char *string)
{
    return strcmp(md5string, MD5String(string)) == 0;
}

NS_CC_EXT_END