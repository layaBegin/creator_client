package org.cocos2dx.javascript;

//import android.content.Intent;
import android.content.Intent;
import android.net.Uri;
import android.os.Environment;
import android.util.Log;

import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.File;
import java.text.SimpleDateFormat;
import java.util.Date;


public class FileUtils {
    public static AppActivity mAppActivity = null;

    public static void init(AppActivity activity){
        mAppActivity = activity;
    }

  public static String getExternalStorageDir() {
      Log.d("FileUtils","当前包名::"+mAppActivity.getPackageName());
       return Environment.getExternalStorageDirectory().getPath()+"/" + mAppActivity.getPackageName()+"/";
  }

  public static String getFileName(){
          Date currentTime = new Date();
          SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
          String dateString = formatter.format(currentTime);
          return dateString;
  }

    /**
     * 复制单个文件
     *
     * @param oldPath String  原文件路径  如：c:/fqf.txt
     * @param newPath String  复制后路径  如：f:/fqf.txt
     * @return boolean
     */
    public static Boolean copyFile(String oldPath, String newPath) {
        try {
            //int  bytesum  =  0;
            int byteread = 0;
            File oldfile = new File(oldPath);
            if (oldfile.exists()) {
                File newfile = new File(newPath);
                if (!newfile.exists()){
                   File pDir = new File( newfile.getParent());
                   if (!pDir.exists()){
                       pDir.mkdirs();
                   }
                    newfile.createNewFile();
                }
                else {
                    newfile.delete();
                }
                InputStream inStream = new FileInputStream(oldPath);  //读入原文件
                FileOutputStream fs = new FileOutputStream(newPath);
                byte[] buffer = new byte[1444];
                // int  length;
                while ((byteread = inStream.read(buffer)) != -1) {
                    // bytesum  +=  byteread;  //字节数  文件大小
                    //System.out.println(bytesum);
                    fs.write(buffer, 0, byteread);
                }
                inStream.close();
                return true;
            }
            else {
                System.out.println("文件不存在");
                return false;
            }
        } catch (Exception e) {
            System.out.println("复制单个文件操作出错");
            e.printStackTrace();

            return false;
        }

    }


    public  static void broadcastFile(String filePath){
        File file = new File(filePath);
        if (file.exists()) {
            Intent intent = new Intent(Intent.ACTION_MEDIA_SCANNER_SCAN_FILE);
            Uri uri = Uri.fromFile(file);
            intent.setData(uri);
            mAppActivity.sendBroadcast(intent);
        }
    }

}
