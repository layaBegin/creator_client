

#import "JsCall.h"
#import "cocos2d.h"
//#include "cocos2d.h"
#import "AppController.h"
#include "cocos/scripting/js-bindings/jswrapper/SeApi.h"
#import "UUID.h"
#import <AVFoundation/AVFoundation.h>
#import "WHToast/WHToast.h"     // 类似于 安卓的 Toast 提示

using namespace cocos2d;


@implementation JsCall

static JsCall* _instance = nil;

// 获取PlatformIOS单例
+ (JsCall*) sharedJsCall
{
    static dispatch_once_t onceToken ;
    dispatch_once(&onceToken, ^{
        _instance = [[super allocWithZone:NULL] init] ;
    }) ;
    
    return _instance ;
}
// 调用js函数
+ (void) callJsCode:(NSString*) fnStr
{
    [fnStr retain];
    // 在cocos线程调用js代码
//    cocos2d::Director::getInstance()->getScheduler()->performFunctionInGLThread([=](){
//    Director::getInstance()::getScheduler()->performFunctionInCocosThread([=](){
        NSLog(@"oc调用Js函数: %@", fnStr);
        
       se::ScriptEngine* scriptEengine = se::ScriptEngine::getInstance();
        scriptEengine->evalString([fnStr UTF8String]);
        [fnStr release];
//    }); // performFunctionInCocosThread
}

// 弹窗
+ (void) showAlertWithTitle:(NSString*)title message:(NSString*)message delegate:(id)delegate
{
    UIAlertView *alert =[[UIAlertView alloc]initWithTitle:title message:message delegate:delegate cancelButtonTitle:@"确定" otherButtonTitles: nil];
    
    [alert show];
}

@end

/*
 * keyChain模块
 */
@implementation JsCall (KeyChain)

// 获取设备的uuid并存储在keyChain中
+ (NSString*) getDeviceUniqID
{
    NSString * uuid= [UUID getUUID];
    
    return uuid;
}

// 存储值到keyChain
+ (void) setValue:(NSString*)value withKey:(NSString*)key
{
    [UUID setValue:value withKey:key];
}

// 从keyChain获取值
+ (NSString*) getValue:(NSString*)value withKey:(NSString*)key
{
    return [UUID getValue:value withKey:key];
}

@end


/*
 * 其他模块
 */
@implementation JsCall (Other)

// 苹果手机是否越狱
+ (BOOL)isJailbroken
{
#if !(TARGET_IPHONE_SIMULATOR)
    
    FILE *file = fopen("/Applications/Cydia.app", "r");
    if (file) {
        fclose(file);
        return YES;
    }
    file = fopen("/Library/MobileSubstrate/MobileSubstrate.dylib", "r");
    if (file) {
        fclose(file);
        return YES;
    }
    file = fopen("/bin/bash", "r");
    if (file) {
        fclose(file);
        return YES;
    }
    file = fopen("/usr/sbin/sshd", "r");
    if (file) {
        fclose(file);
        return YES;
    }
    file = fopen("/etc/apt", "r");
    if (file) {
        fclose(file);
        return YES;
    }
    file = fopen("/usr/bin/ssh", "r");
    if (file) {
        fclose(file);
        return YES;
    }
    
    NSFileManager *fileManager = [NSFileManager defaultManager];
    
    if ([fileManager fileExistsAtPath:@"/Applications/Cydia.app"]) {
        return YES;
    } else if ([fileManager fileExistsAtPath:@"/Library/MobileSubstrate/MobileSubstrate.dylib"]) {
        return YES;
    } else if ([fileManager fileExistsAtPath:@"/bin/bash"]) {
        return YES;
    } else if ([fileManager fileExistsAtPath:@"/usr/sbin/sshd"]) {
        return YES;
    } else if ([fileManager fileExistsAtPath:@"/etc/apt"]) {
        return YES;
    } else if ([fileManager fileExistsAtPath:@"/usr/bin/ssh"]) {
        return YES;
    }
    
    // Check if the app can access outside of its sandbox
    NSError *error = nil;
    NSString *string = @".";
    [string writeToFile:@"/private/jailbreak.txt" atomically:YES encoding:NSUTF8StringEncoding error:&error];
    if (!error) {
        return YES;
    } else {
        [fileManager removeItemAtPath:@"/private/jailbreak.txt" error:nil];
    }
    
    // Check if the app can open a Cydia's URL scheme
    if ([[UIApplication sharedApplication] canOpenURL:[NSURL URLWithString:@"cydia://package/com.example.package"]]) {
        return YES;
    }
    
#endif
    
    return NO;
}

// 获取包名
+ (NSString*) getBundleId
{
    //CFBundleIdentifier
    NSDictionary* infoDictionary =  [[NSBundle mainBundle] infoDictionary];
    NSString* bundlerId = [infoDictionary objectForKey:@"CFBundleIdentifier"];
    
    return bundlerId;
}

// 拷贝字符串到剪切板
+ (void) copyText:(NSString *)str
{
    //把string类型转换成为char*
    const char* p = [str UTF8String];
    
    //把char*转换成OC的NSString
    NSString *nsMessage= [[NSString alloc] initWithCString:p encoding:NSUTF8StringEncoding];
    
    //获得iOS的剪切板
    UIPasteboard *pasteboard = [UIPasteboard generalPasteboard];
    if (pasteboard != nil){
        //改变剪切板的内容
        pasteboard.string = nsMessage;
        // [WHToast showMessage:@"复制成功" duration:1 finishHandler:nil];
    }else{
        // [WHToast showMessage:@"复制失败" duration:1 finishHandler:nil];
    }

}
// 打开应用
+ (void)openAppByUrl:(NSString *)url{
    [[UIApplication sharedApplication] openURL:[NSURL URLWithString:url]];
}


// 屏幕方向设置 0:横屏， !=0: 竖屏
+ (void) setOrientation:(NSNumber*) dir
{
//    AppController* application = (AppController*) [[UIApplication sharedApplication] delegate];
//
//    if([dir isEqual: @0]){
//        [application changeRootViewControllerH];
//    }else{
//        [application changeRootViewControllerV];
//    }
}

@end

@implementation JsCall (Camera)
/**
 * 将一张图片保存到相册
 */
+(BOOL)saveToPhotos:(NSString *) imageFilePath {
    // NSString* filePath = [NSHomeDirectory() stringByAppendingFormat:@"/Documents/%@", fileName];
    UIImage *viewImage = [UIImage imageWithContentsOfFile:imageFilePath];
    if (viewImage != nil) {
     // UIImageWriteToSavedPhotosAlbum(viewImage, self,  @selector(image:didFinishSavingWithError:contextInfo:), nil);
        try {
            UIImageWriteToSavedPhotosAlbum(viewImage, self,  @selector(image:didFinishSavingWithError:contextInfo:), NULL);
        } catch (NSException *e) {
            return false;
        }
        return true;
    }
    return false;
}
/*
 * 保存到相册回调函数
 */
+ (void)image: (UIImage *) image didFinishSavingWithError: (NSError *) error contextInfo: (void *) contextInfo {
    NSString*  ret = @"保存成功";
    if(error){
        ret = @"保存失败";
    }
    NSString* fnName = [NSString stringWithFormat:@"Global.SDK.saveToPhotos.callback(\"%@\")", ret];
    [JsCall callJsCode: fnName];
}

+(NSString *)saveImage:(UIImage *)image fileName:(NSString *)name {
    NSString* filePath = [NSHomeDirectory() stringByAppendingFormat:@"/Documents/%@.png", name];
    
    BOOL result =[UIImagePNGRepresentation(image) writeToFile:filePath atomically:YES]; // 保存成功会返回YES
    if (result == YES) {
        NSLog(@"保存成功:%@", filePath);
        return filePath;
    }
    NSLog(@" 保存失败:%@",filePath);
    return @"";
}

@end

