//
//  KeyChainStore.h
//  MobilePlaza
//
//  Created by mac_pro on 2017/8/22.
//
//

#import <Foundation/Foundation.h>

@interface KeyChainStore : NSObject

+ (void)save:(NSString *)service data:(id)data;
+ (id)load:(NSString *)service;
+ (void)deleteKeyData:(NSString *)service;

@end
