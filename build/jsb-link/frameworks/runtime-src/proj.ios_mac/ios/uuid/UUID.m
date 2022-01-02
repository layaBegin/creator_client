//
//  UUID.m
//  MobilePlaza
//
//  Created by mac_pro on 2017/8/22.
//
//

#import "UUID.h"
#import "KeyChainStore.h"

@implementation UUID

+(NSString *)getUUID
{
    NSString * strUUID = (NSString *)[KeyChainStore load:KEY_UUID];
    
    //首次执行该方法时，uuid为空
    if (!strUUID || [strUUID isEqualToString:@""])
    {
        //生成一个uuid的方法
        CFUUIDRef uuidRef = CFUUIDCreate(kCFAllocatorDefault);
        
        strUUID = (NSString *)CFBridgingRelease(CFUUIDCreateString (kCFAllocatorDefault,uuidRef));
        
        //将该uuid保存到keychain
        [KeyChainStore save:KEY_UUID data:strUUID];
        
    }
    return strUUID;
}

// 存储值到keyChain
+ (void) setValue:(NSString*)value withKey:(NSString*)key
{
    //将该uuid保存到keychain
    [KeyChainStore save:key data:value];
}

// 从keyChain获取值
+ (NSString*) getValue:(NSString*)value withKey:(NSString*)key
{
    NSString* valueStore = (NSString *)[KeyChainStore load:key];
    
    return valueStore == NULL? value : valueStore;
}

@end
