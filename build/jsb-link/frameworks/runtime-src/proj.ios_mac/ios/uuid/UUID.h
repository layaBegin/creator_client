//
//  UUID.h
//  MobilePlaza
//
//  Created by mac_pro on 2017/8/22.
//
//



#import <Foundation/Foundation.h>

@interface UUID : NSObject

+(NSString *)getUUID;
// 存储值到keyChain
+ (void) setValue:(NSString*)value withKey:(NSString*)key;
// 从keyChain获取值
+ (NSString*) getValue:(NSString*)value withKey:(NSString*)key;

@end
