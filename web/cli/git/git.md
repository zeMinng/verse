# Git 基础要点

## 概要

欢迎来到 [Git](https://git-scm.com/downloads) 文档！Git 是一款分布式版本控制系统，广泛用于协作开发和版本管理。

熟悉 Git 的流程或者命令行可以去 [这里](https://help.gitee.com/learn-Git-Branching/?locale=zh_CN) 练习 Git 命令。

## 一、git 基础命令

:::code-group
``` bash [初始化与远程]
git init                         # 初始化本地仓库（生成 .git 文件夹）
git clone <repo-url>             # 克隆远程仓库到本地
git remote                       # 查看远程仓库列表
git remote -v                     # 查看远程仓库详细地址
git remote add <name> <url>       # 添加远程仓库
git remote remove <name>          # 删除远程仓库
git remote rename <old> <new>     # 重命名远程仓库
```

``` bash [暂存与提交]
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

``` bash [分支管理]
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

``` bash [清理与撤销]
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

``` bash [日志标签和配置]
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

| 类型     |   详细介绍   |
| -------- | :----------------|
| feat     |   新功能、新特性  |
| fix      |  bugfix，修改问题  |
| docs     |  文档修改、变更  |
| style    |  代码格式(不影响功能，例如空格、分号等格式修正)注意不是css修改  |
| refactor |  代码重构  |
| pref     |  性能提升的修改  |
| test     |  测试用例修改  |
| build    |  对项目构建或者依赖的改动(例如scopes: webpack、gulp、npm等)  |
| ci       | 更改持续集成软件的配置文件和package中的scripts命令，例如scopes: Travis, Circle等 |
| chore    |  其他修改, 比如构建流程, 依赖管理  |
| revert   |  代码回退  |

## 三、常用技巧

### **1. 暂存当前工作（切换分支前用）**
活干到一半要去修别的bug，先把代码临时存起来，修完bug回来再把代码取出来接着干。
``` sh
git stash  # 暂存当前工作区修改（藏起来）
git checkout feature/B  # 切换分支改bug
# 改完后切回 feature/A
git checkout feature/A
git stash pop  # 恢复之前暂存的修改（同时删除 stash 记录）
```

### **2. 修改最近一次提交（未 push 时）**
提交后发现漏改了文件或提交信息写错，不用新增 commit。
``` sh
git add 漏改的文件  # 先暂存新修改
git commit --amend  # 进入编辑模式修改提交信息，保存后覆盖上一次 commit

# 如果只改信息，直接 git commit --amend -m "新信息"
git commit --amend -m "新信息"
```

### **3. commit 回退提交**
硬重置前一定要备份。已推送到远程的提交不要硬重置，使用 `git revert`。团队协作时谨慎使用 reset，避免影响他人。

| 模式 | 移动HEAD指针 | 重置暂存区 | 重置工作区  | 结果描述与影响 |
|---------|-------------|--------------|------------|---------------|
| `--soft` | ✅ 是 | ❌ 否 | ❌ 否 | 撤销 commit，保留代码。撤回的更改会停留在「暂存区」（显示为绿色，待提交状态）。|
| `--mixed` | ✅ 是 | ✅ 是 | ❌ 否 | 默认模式。撤销 commit 和 add。代码还在，但处于「未暂存」状态（显示为红色），需重新 add。 |
| `--hard` | ✅ 是 | ✅ 是 | ✅ 是 | 彻底回退。工作区代码会直接变为目标版本的状态，**所有未提交的本地修改都会丢失**（慎用）。 |


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

## 四、git pull 详解

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

## 五、小结

介绍了 git pull 的用法，明白了它有 `merge` 和 `rebase` 两种模式。默认情况下，它使用的是 merge。使用 merge 的方式拉取代码会导致 git 历史变得复杂，不利于维护和溯源。因此，建议使用 `rebase` 的方式拉取代码。


<!-- ### 主要特性

- **分布式版本控制**: Git 是一款分布式版本控制系统，每个开发者都可以拥有完整的代码仓库副本，方便离线工作和团队协作。

- **简单易用**: Git 提供了简洁的命令行界面和直观的图形化工具，使得版本控制操作更加容易上手。

- **强大的分支管理**: Git 提供了强大的分支管理功能，可以轻松创建、切换和合并分支，以便同时进行多个任务。

### 核心优势

- **速度和性能**: Git 能够处理大型项目和大量代码文件，并提供高效的性能和响应速度。

- **数据完整性**: Git 使用校验和机制保证数据的完整性，确保在传输或储存过程中不会损坏或丢失任何数据。

- **灵活性和可定制性**: Git 可以根据项目的需求进行灵活配置和定制，以满足不同开发团队的要求。 -->

::: info 📖 相关资源
- [Git 下载地址](https://git-scm.com/downloads) - 官方下载地址
:::