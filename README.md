# 每日财经 | Finance Daily

一个自动聚合每日财经新闻的静态网站，每2小时自动抓取更新。

🔗 **在线预览**: `https://你的用户名.github.io/finance-news-site/`

## 🌟 特性

- 📰 自动抓取多个权威财经新闻源
- 🌓 支持深色/浅色模式切换
- 📱 响应式设计，完美支持移动端
- 🏷️ 按分类筛选新闻（股市、宏观、科技、房产、国际、市场）
- ⚡ 每2小时自动更新
- 🚀 使用 GitHub Pages 免费托管
- 🔄 手动刷新按钮

## 📊 新闻来源

| 来源 | 分类 | 语言 |
|------|------|------|
| Reuters 路透 | 国际 | 英文 |
| WSJ Markets | 市场 | 英文 |
| CNBC Finance | 市场 | 英文 |
| Bloomberg | 宏观 | 英文 |
| Financial Times | 市场 | 英文 |
| 36氪 | 科技 | 中文 |
| Solidot | 科技 | 中文 |

## 🚀 快速开始

### 1. 创建 GitHub 仓库

访问 https://github.com/new 创建一个新仓库，命名为 `finance-news-site`

### 2. 上传代码

```bash
# 克隆这个仓库到本地
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/你的用户名/finance-news-site.git
git push -u origin main
```

### 3. 启用 GitHub Pages

1. 进入仓库的 **Settings** → **Pages**
2. **Source** 选择 "GitHub Actions"
3. 等待自动部署完成（约1-2分钟）

### 4. 运行抓取脚本

首次需要手动触发一次抓取：
1. 进入仓库的 **Actions** 标签
2. 选择 "Fetch News and Deploy" 工作流
3. 点击 "Run workflow" 手动运行

## 🛠️ 本地开发

```bash
# 克隆仓库
git clone https://github.com/你的用户名/finance-news-site.git
cd finance-news-site

# 安装依赖
npm install

# 抓取最新新闻
npm run fetch-news

# 本地预览（使用任意静态服务器）
# Python 3
python -m http.server 8080
# 或 Node.js
npx serve .
# 然后访问 http://localhost:8080
```

## 📝 项目结构

```
├── index.html          # 主页
├── app.js              # 前端逻辑
├── styles.css          # 样式
├── scripts/
│   └── fetch-news.js   # 新闻抓取脚本
├── data/
│   └── news.json       # 新闻数据
├── .github/workflows/
│   └── deploy.yml      # 自动部署配置
└── README.md
```

## 🔧 自定义配置

### 添加新的新闻源

编辑 `scripts/fetch-news.js`，在 `NEWS_SOURCES` 数组中添加：

```javascript
{
  name: '新闻源名称',
  category: '分类名称',
  url: 'RSS地址'
}
```

### 修改更新频率

编辑 `.github/workflows/deploy.yml` 中的 cron 表达式：

```yaml
schedule:
  # 每小时运行一次
  - cron: '0 * * * *'
  # 或每天运行两次（早8点和晚8点）
  - cron: '0 8,20 * * *'
```

## 📄 许可

MIT License

---

**注意**: 本项目仅供学习和个人使用，抓取的数据版权归原作者所有。
