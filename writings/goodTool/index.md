# 微信小程序抓包

在进行小程序开发或竞品分析时，查看接口请求（HTTPS 流量）是核心技能。本文记录如何使用 Fiddler 4 配合 微信开发者工具/真机 进行抓包。

## 一、软件下载与基础安装

下载地址官方原版： [Telerik Fiddler Classic](https://www.telerik.com/download/fiddler) (免费版)。

注意： 建议安装在非系统盘路径，避免权限导致的配置失效。

## 二、Fiddler 核心配置 (开启 HTTPS)

小程序接口几乎全部是 HTTPS，默认情况下 Fiddler 只能看到隧道连接（Tunnel to），看不到具体内容。

1.  打开 Fiddler，点击工具栏：`Tools` -> `Options`。
2.  切换到 **HTTPS** 选项卡：
    * 勾选 `Capture HTTPS CONNECTs`（捕获 HTTPS 连接）。
    * 勾选 `Decrypt HTTPS traffic`（解密 HTTPS 流量）。
    * 在弹出的窗口中选择 `Yes`，信任 Fiddler 生成的根证书（Root Certificate）。
3.  切换到 **Connections** 选项卡：
    * 勾选 `Allow remote computers to connect`（允许远程设备连接，**真机抓包必选**）。
    * 记住默认端口：`8888`。
4.  **重启 Fiddler**（配置生效的关键）。

## 三、场景一：微信开发者工具抓包 (PC端)

这是最简单的场景，通常用于调试自己的代码。

1.  打开**微信开发者工具**。
2.  点击顶部菜单：`设置` -> `代理设置`。
3.  选择 **“手动设置代理”** 或 **“使用系统代理”**：
    * 地址填：`127.0.0.1`
    * 端口填：`8888`
4.  **注意：** 如果预览报错“证书不合法”，请勾选开发者工具右侧 `详情` -> `本地设置` -> `不校验合法域名、web-view（业务域名）、TLS版本以及HTTPS证书`。

## 四、场景二：真机实测抓包 (iOS/Android)

如果你需要测试在线环境或生产版本的小程序，需要手机连接电脑代理。

##### 步骤 A：手机配置代理
1.  确保手机和电脑连接在**同一个 Wi-Fi**。
2.  获取电脑 IP（在 Fiddler 右上角悬停 `Online` 图标，或在命令行输入 `ipconfig`）。
3.  手机 Wi-Fi 设置 -> 代理 -> 手动：
    * 服务器：电脑 IP
    * 端口：`8888`

##### 步骤 B：安装手机证书 (关键)
1.  手机浏览器访问：`http://电脑IP:8888`。
2.  点击底部蓝色链接 `FiddlerRoot certificate` 下载证书。
3.  **安装并信任：**
    * **iOS：** 设置 -> 已下载描述文件 -> 安装；**最后必须**去 `关于本机` -> `证书信任设置` -> 开启 Fiddler 证书开关。
    * **Android：** 设置 -> 安全 -> 从存储盘安装证书（部分机型需进入“加密与凭据”）。

## 五、进阶：如何只看小程序的请求？ (过滤)

侧边栏太乱？使用 **Filters** 减少干扰：

1.  点击右侧 `Filters` 选项卡。
2.  勾选 `Use Filters`。
3.  在 `Hosts` 部分选择 `Show only the following Hosts`。
4.  输入小程序的域名（例如 `api.example.com`），多个域名用分号隔开。
5.  点击 `Actions` -> `Run Filterset now`。


## 六、常见坑点记录

| 现象 | 原因及解决方案 |
| :--- | :--- |
| **手机无法上网** | 检查防火墙是否允许 Fiddler 通过；确认手机和电脑在同一网段。 |
| **全是 Tunnel To** | HTTPS 证书未信任，或 Android 7.0 以上系统不信任用户证书。 |
| **安卓抓不到包** | Android 7.0+ 默认不信任用户安装的证书。**解决方法：** 使用模拟器（推荐低版本 Android 模拟器）或 Root 手机将证书移动至系统分区。 |
| **小程序请求失败** | 检查微信开发者工具是否开启了“不校验合法域名”。 |

## 小结

::: info 📖 相关资源
- [fiddler 文档](https://www.telerik.com/fiddler/fiddler-classic/documentation/introduction) - fiddler 文档
:::
