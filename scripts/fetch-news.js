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

// 国内可访问的新闻源
const NEWS_SOURCES = [
  {
    name: '36氪',
    url: 'https://36kr.com/feed',
    defaultCategory: '科技'
  },
  {
    name: 'Solidot',
    url: 'https://www.solidot.org/index.rss',
    defaultCategory: '科技'
  },
  {
    name: '虎嗅网',
    url: 'https://www.huxiu.com/rss/0.xml',
    defaultCategory: '财经'
  },
  {
    name: '爱范儿',
    url: 'https://www.ifanr.com/feed',
    defaultCategory: '科技'
  },
  {
    name: 'cnBeta',
    url: 'https://www.cnbeta.com/backend.php',
    defaultCategory: '科技'
  }
];

// 关键词分类
const KEYWORDS = {
  财经: ['金融', '银行', '保险', '投资', '理财', '经济', '货币', '汇率', '基金', '债券', '期货', '外汇', '贷款', '存款', '支付', '财经'],
  科技: ['科技', '技术', '互联网', 'AI', '人工智能', '区块链', '芯片', '半导体', '5G', '云计算', '大数据', '物联网', '科技'],
  创业: ['创业', '融资', '投资', 'startup', 'vc', 'pe', '天使投资', '独角兽', 'IPO', '上市', '并购', '收购', '创业']
};

function categorize(title, content = '', defaultCategory) {
  const text = (title + ' ' + content).toLowerCase();
  
  for (const [category, words] of Object.entries(KEYWORDS)) {
    for (const word of words) {
      if (text.includes(word.toLowerCase())) {
        return category;
      }
    }
  }
  
  return defaultCategory || '财经';
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
    for (const item of feed.items.slice(0, 10)) {
      const category = categorize(
        item.title || '', 
        item.contentSnippet || '',
        source.defaultCategory
      );
      
      items.push({
        id: generateId(),
        title: item.title?.trim() || '无标题',
        summary: cleanHtml(item.contentSnippet || item.description).substring(0, 160) + '...',
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
  console.log('🚀 开始抓取新闻...\n');
  
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
  
  // 统计
  const stats = {};
  for (const item of uniqueNews) {
    stats[item.category] = (stats[item.category] || 0) + 1;
  }
  
  console.log(`\n✅ 抓取完成`);
  console.log(`   📰 总计: ${uniqueNews.length} 条`);
  console.log(`   🖼️  带图片: ${uniqueNews.filter(n => n.image).length} 条`);
  for (const [cat, count] of Object.entries(stats)) {
    console.log(`   • ${cat}: ${count} 条`);
  }
  
  return {
    lastUpdate: new Date().toISOString(),
    totalCount: uniqueNews.length,
    stats: stats,
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
