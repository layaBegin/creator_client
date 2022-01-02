package org.cocos2dx.javascript;

import android.Manifest;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.text.TextUtils;
import android.util.Log;
import android.view.WindowManager;
import android.widget.Toast;
import java.io.File;
import java.text.*;
import java.util.Calendar;
import java.util.Date;


public class CommonAPI {
    public static AppActivity mAppActivity = null;

    public static void init(AppActivity activity){
        mAppActivity = activity;
        verifyStoragePermissions();
    }

    public static void setKeepScreenOn(boolean isOn){
        Log.d("CommonAPI", "setKeepScreenOn");
        mAppActivity.runOnUiThread(new Runnable(){
            @Override
            public void run() {
                mAppActivity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            }
        });
    }

    public static void copyText(final String content){
        mAppActivity.runOnUiThread(new Runnable(){
            @Override
            public void run() {
                ClipboardManager cm = (ClipboardManager)mAppActivity.getSystemService(Context.CLIPBOARD_SERVICE);
                ClipData clip = ClipData.newPlainText("",content);
                if (cm != null){
                    cm.setPrimaryClip(clip);
                    Toast.makeText(mAppActivity, "复制成功", Toast.LENGTH_SHORT).show();
                    Log.d("CommonAPI", "copyText");
                }
            }
        });
    }

    public static void openAppByUrl(final String url){
        mAppActivity.runOnUiThread(new Runnable(){
            @Override
            public void run() {
                try {
                    Intent intent = new Intent();
                    ComponentName cmp=new ComponentName("com.tencent.mm","com.tencent.mm.ui.LauncherUI");
                    intent.setAction(Intent.ACTION_MAIN);
                    intent.addCategory(Intent.CATEGORY_LAUNCHER);
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    intent.setComponent(cmp);
                    Log.d("CommonAPI", "copyText");
                    mAppActivity.startActivity(intent);
                }catch (Exception e){
                    Toast.makeText(mAppActivity, "无法跳转到微信，请检查您是否安装了微信！", Toast.LENGTH_SHORT).show();
                }

            }
        });
    }
    /**
     * 获取设备唯一ID
     * @return
     */
    public static String getDeviceUniqID() {
        try {
            android.telephony.TelephonyManager tm = (android.telephony.TelephonyManager) mAppActivity.getSystemService(mAppActivity.TELEPHONY_SERVICE);
            String unique_id = "";
            if (mAppActivity.checkSelfPermission(Manifest.permission.READ_PHONE_STATE) == PackageManager.PERMISSION_GRANTED){
                unique_id = tm.getDeviceId();
            }
            if (TextUtils.isEmpty(unique_id)) {
                unique_id = android.os.Build.SERIAL;   // 如果获取不到设备号 则退取序列号 标识该设备
            }
            return unique_id;
        }catch (Exception e){
            Log.d("getDeviceUniqID","获取设备唯一标识失败");
            return  "";
        }
    }

    public  static boolean saveToPhotos(String filePath){
        verifyStoragePermissions();

        try {
            String fileName = FileUtils.getFileName();  // 当前时间
            // fileName = "test";
            String newPath = FileUtils.getExternalStorageDir() + fileName + ".png";
            Boolean ret= FileUtils.copyFile(filePath,newPath);
            if (ret){
                FileUtils.broadcastFile(newPath);
                return  true;
            }
            else {
                return false;
            }
        }catch (Exception e){
            return false;
        }


    }
    private static final int REQUEST_EXTERNAL_STORAGE = 1;
    private static String[] PERMISSIONS_STORAGE = {     // 在此处添加授权
            Manifest.permission.READ_EXTERNAL_STORAGE,
            Manifest.permission.WRITE_EXTERNAL_STORAGE,
    };
    // 检测手机权限
    public static Boolean verifyStoragePermissions() {

        int permission = mAppActivity.checkSelfPermission( Manifest.permission.ACCESS_FINE_LOCATION);

        if (permission != PackageManager.PERMISSION_GRANTED) {
            mAppActivity.requestPermissions(PERMISSIONS_STORAGE, REQUEST_EXTERNAL_STORAGE);
            return  false;
        }
        else {
            return true;
        }
    }


}
