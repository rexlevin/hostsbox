# 说明

使用electron制作的切换管理hosts的小工具。

# 为什么不用tauri

本来打算使用tauri的，但是有些运行和打包的问题实在是太头大。

比如本地dev的时候启动不了，实际上可运行文件已经编译出来了，只能到编译目录下去手动运行可执行文件；

再比如build的时候build不出来appimage包。

因为初次接触tauri，更不熟悉rust，没能尽快搞定，最终还是继续用着庞大的nwjs。

等以后tauri更成熟，本地更方便了再更换成tauri吧，毕竟更小。

# 为什么不用nwjs

其实我不是专业前端，nwjs里有些问题不会解决，比如console.info()在electron里可以输出到terminal里面，而nwjs只能输出到devTool里；

然而，在nwjs里想要开启devTool需要使用另外的sdk，而这个sdk在npm里面没有，需要手动替换，这就不如electron方便了；

再一个，nwjs的文档不如electron丰富全面，而且nwjs不是国人开搞的么？怎么没有中文文档呢。
