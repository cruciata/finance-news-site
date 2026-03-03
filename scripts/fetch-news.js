const Parser = require('rss-parser');
const fs = require('fs');
const path = require('path');

const rssParser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
});

// 可靠的新闻源配置
const NEWS_SOURCES = [
  {
    name: 'Reuters 路透',
    category: '国际',
    url: 'https://www.reutersagency.com/feed/?taxonomy=markets&post_type=reuters-best'
  },
  {
    name: 'WSJ  Markets',
    category: '市场',
    url: 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml'
  },
  {
    name: 'CNBC Finance',
    category: '市场',
    url: 'https://www.cnbc.com/id/19789612/device/rss/rss.xml'
  },
  {
    name: 'Bloomberg',
    category: '宏观',
    url: 'https://feeds.bloomberg.com/markets/news.rss'
  },
  {
    name: 'FT Markets',
    category: '市场',
    url: 'https://www.ft.com/markets?format=rss'
  },
  {
    name: '36氪',
    category: '科技',
    url: 'https://36kr.com/feed'
  },
  {
    name: 'Solidot',
    category: '科技',
    url: 'https://www.solidot.org/index.rss'
  }
];

// 简单的关键词分类
function categorize(title, content = '') {
  const text = (title + ' ' + content).toLowerCase();
  if (text.includes('stock') || text.includes('share') || text.includes('equity') || text.includes('股')) return '股市';
  if (text.includes('crypto') || text.includes('bitcoin') || text.includes('blockchain') || text.includes('币')) return '科技';
  if (text.includes('realestate') || text.includes('property') || text.includes('housing') || text.includes('房')) return '房产';
  if (text.includes('fed') || text.includes('interest rate') || text.includes('inflation') || text.includes('gdp') || text.includes('经济')) return '宏观';
  if (text.includes('tech') || text.includes('ai') || text.includes('artificial') || text.includes('科技')) return '科技';
  return '市场';
}

function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

async function fetchFromSource(source) {
  try {
    console.log(`📡 正在抓取: ${source.name}`);
    const feed = await rssParser.parseURL(source.url);
    
    return feed.items.slice(0, 8).map(item => ({
      id: generateId(),
      title: item.title?.trim() || '无标题',
      summary: item.contentSnippet?.substring(0, 200) + '...' || item.content?.substring(0, 200) + '...' || '暂无摘要',
      source: source.name,
      url: item.link || item.guid,
      publishTime: item.isoDate || new Date().toISOString(),
      category: source.category || categorize(item.title, item.contentSnippet)
    }));
  } catch (error) {
    console.error(`❌ 抓取失败 ${source.name}:`, error.message);
    return [];
  }
}

async function fetchAllNews() {
  console.log('🚀 开始抓取财经新闻...\n');
  
  const allNews = [];
  
  for (const source of NEWS_SOURCES) {
    const news = await fetchFromSource(source);
    allNews.push(...news);
    await new Promise(resolve => setTimeout(resolve, 1000)); // 礼貌延迟
  }
  
  // 去重（基于URL）
  const seen = new Set();
  const uniqueNews = allNews.filter(item => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
  
  // 按时间排序
  uniqueNews.sort((a, b) => new Date(b.publishTime) - new Date(a.publishTime));
  
  console.log(`\n✅ 成功抓取 ${uniqueNews.length} 条新闻`);
  
  return {
    lastUpdate: new Date().toISOString(),
    totalCount: uniqueNews.length,
    news: uniqueNews.slice(0, 50) // 最多保留50条
  };
}

async function main() {
  try {
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const newsData = await fetchAllNews();
    
    const outputPath = path.join(dataDir, 'news.json');
    fs.writeFileSync(outputPath, JSON.stringify(newsData, null, 2), 'utf-8');
    
    console.log(`💾 数据已保存到: ${outputPath}`);
    
    // 同时生成一个 HTML 版本用于预览
    const htmlContent = generateHtml(newsData);
    const htmlPath = path.join(dataDir, 'news-preview.html');
    fs.writeFileSync(htmlPath, htmlContent, 'utf-8');
    
    console.log(`📄 HTML预览已生成: ${htmlPath}`);
    
  } catch (error) {
    console.error('❌ 抓取失败:', error);
    process.exit(1);
  }
}

function generateHtml(data) {
  const newsList = data.news.map(item => `
    <div style="border-bottom:1px solid #eee;padding:16px 0;">
      <span style="background:#2563eb;color:white;padding:2px 8px;border-radius:4px;font-size:12px;">${item.category}</span>
      <span style="color:#666;font-size:12px;margin-left:8px;">${item.source}</span>
      <h3 style="margin:8px 0;"><a href="${item.url}" target="_blank">${item.title}</a></h3>
      <p style="color:#666;font-size:14px;">${item.summary}</p>
      <time style="color:#999;font-size:12px;">${new Date(item.publishTime).toLocaleString('zh-CN')}</time>
    </div>
  `).join('');
  
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>财经新闻预览</title>
  <style>body{font-family:system-ui;max-width:800px;margin:40px auto;padding:20px;}</style>
</head>
<body>
  <h1>📈 每日财经新闻</h1>
  <p style="color:#666;">最后更新: ${new Date(data.lastUpdate).toLocaleString('zh-CN')}</p>
  <p>共 ${data.totalCount} 条新闻</p>
  <div>${newsList}</div>
</body>
</html>`;
}

main();
