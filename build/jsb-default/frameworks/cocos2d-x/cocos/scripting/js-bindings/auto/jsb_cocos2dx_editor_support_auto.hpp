#pragma once
#include "base/ccConfig.h"
#if USE_MIDDLEWARE > 0

#include "cocos/scripting/js-bindings/jswrapper/SeApi.h"

extern se::Object* __jsb_cocos2d_middleware_Texture2D_proto;
extern se::Class* __jsb_cocos2d_middleware_Texture2D_class;

bool js_register_cocos2d_middleware_Texture2D(se::Object* obj);
bool register_all_cocos2dx_editor_support(se::Object* obj);
SE_DECLARE_FUNC(js_cocos2dx_editor_support_Texture2D_getRealTextureIndex);
SE_DECLARE_FUNC(js_cocos2dx_editor_support_Texture2D_setTexParamCallback);
SE_DECLARE_FUNC(js_cocos2dx_editor_support_Texture2D_setPixelsHigh);
SE_DECLARE_FUNC(js_cocos2dx_editor_support_Texture2D_setPixelsWide);
SE_DECLARE_FUNC(js_cocos2dx_editor_support_Texture2D_getPixelsHigh);
SE_DECLARE_FUNC(js_cocos2dx_editor_support_Texture2D_getPixelsWide);
SE_DECLARE_FUNC(js_cocos2dx_editor_support_Texture2D_setRealTextureIndex);
SE_DECLARE_FUNC(js_cocos2dx_editor_support_Texture2D_setTexParameters);
SE_DECLARE_FUNC(js_cocos2dx_editor_support_Texture2D_Texture2D);

extern se::Object* __jsb_cocos2d_middleware_MiddlewareManager_proto;
extern se::Class* __jsb_cocos2d_middleware_MiddlewareManager_class;

bool js_register_cocos2d_middleware_MiddlewareManager(se::Object* obj);
bool register_all_cocos2dx_editor_support(se::Object* obj);
SE_DECLARE_FUNC(js_cocos2dx_editor_support_MiddlewareManager_update);
SE_DECLARE_FUNC(js_cocos2dx_editor_support_MiddlewareManager_destroyInstance);
SE_DECLARE_FUNC(js_cocos2dx_editor_support_MiddlewareManager_getInstance);
SE_DECLARE_FUNC(js_cocos2dx_editor_support_MiddlewareManager_MiddlewareManager);

#endif //#if USE_MIDDLEWARE > 0
