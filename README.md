# FAL.ai Image Generator Pro

基于 FAL.ai 的专业 AI 图像生成平台，支持多种模型和图像编辑功能。

[![Build and Push](https://github.com/GLH08/Fal-image/actions/workflows/docker-publish.yml/badge.svg)](https://github.com/GLH08/Fal-image/actions/workflows/docker-publish.yml)

## 支持的模型

| 模型 | 类型 | 特性 |
|------|------|------|
| FLUX 1.1 Pro Ultra | 文生图 | 高质量、多宽高比、安全控制 |
| FLUX 2 Pro | 文生图 | 最新一代、自定义尺寸 |
| Google Imagen 4 Preview | 文生图 | 高细节、多分辨率 |
| Gemini 3 Pro Image | 文生图 | 快速生成、支持4K |
| FLUX 2 Pro Edit | 图生图 | 图像编辑 |
| Gemini 3 Pro Image Edit | 图生图 | 多图输入编辑 |

## 快速开始

### 方式一：远程镜像部署（推荐）

无需克隆代码，直接拉取预构建镜像：

```bash
# 创建项目目录
mkdir fal-image && cd fal-image

# 下载配置文件
curl -O https://raw.githubusercontent.com/GLH08/Fal-image/main/docker-compose.ghcr.yml
curl -O https://raw.githubusercontent.com/GLH08/Fal-image/main/.env.example

# 配置环境变量
cp .env.example .env
# 编辑 .env，设置 FAL_KEY

# 启动服务
docker-compose -f docker-compose.ghcr.yml up -d

# 访问 http://localhost:8787
```

**一键部署命令：**
```bash
mkdir fal-image && cd fal-image && \
curl -O https://raw.githubusercontent.com/GLH08/Fal-image/main/docker-compose.ghcr.yml && \
curl -O https://raw.githubusercontent.com/GLH08/Fal-image/main/.env.example && \
cp .env.example .env && \
echo "请编辑 .env 文件设置 FAL_KEY，然后运行: docker-compose -f docker-compose.ghcr.yml up -d"
```

### 方式二：源码构建部署

```bash
# 克隆仓库
git clone https://github.com/GLH08/Fal-image.git
cd Fal-image

# 配置环境变量
cp .env.example .env
# 编辑 .env，设置 FAL_KEY

# 启动服务（本地构建）
docker-compose up -d

# 访问 http://localhost:8787
```

### 方式三：Node.js 部署

```bash
git clone https://github.com/GLH08/Fal-image.git
cd Fal-image
npm install
export FAL_KEY=your_fal_key_here
npm start
```

## 环境变量

| 变量 | 必需 | 默认值 | 说明 |
|------|------|--------|------|
| `FAL_KEY` | ✅ | - | FAL.ai API 密钥 |
| `PORT` | ❌ | 8787 | 服务端口 |
| `AUTH_PASSWORD` | ❌ | - | 界面访问密码 |
| `LSKY_URL` | ❌ | - | Lsky Pro 图床地址 |
| `LSKY_TOKEN` | ❌ | - | Lsky Pro API Token |
| `LSKY_STRATEGY_ID` | ❌ | 1 | Lsky 存储策略 ID |

## API 接口

### 生成图像

```bash
POST /api/generate
Content-Type: application/json

{
  "model": "flux-1.1-pro-ultra",
  "prompt": "A beautiful sunset over mountains",
  "aspectRatio": "16:9"
}
```

### 批量生成

```bash
POST /api/generate/bulk
Content-Type: application/json

{
  "requests": [
    {"model": "flux-1.1-pro-ultra", "prompt": "Cat", "aspectRatio": "1:1"},
    {"model": "imagen4-preview", "prompt": "Dog", "aspectRatio": "16:9"}
  ]
}
```

### 其他接口

- `GET /health` - 健康检查
- `GET /api/models` - 获取模型列表
- `GET /api/images` - 获取图像列表
- `GET /api/images/stats` - 获取统计信息
- `POST /api/images/manual` - 手动添加图像
- `DELETE /api/images/:id` - 删除图像
- `PATCH /api/images/:id/hide` - 隐藏图像

## 项目结构

```
├── app.js                  # 主服务
├── index.html              # Web 界面
├── login.html              # 登录页面
├── package.json            # 依赖配置
├── Dockerfile              # Docker 镜像
├── docker-compose.yml      # 源码构建配置
├── docker-compose.ghcr.yml # 远程镜像配置
├── .env.example            # 环境变量模板
├── eslint.config.js        # ESLint 配置
├── .github/workflows/      # CI/CD 配置
└── scripts/
    └── validate-config.js  # 配置验证脚本
```

## 开发命令

```bash
npm run dev       # 开发模式（自动重载）
npm run lint      # 代码检查
npm run lint:fix  # 自动修复
npm run validate  # 验证配置
npm test          # 运行测试
```

## Docker 管理

```bash
# 远程镜像部署
docker-compose -f docker-compose.ghcr.yml up -d          # 启动
docker-compose -f docker-compose.ghcr.yml pull           # 更新镜像
docker-compose -f docker-compose.ghcr.yml down           # 停止
docker-compose -f docker-compose.ghcr.yml logs -f        # 查看日志

# 源码构建部署
docker-compose up -d          # 启动
docker-compose down           # 停止
docker-compose logs -f        # 查看日志
docker-compose up -d --build  # 重新构建
```

## 功能特性

- 🎨 多模型支持（FLUX、Imagen、Gemini）
- 🖼️ 文生图 & 图生图
- 📐 多种宽高比和分辨率
- 🔒 可选密码保护
- 📊 使用统计
- 🖼️ 图库管理
- ☁️ Lsky Pro 图床集成
- 🛡️ 速率限制和安全防护
- 🐳 Docker 一键部署

## License

MIT
