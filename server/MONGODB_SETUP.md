# MongoDB 连接配置

## 方案 1：MongoDB Atlas（推荐 - 免费云数据库）

1. 访问 https://www.mongodb.com/cloud/atlas/register
2. 注册免费账号
3. 创建免费集群 (M0 Sandbox - Free forever)
4. 创建数据库用户（用户名/密码）
5. 设置网络访问：允许所有 IP (0.0.0.0/0)
6. 获取连接字符串，格式如下：

```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/fitness_checkin?retryWrites=true&w=majority
```

7. 将连接字符串填入下方 .env 文件的 `MONGODB_URI`

## 方案 2：本地 Docker（需要解决网络问题）

```bash
# 配置 Docker 镜像加速后运行
docker run -d -p 27017:27017 -v mongodb-data:/data/db --name mongodb mongo:7.0
```

连接字符串：
```
mongodb://localhost:27017/fitness_checkin
```

## 方案 3：本地安装

参考 MongoDB 官方文档安装到本地服务器。

---

## 当前配置

复制 `.env.example` 为 `.env` 并修改：

```bash
cp .env.example .env
```

编辑 `.env` 文件，设置你的 MongoDB 连接字符串。
