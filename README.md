# 说明

这是一个使用electron制作的切换管理hosts的小工具。

[uTools](https://u.tools/)有一个hosts的插件，可以很方便的管理本地hosts文件的各种网站解析配置。

我自己机器上使用utools有点小问题，utools没有独立的这个hosts工具，所以自己边学边仿着写了这么一个独立的hosts小工具。

程序第一次启动会把原hosts备份到程序运行的用户目录下，linux是 `~/.conf/hostsbox/` 目录 ，windows是 `c:\Users\名字\AppData\Roaming\hostsbox\` 目录。

# 开发

```bash
# github
git clone https://github.com/rexlevin/hostsbox.git
# gitee
git clone https://gitee.com/rexlevin/hostsbox.git

cd hostsbox
npm i

# 安装electron-builder
npm i -g electron-builder

# linux环境下打包，appimage
npm run build-dist:linux
# windows环境下打包，exe
npm run build-dist:win
```

# tauri

本来打算使用tauri的，但是有些运行和打包的问题实在是太头大。

比如有时候本地dev的时候启动不了，实际上可运行文件已经编译出来了，只能到编译目录下去手动运行可执行文件；

再比如build的时候build不出来appimage包，是在最后打包appimage的时候有一个大家都知道的魔法的原因。

初次接触tauri，更不熟悉rust，没能尽快搞定，最终还是继续用着庞大但是成熟的electron。

等以后tauri更成熟，本地更方便了再更换成tauri吧，毕竟更小。

# 截图

![image-20220710104723942](https://imgbd.r-xnoro.com//image-20220710104723942.png)

![image-20220710104830427](https://imgbd.r-xnoro.com//image-20220710104830427.png)
