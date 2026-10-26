# Git 基础要点

## 概要

Git 是一款分布式版本控制系统，广泛用于协作开发和版本管理。前往 [Git 官网](https://git-scm.com/install/windows) 完成安装。

熟悉 Git 的流程或者命令行可在 [Learn Git Branching](https://help.gitee.com/learn-Git-Branching/?locale=zh_CN) 练习 Git 命令。

## 一、git 基础命令

:::code-group
```bash [初始化与远程]
git init                         # 初始化本地仓库（生成 .git 文件夹）
git clone <repo-url>             # 克隆远程仓库到本地
git remote                       # 查看远程仓库列表
git remote -v                     # 查看远程仓库详细地址
git remote add <name> <url>       # 添加远程仓库
git remote remove <name>          # 删除远程仓库
git remote rename <old> <new>     # 重命名远程仓库
```

```bash [暂存与提交]
git status                       # 查看当前仓库状态
git add .                        # 暂存所有更改
git add <file>                   # 暂存指定文件
git commit -m "提交说明"          # 提交更改
git commit -am "修改并提交"       # 暂存已跟踪文件并提交

git pull                         # 拉取远程更新并合并
git fetch                        # 拉取远程更新（不自动合并）
git fetch -p                     # 清理已删除的远程分支引用
git push                         # 推送当前分支到远程
git pull origin master-common    # 从主分支获取最新提交

git diff                         # 查看未暂存文件改动
git diff --staged                # 查看已暂存改动
```

```bash [分支管理]
git branch                       # 查看本地分支
git branch -r                    # 查看远程分支
git branch -f main HEAD~3        # 将main分支强制指向HEAD的第3级 parent 提交

git checkout <branch>             # 切换分支
git checkout -b <branch>          # 创建并切换到新分支
git checkout main^                # 切换到 main 分支的上一个（直接父）提交版本
git checkout HEAD~3               # 回退到当前版本往前数第 3 个旧版本

git merge <branch>                # 合并指定分支到当前分支
git rebase <branch>               # 变基操作，使历史更整洁

git cherry-pick <commit-id>       # 将指定提交应用到当前分支
git branch -d <branch>            # 删除本地分支
git push origin --delete <branch> # 删除远程分支
```

```bash [清理与撤销]
git reset --soft HEAD^            # 撤销上一次提交，保留工作区与暂存区
git reset --mixed HEAD^           # 撤销上一次提交，保留工作区，清空暂存区
git reset --hard HEAD^            # 撤销上一次提交并清除所有修改
git restore <file>                # 撤销指定文件修改（Git 2.23+ 推荐）
git clean -fd                     # 删除未跟踪文件和目录（谨慎使用）
git revert <commit-id>            # 撤销某个提交并生成新提交
git stash                         # 暂存当前修改
git stash pop                     # 恢复最近一次 stash 并删除 stash
git stash list                    # 查看 stash 列表
git stash apply <stash@{n}>       # 应用指定 stash
```

```bash [日志标签和配置]
git log                           # 查看提交历史
git log --oneline                 # 简洁查看提交历史
git log --oneline --graph --decorate  # 分支结构图
git log --author="用户名"          # 查看指定作者提交
git log --since="2025-01-01"      # 查看指定日期之后的提交

git tag                           # 查看标签
git tag <tag-name>                # 创建标签
git tag -d 0.0.2                  # 删除本地标签
git push --delete origin 0.0.2    # 删除远程标签
git push origin <tag-name>        # 推送标签到远程

git config --global user.name "你的名字"        # 设置用户名
git config --global user.email "你的邮箱"       # 设置邮箱
git config --list                               # 查看配置信息
git show <commit-id>                            # 查看指定提交的详细信息
git blame <file>                                # 查看文件每行最后修改记录
```
:::

## 二、commit 提交规范

| 类型     | 详细介绍                                                                         |
| -------- | :------------------------------------------------------------------------------- |
| feat     | 新功能、新特性                                                                   |
| fix      | bugfix，修改问题                                                                 |
| docs     | 文档修改、变更                                                                   |
| style    | 代码格式(不影响功能，例如空格、分号等格式修正)注意不是css修改                    |
| refactor | 代码重构                                                                         |
| pref     | 性能提升的修改                                                                   |
| test     | 测试用例修改                                                                     |
| build    | 对项目构建或者依赖的改动(例如scopes: webpack、gulp、npm等)                       |
| ci       | 更改持续集成软件的配置文件和package中的scripts命令，例如scopes: Travis, Circle等 |
| chore    | 其他修改, 比如构建流程, 依赖管理                                                 |
| revert   | 代码回退                                                                         |

## 三、添加数字签名

提交签名用来证明这次 commit 确实是你本人提交的，防止别人冒用你的身份往仓库里提交代码。签名后的提交在 GitHub、Gitee 等远程平台上会显示绿色的 **Verified** 标记。常见有两种方式：复用现有的 SSH 密钥签名，或者独立生成一套 GPG 密钥签名。

### 1. 使用 .ssh/ 为提交添加签名

平时已经用 SSH key 推送代码了，签名直接复用这套密钥就行，不用再单独生成一套新的。在生成一把专属的签名密钥时，提示输入密码时，一路狂按回车直到结束即可。

先确认本地已有 SSH 公钥（`id_ed25519.pub` 或 `id_rsa.pub`），然后告诉 Git 用 SSH 格式签名：

```sh
# 1.生成专属的名为：id_github_signing 签名密钥
ssh-keygen -t ed25519 -f "$env:USERPROFILE\.ssh\id_github_signing" -C "你的GitHub邮箱"

# 2.指定签名格式为 SSH（默认是 GPG）
git config --global gpg.format ssh

# 3.指定用于签名的 SSH 公钥路径（注意填 .pub 公钥，不是私钥）
git config --global user.signingkey ~/.ssh/id_ed25519.pub

# 4.1提交时自动签名
git config --global commit.gpgsign true

# 4.2打标签时自动签名
git config --global tag.gpgSign true

# 5.一键复制新钥匙内容
Get-Content "$env:USERPROFILE\.ssh\id_github_signing.pub" | Set-Clipboard
```

接着到远程平台把这把公钥添加为 **Signing Key**：GitHub 在 Settings → SSH and GPG keys → New SSH key，Key type 选择 `Signing Key`。推送用的 SSH 密钥和签名密钥可以不是同一把，互不影响。

```sh
# 查看最近提交的签名验证状态
git log --show-signature
```

如果不想全局开启自动签名，也可以在提交时手动加 `-S` 参数：

```sh
# 手动签名提交
git commit -S -m "feat: 新功能"

# 本次提交跳过签名
git commit --no-gpg-sign -m "fix: 修复问题"
```

### 2. 通过 GPG 提供数字签名能力

GPG 是一套独立的加密密钥体系，和 SSH 密钥互不通用。生成一对 GPG 密钥：私钥留在本地用来签名，公钥上传到远程平台，平台用公钥验签。开源项目和团队协作中经常要求使用 GPG 签名。

:::code-group
```sh [安装]
# macOS
brew install gnupg

# Ubuntu / Debian
sudo apt install gnupg

# Windows 安装 Gpg4win（官网下载安装包）
https://www.gpg4win.org/

gpg --version
```

```sh [生成密钥对]
# 交互式生成 GPG 密钥（旧版本使用 gpg --gen-key）
gpg --full-generate-key

# 生成密钥对，按提示选择密钥类型、长度、过期时间，填写的姓名和邮箱要与 Git 配置保持一致：
# ● 密钥类型选 RSA and RSA（默认）
# ● 密钥长度选 4096（更安全）
# ● 有效期选 0（永不过期，也可自定义）
# ● 填写姓名（建议和 GitHub 用户名一致）、邮箱（必须是 GitHub 账号绑定的邮箱，可在 GitHub → Settings → Emails 查看）
# ● 可选设置密码（增强安全性，提交时需要输入），不设置可按回车跳过
```
:::

生成完成后查看本地私钥，找到 `sec` 行对应的长密钥 ID：

:::code-group
```sh [列出已生成的密钥]
# 1.列出本地私钥并显示完整密钥 ID
gpg --list-secret-keys --keyid-format=long

# 输出示例，sec 后面斜杠右侧那串就是密钥 ID
sec   rsa4096/1234567890ABCDEF 2026-01-08 [SC]
      ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABCDEF
uid                 [ultimate] Your Name <your-email@example.com>
ssb   rsa4096/0987654321ZYXWVU 2026-01-08 [E]

# 这里的 1234567890ABCDEF 就是密钥ID（sec 行 / 后面的 16 位字符）。

# 2.导出 ASCII 格式的公钥
gpg --armor --export 1234567890ABCDEF
```

```sh [配置 GPG 密钥]
# 配置 GPG 密钥 ID（替换为上面查到的实际 ID）
git config --global user.signingkey 1234567890ABCDEF

# win 请省略这一步
git config --global gpg.program gpg

# 提交 / 打标签自动签名
git config --global commit.gpgsign true
git config --global tag.gpgSign true
```
:::

把密钥 ID 配置给 Git，并开启自动签名。导出公钥，复制 `-----BEGIN PGP PUBLIC KEY BLOCK-----` 到 `-----END PGP PUBLIC KEY BLOCK-----` 的整段内容，粘贴到 GitHub `Settings → SSH and GPG keys → New GPG key` 或 Gitee 的 GPG 公钥设置中。

最后在本地验证签名是否生效：

```sh
# 查看提交签名信息
git log --show-signature

# 如果 Git 找不到 gpg 路径，需指定：
git config --global gpg.program "C:\Program Files (x86)\GnuPG\bin\gpg.exe"
```

:::tip 注意事项：
- GPG 密钥绑定的邮箱必须和 `git config --global user.email` 一致，否则远程平台无法通过验签，Verified 标记会缺失。
- 更换电脑或重装系统时，记得先备份私钥，否则旧签名无法迁移：

```sh
# 导出私钥备份到本地
gpg --export-secret-keys AB12CD34EF567890 > private.key

# 在新电脑上导入私钥
gpg --import private.key
```

- 签名失败先排查：是否安装了 `gnupg`、是否输入了正确的密钥密码、公钥是否已上传到远程平台。
:::

## 四、常用技巧

### **1. 暂存当前工作（切换分支前用）**

活干到一半要去修别的bug，先把代码临时存起来，修完bug回来再把代码取出来接着干。

```sh
git stash  # 暂存当前工作区修改（藏起来）
git checkout feature/B  # 切换分支改bug
# 改完后切回 feature/A
git checkout feature/A
git stash pop  # 恢复之前暂存的修改（同时删除 stash 记录）
```

### **2. 修改最近一次提交（未 push 时）**

提交后发现漏改了文件或提交信息写错，不用新增 commit。

```sh
git add 漏改的文件  # 先暂存新修改
git commit --amend  # 进入编辑模式修改提交信息，保存后覆盖上一次 commit

# 如果只改信息，直接 git commit --amend -m "新信息"
git commit --amend -m "新信息"
```

### **3. commit 回退提交**

硬重置前一定要备份。已推送到远程的提交不要硬重置，使用 `git revert`。团队协作时谨慎使用 reset，避免影响他人。

| 模式      | 移动HEAD指针 | 重置暂存区 | 重置工作区 | 结果描述与影响                                                                           |
| --------- | ------------ | ---------- | ---------- | ---------------------------------------------------------------------------------------- |
| `--soft`  | ✅ 是        | ❌ 否      | ❌ 否      | 撤销 commit，保留代码。撤回的更改会停留在「暂存区」（显示为绿色，待提交状态）。          |
| `--mixed` | ✅ 是        | ✅ 是      | ❌ 否      | 默认模式。撤销 commit 和 add。代码还在，但处于「未暂存」状态（显示为红色），需重新 add。 |
| `--hard`  | ✅ 是        | ✅ 是      | ✅ 是      | 彻底回退。工作区代码会直接变为目标版本的状态，**所有未提交的本地修改都会丢失**（慎用）。 |

:::code-group
```sh [soft 软回退]
git stash # 先保存当前工作
git log --oneline

# 撤销最近的 1 个 commit
git reset --soft HEAD~1

# 或者撤销到 PR #3 (375f28a) 之后的所有提交
git reset --soft 375f28a

git push origin main --force
```

```sh [mixed 默认]
# 提交了几个 commit，但发现代码结构很乱，想把它们全部打散，重新挑选哪些该 add，哪些不该 add
# 代码都在，但都不在暂存区。你可以根据需要重新分批 add 并提交。

git reset HEAD~2 # 默认就是 mixed
```

```sh [hard 硬回退]
# 彻底撤销，修改的所有代码也会被抹掉
git reset --hard 375f28a

# 1. 确认要放弃的更改
git status
git diff
# 2. 硬回退
git reset --hard HEAD~1
# 3. 确认状态
git status
```

```sh [误操作恢复]
# 误操作后
git reset --hard HEAD~1    # 发现删错了重要代码

# 恢复步骤
git reflog                 # 查找之前的commit ID
git reset --hard 1f1c92c   # 恢复到正确版本
```
:::

### **4. 清空提交历史并重置**

暴力清空远程记录的步骤：

```sh
# 彻底删除 Git 痕迹
rm -Recurse -Force .git
git init
git add .
git commit -m "Initial commit"
git remote add origin <你的远程仓库URL>
git push -f origin main
```

## 五、git pull 详解

看到一篇关于介绍 [git pull 详解](https://mp.weixin.qq.com/s/n1KbNaT46SwVPCBxpW31ow) 我才知道有大学问！git pull 命令用于从远程仓库获取最新的更改并合并到当前分支，它其实是 `git fetch` 和 `git merge` 的组合。

### 1. git pull 的过程

当我们远端有代码更新，我们需要拉取。当我们执行git pull的时候，相当于以此执行了:

① **git fetch：**从远程仓库获取最新的代码到本地，但不会自动合并代码。

② **git merge：**将另一个分支的更改合并到当前分支。通常在使用 git fetch 获取了最新的远程更改后，使用 git merge 将这些更改合并到当前分支。

:::code-group
```sh [git fetch]
git fetch <remote> <branch>

# 示例：从名为 origin 的远程仓库获取最新代码：
git fetch origin
```

```sh [git merge]
git merge <branch>
```
:::

### 2. 保证 git 历史的线性

**rebase** 的使用非常简单，我们只需要在 git pull 的时候，添加上额外命令即可！

```sh
git pull --rebase

## 自动变基 可以全局设置git pull默认使用变基的方式，一劳永逸！

# git pull默认使用变基操作
git config --global pull.rebase true

# 如果你还是执意喜欢merge，那么使用下面的命令，git pull默认使用合并操作
git config --global pull.rebase false
```

自动变基会面临一个额外的问题：就是如果你本地文件有更改的话，变基会失败，因为变基前服务区必须是干净的。有两种方法解决这个问题：

- git pull前，先使用git commit暂存代码
- git pull前，先将使用 git stash将保存

## 小结

介绍了 git pull 的用法，明白了它有 `merge` 和 `rebase` 两种模式。默认情况下，它使用的是 merge。使用 merge 的方式拉取代码会导致 git 历史变得复杂，不利于维护和溯源。因此，建议使用 `rebase` 的方式拉取代码。

::: info 📖 相关资源
- [Git 下载地址](https://git-scm.com/downloads) - 官方下载地址
:::
