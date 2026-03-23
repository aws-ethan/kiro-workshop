# Kiro Workshop 前置操作

## 步骤 1：接受邀请并设置密码

1. 登录公司邮箱，找到标题为「Invitation to join AWS IAM Identity Center」的邮件
2. 点击邮件中的「Accept invitation」
3. 按照提示设置 Kiro 的登录密码

## 步骤 2：下载并安装 Kiro

1. 访问 [https://kiro.dev/](https://kiro.dev/)
2. 下载对应操作系统版本的 Kiro
3. 完成安装

## 步骤 3：登录 Kiro

1. 打开 Kiro，点击登录
2. 选择「Your Organization」
3. 不要输入邮箱，点击下方的「Sign in via IAM Identity Center instead」
4. 填写以下信息：
   - Start URL：`https://d-xxxxxxxx.awsapps.com/start`
   - Region：`xxxx-xxx-x`
5. 点击「Continue」，在弹出的登录框中输入：
   - 用户名：邮箱 `@` 前面的部分（例如邮箱是 `zhangsan@example.com`，则输入 `zhangsan`）
   - 密码：步骤 1 中设置的密码
6. 点击允许授权访问，完成登录

## 步骤 4：克隆并打开项目

1. 在终端中执行：

```bash
git clone https://github.com/aws-ethan/kiro-workshop/
```

2. 用 Kiro 打开克隆下来的项目

## 步骤 5：运行项目

1. 在 Kiro 中打开 Vibe 对话框
2. 输入「帮我运行一下这个项目」
3. Kiro 会自动安装依赖并启动前后端服务，过程中遇到需要执行命令的地方，点击 Run 按钮进行确认

### 验证运行成功

当控制台出现以下信息时，说明后端已启动：

```
[nodemon] starting `node src/server.js`
Server running on http://localhost:3001
```

同时出现以下信息，说明前端已启动：

```
VITE v4.5.14  ready in 176 ms
➜  Local:   http://localhost:5174/
```

### 验证登录

1. 在浏览器中打开 http://localhost:5174/
2. 使用以下账号登录：
   - 用户名：`admin`
   - 密码：`admin123`
3. 登录成功后看到 Micro Blogging 页面，即代表环境搭建完成
