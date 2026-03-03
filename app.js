/**
 * 范の财经 - Vercel Style Edition
 */

const DATA_URL = './data/news.json';

let newsData = { news: [], lastUpdate: null };
let currentFilter = 'all';

// DOM Elements
const newsGrid = document.getElementById('newsGrid');
const filterBar = document.getElementById('filterBar');
const lastUpdateEl = document.getElementById('lastUpdate');
const refreshBtn = document.getElementById('refreshBtn');
const yearEl = document.getElementById('year');

// Initialize
async function init() {
  yearEl.textContent = new Date().getFullYear();
  initParticleBackground();
  await loadNews();
  bindEvents();
}

// 粒子连线背景
function initParticleBackground() {
  const canvas = document.getElementById('bgCanvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;
  
  const particles = [];
  const particleCount = 30;
  const maxDistance = 150;
  
  class Particle {
    constructor() {
      this.reset();
    }
    
    reset() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.5;
      this.vy = (Math.random() - 0.5) * 0.5;
      this.radius = Math.random() * 2 + 0.5;
    }
    
    update() {
      this.x += this.vx;
      this.y += this.vy;
      
      if (this.x < 0 || this.x > width) this.vx *= -1;
      if (this.y < 0 || this.y > height) this.vy *= -1;
    }
    
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(102, 126, 234, 0.5)';
      ctx.fill();
    }
  }
  
  // 创建粒子
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }
  
  // 绘制连线
  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < maxDistance) {
          const opacity = (1 - dist / maxDistance) * 0.3;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(102, 126, 234, ${opacity})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }
  
  let frameCount = 0;
  function animate() {
    frameCount++;
    ctx.clearRect(0, 0, width, height);
    
    // 每2帧更新一次，优化性能
    if (frameCount % 2 === 0) {
      particles.forEach(p => p.update());
    }
    
    drawConnections();
    particles.forEach(p => p.draw());
    
    requestAnimationFrame(animate);
  }
  
  animate();
  
  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });
}

// Load News Data
async function loadNews() {
  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error('Failed to load news');
    
    newsData = await response.json();
    renderNews();
    updateLastUpdateTime();
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

// Render News
function renderNews() {
  const filtered = currentFilter === 'all' 
    ? newsData.news 
    : newsData.news.filter(item => item.category === currentFilter);
  
  if (filtered.length === 0) {
    newsGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📊</div>
        <p>暂无${currentFilter === 'all' ? '' : currentFilter}新闻</p>
        <p class="empty-hint">数据正在更新中，请稍后再试</p>
      </div>
    `;
    return;
  }
  
  newsGrid.innerHTML = filtered.map((item, index) => createNewsCard(item, index)).join('');
}

// Create News Card with Image
function createNewsCard(item, index) {
  // 如果没有图片，使用随机风景图
  const imageUrl = item.image || getRandomLandscapeImage();
  
  const imageHtml = `
    <div class="card-image">
      <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">
        <img src="${escapeHtml(imageUrl)}" alt="" loading="lazy" onerror="this.src='${getRandomLandscapeImage()}'">
      </a>
      <div class="card-image-overlay"></div>
    </div>
  `;
  
  return `
    <article class="news-card category-${item.category}" data-url="${escapeHtml(item.url)}" style="animation-delay: ${index * 0.08}s">
      ${imageHtml}
      <div class="card-body">
        <div class="card-header">
          <span class="category-tag ${item.category}">${item.category}</span>
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
      </div>
    </article>
  `;
}

// 获取随机风景图 - 使用 picsum.photos
function getRandomLandscapeImage() {
  const width = 800;
  const height = 400;
  const randomId = Math.floor(Math.random() * 1000);
  return `https://picsum.photos/${width}/${height}?random=${randomId}`;
}

// Bind Events
function bindEvents() {
  refreshBtn.addEventListener('click', () => {
    refreshBtn.classList.add('spinning');
    loadNews().then(() => {
      setTimeout(() => refreshBtn.classList.remove('spinning'), 800);
    });
  });
  
  // Filter tabs
  filterBar.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      filterBar.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.filter;
      renderNews();
    });
  });
  
  // Card click handler - open article
  newsGrid.addEventListener('click', (e) => {
    const card = e.target.closest('.news-card');
    if (!card) return;
    
    // Don't trigger if clicking on a link directly
    if (e.target.closest('a')) return;
    
    const url = card.dataset.url;
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  });
}

// Update Time
function updateLastUpdateTime() {
  if (newsData.lastUpdate) {
    lastUpdateEl.textContent = formatTime(newsData.lastUpdate);
  } else {
    lastUpdateEl.textContent = '未知';
  }
}

// Format Time
function formatTime(timeStr) {
  const date = new Date(timeStr);
  const now = new Date();
  const diff = (now - date) / 1000;
  
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

// Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Start
document.addEventListener('DOMContentLoaded', init);
