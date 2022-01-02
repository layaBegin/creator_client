
#import <Foundation/Foundation.h>

@interface JsCall : NSObject
{
}

// 获取PlatformIOS单例
+ (JsCall *)sharedJsCall;
// 弹窗
+ (void)showAlertWithTitle:(NSString *)title message:(NSString *)message delegate:(id)delegate;
@end

/*
 * keyChain模块
 */
@interface JsCall (KeyChain)

// 获取设备的uuid并存储在keyChain中
+ (NSString *)getDeviceUniqID;
// 存储值到keyChain
+ (void)setValue:(NSString *)value withKey:(NSString *)key;
// 从keyChain获取值
+ (NSString *)getValue:(NSString *)value withKey:(NSString *)key;

@end
/*
 * 其他模块
 */
@interface JsCall (Other)

// 苹果手机是否越狱
+ (BOOL)isJailbroken;
// 获取包名
+ (NSString *)getBundleId;

// 拷贝字符串到剪切板
+ (void)copyText:(NSString *)str;
// 屏幕方向设置
+ (void)setOrientation:(NSNumber *)dir;

@end

@interface JsCall (Camera)

+ (BOOL)saveToPhotos:(NSString *)imageFilePath;
+ (void)image:(UIImage *)image didFinishSavingWithError:(NSError *)error contextInfo:(void *)contextInfo;

@end
