//
//  IOSOpenInstallDelegate.h
//  hello_world-mobile
//
//  Created by cooper on 2018/6/26.
//

#import <Foundation/Foundation.h>
#import "OpenInstallSDK.h"
#import "cocos2d.h"
#ifdef CC_FIX_ARTIFACTS_BY_STRECHING_TEXEL_TMX
#include "cocos/scripting/js-bindings/jswrapper/SeApi.h"
#else
#include "scripting/js-bindings/manual/ScriptingCore.h"
#endif
#ifndef HAVE_INSPECTOR
#include "ScriptingCore.h"
#endif

@interface IOSOpenInstallDelegate : NSObject<OpenInstallDelegate>

@property (nonatomic, copy)NSString *wakeUpJson;
@property (nonatomic, assign)BOOL isRegister;

+(IOSOpenInstallDelegate *)defaultManager;
+(void)sendWakeUpJsonBack:(NSString *)json;
+(NSString *)jsonStringWithObject:(id)jsonObject;

@end
