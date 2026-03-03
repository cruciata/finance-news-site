const Parser = require('rss-parser');
const fs = require('fs');
const path = require('path');

const rssParser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml, text/xml'
  },
  timeout: 10000
});

// 黄金和股市相关的新闻源
const NEWS_SOURCES = [
  {
    name: 'WSJ Markets',
    url: 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml'
  },
  {
    name: 'Investing.com',
    url: 'https://www.investing.com/rss/news.rss'
  },
  {
    name: 'FXStreet',
    url: 'https://www.fxstreet.com/rss/news'
  },
  {
    name: 'MarketWatch',
    url: 'http://feeds.marketwatch.com/marketwatch/topstories'
  },
  {
    name: 'Seeking Alpha',
    url: 'https://seekingalpha.com/feed.xml'
  },
  {
    name: '华尔街见闻',
    url: 'https://wallstreetcn.com/rss.xml'
  }
];

// 关键词分类 - 只保留黄金和股市
const KEYWORDS = {
  黄金: ['gold', 'xau', '贵金属', 'precious metal', 'bullion', 'gold price', '金价', '黄金'],
  股市: ['stock', 'equity', 'share', 'market', '指数', '大盘', 'a股', '港股', '美股', 'nasdaq', 'dow', 's&p', 'sp500', '股市', '股票', '涨停', '跌停', '牛市', '熊市']
};

function categorize(title, content = '') {
  const text = (title + ' ' + content).toLowerCase();
  
  // 检查黄金关键词
  for (const keyword of KEYWORDS.黄金) {
    if (text.includes(keyword.toLowerCase())) {
      return '黄金';
    }
  }
  
  // 检查股市关键词
  for (const keyword of KEYWORDS.股市) {
    if (text.includes(keyword.toLowerCase())) {
      return '股市';
    }
  }
  
  // 默认分类（基于内容判断）
  if (text.includes('fed') || text.includes('federal reserve') || text.includes('interest rate') || 
      text.includes('gdp') || text.includes('inflation') || text.includes('经济') || text.includes('央行')) {
    return '股市'; // 宏观经济新闻归为股市
  }
  
  return null; // 不属于黄金或股市，过滤掉
}

function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

async function fetchFromSource(source) {
  try {
    console.log(`📡 正在抓取: ${source.name}`);
    const feed = await rssParser.parseURL(source.url);
    
    const items = [];
    for (const item of feed.items.slice(0, 10)) {
      const category = categorize(item.title || '', item.contentSnippet || item.content || '');
      
      // 只保留黄金和股市分类的新闻
      if (!category) continue;
      
      items.push({
        id: generateId(),
        title: item.title?.trim() || '无标题',
        summary: (item.contentSnippet || item.content || '暂无摘要').substring(0, 180) + '...',
        source: source.name,
        url: item.link || item.guid,
        publishTime: item.isoDate || item.pubDate || new Date().toISOString(),
        category: category
      });
    }
    
    console.log(`  ✅ ${source.name}: ${items.length} 条相关新闻`);
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
  
  return {
    lastUpdate: new Date().toISOString(),
    totalCount: uniqueNews.length,
    stats: { gold: goldCount, stock: stockCount },
    news: uniqueNews.slice(0, 40)
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
