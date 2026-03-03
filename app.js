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
  init3DBackground();
  await loadNews();
  bindEvents();
}

// 3D Background Animation
function init3DBackground() {
  const canvas = document.getElementById('bgCanvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;
  
  const particles = [];
  const particleCount = 25;
  
  class Particle {
    constructor() {
      this.reset();
    }
    
    reset() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.z = Math.random() * 2 + 0.5;
      this.vx = (Math.random() - 0.5) * 0.3;
      this.vy = (Math.random() - 0.5) * 0.3;
      this.radius = Math.random() * 2 + 1;
      this.opacity = Math.random() * 0.3 + 0.1;
    }
    
    update() {
      this.x += this.vx * this.z;
      this.y += this.vy * this.z;
      
      if (this.x < 0 || this.x > width) this.vx *= -1;
      if (this.y < 0 || this.y > height) this.vy *= -1;
    }
    
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * this.z, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(102, 126, 234, ${this.opacity})`;
      ctx.fill();
    }
  }
  
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }
  
  function animate() {
    ctx.clearRect(0, 0, width, height);
    
    // Draw connections
    particles.forEach((p1, i) => {
      particles.slice(i + 1).forEach(p2 => {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 150) {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(102, 126, 234, ${0.1 * (1 - dist / 150)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      });
    });
    
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    
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
  
  // Animate cards entrance
  const cards = newsGrid.querySelectorAll('.news-card');
  cards.forEach((card, i) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    setTimeout(() => {
      card.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, i * 80);
  });
}

// Create News Card
function createNewsCard(item, index) {
  return `
    <article class="news-card category-${item.category}" style="animation-delay: ${index * 0.1}s">
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
          阅读全文
        </a>
      </div>
    </article>
  `;
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
  
  // 3D tilt effect on cards
  newsGrid.addEventListener('mousemove', (e) => {
    const card = e.target.closest('.news-card');
    if (!card) return;
    
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = (y - centerY) / 20;
    const rotateY = (centerX - x) / 20;
    
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
  });
  
  newsGrid.addEventListener('mouseleave', (e) => {
    const card = e.target.closest('.news-card');
    if (card) {
      card.style.transform = '';
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
