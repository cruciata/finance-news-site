/**
 * 每日财经 - 前端应用
 */

// 数据文件路径
const DATA_URL = './data/news.json';

// 状态管理
let newsData = { news: [], lastUpdate: null };
let currentFilter = 'all';
let darkMode = false;

// DOM 元素
const newsGrid = document.getElementById('newsGrid');
const filterBar = document.getElementById('filterBar');
const lastUpdateEl = document.getElementById('lastUpdate');
const themeToggle = document.getElementById('themeToggle');
const refreshBtn = document.getElementById('refreshBtn');
const yearEl = document.getElementById('year');

// 初始化
async function init() {
  // 设置年份
  yearEl.textContent = new Date().getFullYear();
  
  // 检查系统主题偏好
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    toggleTheme();
  }
  
  // 加载新闻
  await loadNews();
  
  // 绑定事件
  bindEvents();
}

// 加载新闻数据
async function loadNews() {
  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error('Failed to load news');
    
    newsData = await response.json();
    renderNews();
    updateLastUpdateTime();
    initFilters();
  } catch (error) {
    console.error('加载新闻失败:', error);
    newsGrid.innerHTML = `
      <div class="error-state">
        <div class="error-icon">⚠️</div>
        <p>加载新闻数据失败</p>
        <p class="error-hint">请检查网络连接或稍后重试</p>
      </div>
    `;
  }
}

// 渲染新闻列表
function renderNews() {
  const filtered = currentFilter === 'all' 
    ? newsData.news 
    : newsData.news.filter(item => item.category === currentFilter);
  
  if (filtered.length === 0) {
    newsGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📰</div>
        <p>暂无新闻数据</p>
        <p class="empty-hint">新闻将在下次抓取后显示</p>
      </div>
    `;
    return;
  }
  
  newsGrid.innerHTML = filtered.map(item => createNewsCard(item)).join('');
}

// 创建新闻卡片 HTML
function createNewsCard(item) {
  return `
    <article class="news-card">
      <div class="card-header">
        <span class="category-tag category-${item.category}">${item.category}</span>
        <span class="source">${escapeHtml(item.source)}</span>
      </div>
      <h2 class="news-title">
        <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">
          ${escapeHtml(item.title)}
        </a>
      </h2>
      <p class="news-summary">${escapeHtml(item.summary)}</p>
      <div class="card-footer">
        <time class="publish-time">${formatTime(item.publishTime)}</time>
        <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer" class="read-more">
          阅读全文 →
        </a>
      </div>
    </article>
  `;
}

// 初始化分类筛选器
function initFilters() {
  const categories = ['all', ...new Set(newsData.news.map(n => n.category))];
  
  filterBar.innerHTML = categories.map(cat => `
    <button class="filter-btn ${cat === 'all' ? 'active' : ''}" data-filter="${cat}">
      ${cat === 'all' ? '全部' : cat}
    </button>
  `).join('');
  
  // 绑定筛选事件
  filterBar.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      filterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderNews();
    });
  });
}

// 切换主题
function toggleTheme() {
  darkMode = !darkMode;
  document.body.classList.toggle('dark', darkMode);
  themeToggle.textContent = darkMode ? '☀️' : '🌙';
  localStorage.setItem('darkMode', darkMode);
}

// 绑定事件
function bindEvents() {
  themeToggle.addEventListener('click', toggleTheme);
  
  refreshBtn.addEventListener('click', () => {
    refreshBtn.classList.add('spinning');
    loadNews().then(() => {
      setTimeout(() => refreshBtn.classList.remove('spinning'), 500);
    });
  });
  
  // 恢复主题偏好
  const savedDarkMode = localStorage.getItem('darkMode');
  if (savedDarkMode !== null) {
    const shouldBeDark = savedDarkMode === 'true';
    if (shouldBeDark !== darkMode) {
      toggleTheme();
    }
  }
}

// 更新时间显示
function updateLastUpdateTime() {
  if (newsData.lastUpdate) {
    lastUpdateEl.textContent = formatTime(newsData.lastUpdate);
  } else {
    lastUpdateEl.textContent = '未知';
  }
}

// 格式化时间
function formatTime(timeStr) {
  const date = new Date(timeStr);
  const now = new Date();
  const diff = (now - date) / 1000; // 秒
  
  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
  
  return date.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// HTML 转义
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 启动应用
document.addEventListener('DOMContentLoaded', init);
