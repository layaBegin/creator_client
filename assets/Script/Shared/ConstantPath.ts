
class ConstantPath{

    HotUpdateStorageFolder = "bigplay-remote-asset"    // 热更文件夹
    HotUpdateStoragePath = (cc.sys.isNative ? jsb.fileUtils.getWritablePath() : '/') + this.HotUpdateStorageFolder  // 热更资源的存储路径


}
export default ConstantPath;

//ES6， 全称 ECMAScript 6.0 ，是 JavaScript 的下一个版本标准，2015.06 发版
// 1.ES6的模块自动开启严格模式，不管你有没有在模块头部加上 use strict;。
//
// 2.模块中可以导入和导出各种类型的变量，如函数，对象，字符串，数字，布尔值，类等。
//
// 3.每个模块都有自己的上下文，每一个模块内声明的变量都是局部变量，不会污染全局作用域。
//
// 4.每一个模块只加载一次（是单例的）， 若再去加载同目录下同文件，直接从内存中读取。
//https://blog.csdn.net/QQ80583600/article/details/73693512?ops_request_misc=%257B%2522request%255Fid%2522%253A%2522164111664816780261910598%2522%252C%2522scm%2522%253A%252220140713.130102334..%2522%257D&request_id=164111664816780261910598&biz_id=0&utm_medium=distribute.pc_search_result.none-task-blog-2~all~top_positive~default-2-73693512.first_rank_v2_pc_rank_v29&utm_term=ES6&spm=1018.2226.3001.4187
