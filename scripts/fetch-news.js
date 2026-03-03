const Parser = require('rss-parser');
const fs = require('fs');
const path = require('path');

const rssParser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  },
  timeout: 15000,
  customFields: {
    item: ['media:content', 'media:thumbnail', 'enclosure', 'description', 'content:encoded']
  }
});

// 可靠的新闻源
const NEWS_SOURCES = [
  {
    name: '36氪',
    url: 'https://36kr.com/feed'
  },
  {
    name: 'Solidot',
    url: 'https://www.solidot.org/index.rss'
  },
  {
    name: 'TechCrunch',
    url: 'https://techcrunch.com/feed/'
  },
  {
    name: 'Hacker News',
    url: 'https://hnrss.org/frontpage'
  }
];

// 关键词分类 - 黄金和股市
const KEYWORDS = {
  黄金: ['黄金', 'gold', 'xau', 'au', '贵金属', '金价', '白银', 'gold price', 'bullion'],
  股市: ['股票', '股市', 'a股', '港股', '美股', '大盘', '指数', '涨停', '跌停', 'stock', 'share', 'market', 'nasdaq', 'dow', 'sp500', ' equities', 'ipo', '上市']
};

function categorize(title, content = '') {
  const text = (title + ' ' + content).toLowerCase();
  
  for (const kw of KEYWORDS.黄金) {
    if (text.includes(kw.toLowerCase())) return '黄金';
  }
  
  for (const kw of KEYWORDS.股市) {
    if (text.includes(kw.toLowerCase())) return '股市';
  }
  
  return null;
}

function extractImage(item) {
  // media:content
  if (item['media:content']?.url) return item['media:content'].url;
  if (item['media:content']?.$?.url) return item['media:content'].$.url;
  
  // media:thumbnail
  if (item['media:thumbnail']?.url) return item['media:thumbnail'].url;
  if (item['media:thumbnail']?.$?.url) return item['media:thumbnail'].$.url;
  
  // enclosure
  if (item.enclosure?.url?.match(/\.(jpg|jpeg|png|gif|webp)/i)) {
    return item.enclosure.url;
  }
  
  // 从内容中提取
  const content = item['content:encoded'] || item.content || item.description || '';
  const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch) return imgMatch[1];
  
  return null;
}

function cleanHtml(html) {
  return html?.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() || '';
}

function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

async function fetchFromSource(source) {
  try {
    console.log(`📡 正在抓取: ${source.name}`);
    const feed = await rssParser.parseURL(source.url);
    
    const items = [];
    for (const item of feed.items.slice(0, 8)) {
      const category = categorize(item.title || '', item.contentSnippet || '');
      if (!category) continue;
      
      items.push({
        id: generateId(),
        title: item.title?.trim() || '无标题',
        summary: cleanHtml(item.contentSnippet || item.description).substring(0, 150) + '...',
        source: source.name,
        url: item.link || item.guid,
        publishTime: item.isoDate || item.pubDate || new Date().toISOString(),
        category: category,
        image: extractImage(item)
      });
    }
    
    console.log(`  ✅ ${source.name}: ${items.length} 条`);
    return items;
  } catch (error) {
    console.error(`  ❌ 抓取失败 ${source.name}:`, error.message);
    return [];
  }
}

async function fetchAllNews() {
  console.log('🚀 开始抓取黄金 & 股市新闻...\n');
  
  const allNews = [];
  
  for (const source of NEWS_SOURCES) {
    const news = await fetchFromSource(source);
    allNews.push(...news);
    await new Promise(resolve => setTimeout(resolve, 800));
  }
  
  // 去重
  const seen = new Set();
  const uniqueNews = allNews.filter(item => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
  
  // 按时间排序
  uniqueNews.sort((a, b) => new Date(b.publishTime) - new Date(a.publishTime));
  
  const goldCount = uniqueNews.filter(n => n.category === '黄金').length;
  const stockCount = uniqueNews.filter(n => n.category === '股市').length;
  
  console.log(`\n✅ 抓取完成`);
  console.log(`   🥇 黄金: ${goldCount} 条`);
  console.log(`   📊 股市: ${stockCount} 条`);
  console.log(`   📰 总计: ${uniqueNews.length} 条`);
  console.log(`   🖼️  带图片: ${uniqueNews.filter(n => n.image).length} 条`);
  
  return {
    lastUpdate: new Date().toISOString(),
    totalCount: uniqueNews.length,
    stats: { gold: goldCount, stock: stockCount },
    news: uniqueNews.slice(0, 30)
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
    
    console.log(`\n💾 数据已保存: ${outputPath}`);
    
  } catch (error) {
    console.error('❌ 抓取失败:', error);
    process.exit(1);
  }
}

main();
