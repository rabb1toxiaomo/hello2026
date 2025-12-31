/**
 * 2026 马年祝福留言墙 - 客户端
 * 
 * 项目信息:
 * - 完成时间: 2025-12-31 12:00-24:00 GMT+8
 * - 作者: @xiaomo
 * - 状态: 已完成并部署
 * 
 * @author @xiaomo
 * @date 2025-12-31
 */

// 全局状态
let currentUser = null;
let onlineId = null;
let blessingIndex = 0;
let blessingInterval = null;
let danmakuInterval = null;
let countdownInterval = null;
let musicPlaying = false;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  initBackground();
  initEventListeners();
  initCountdown();
  // 立即启动祝福语轮播（不依赖用户登录）
  startBlessingCarousel();
  startDanmaku();
  startStatsUpdate();
  initHorseFollower();
});

// 检查认证状态
function checkAuth() {
  const saved = localStorage.getItem('user');
  if (saved) {
    try {
      currentUser = JSON.parse(saved);
      showMainPage();
      startHeartbeat();
    } catch (e) {
      localStorage.removeItem('user');
    }
  }
}

// 显示主页面 - 已移到文件末尾优化版本

// 显示登录表单
function showLogin() {
  document.getElementById('registerForm').style.display = 'none';
  document.getElementById('loginForm').style.display = 'block';
}

// 显示注册表单
function showRegister() {
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('registerForm').style.display = 'block';
}

// 处理登录
async function handleLogin() {
  const nickname = document.getElementById('loginNick').value.trim();
  const password = document.getElementById('loginPwd').value;
  
  if (!nickname || !password) {
    showToast('请填写完整信息', 'error');
    return;
  }
  
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname, password })
    });
    const data = await res.json();
    
    if (data.success) {
      currentUser = data;
      localStorage.setItem('user', JSON.stringify(data));
      showToast(`欢迎回来 ${data.nickname}！🎉`, 'success');
      showMainPage();
      startHeartbeat();
      // 触发烟花效果
      triggerFireworks(() => {
        // 烟花结束后播放背景音乐
        loadMusicForIndustry(data.industry || 'general');
      });
    } else {
      showToast(data.error || '登录失败', 'error');
    }
  } catch (err) {
    showToast('网络错误', 'error');
  }
}

// 处理注册
async function handleRegister() {
  const nickname = document.getElementById('regNick').value.trim();
  const password = document.getElementById('regPwd').value;
  const gender = document.getElementById('regGender').value;
  const age = document.getElementById('regAge').value ? parseInt(document.getElementById('regAge').value) : null;
  const industry = document.getElementById('regIndustry').value;
  
  if (!nickname || !password || !industry || industry === 'general') {
    showToast('请填写昵称、密码和选择行业', 'error');
    return;
  }
  
  try {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname, password, gender, age, industry })
    });
    const data = await res.json();
    
    if (data.success) {
      currentUser = data;
      localStorage.setItem('user', JSON.stringify(data));
      showToast(`欢迎 ${nickname}！🎉`, 'success');
      showMainPage();
      startHeartbeat();
      // 触发烟花效果
      triggerFireworks(() => {
        // 烟花结束后播放背景音乐
        loadMusicForIndustry(industry);
      });
    } else {
      showToast(data.error || '注册失败', 'error');
    }
  } catch (err) {
    showToast('网络错误', 'error');
  }
}

// 心跳保持在线
function startHeartbeat() {
  onlineId = 'user_' + Date.now() + '_' + Math.random();
  setInterval(() => {
    if (currentUser) {
      fetch('/api/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ odId: onlineId, nickname: currentUser.nickname })
      });
    }
  }, 20000);
}

// 退出登录 - 在主页面显示退出确认区域
function handleLogout() {
  console.log('handleLogout called');
  // 显示主页面的退出确认区域
  const logoutSection = document.getElementById('logoutSection');
  if (logoutSection) {
    logoutSection.style.display = 'block';
    // 滚动到退出确认区域
    logoutSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    // 绑定按钮事件（如果还没有绑定）
    setTimeout(() => {
      const generateBtn = document.getElementById('logoutGenerateBtn');
      const confirmBtn = document.getElementById('logoutConfirmBtn');
      const cancelBtn = document.getElementById('logoutCancelBtn');
      
      if (generateBtn && !generateBtn.dataset.bound) {
        generateBtn.addEventListener('click', handleLogoutGenerate);
        generateBtn.dataset.bound = 'true';
      }
      if (confirmBtn && !confirmBtn.dataset.bound) {
        confirmBtn.addEventListener('click', handleLogoutConfirm);
        confirmBtn.dataset.bound = 'true';
      }
      if (cancelBtn && !cancelBtn.dataset.bound) {
        cancelBtn.addEventListener('click', () => {
          logoutSection.style.display = 'none';
        });
        cancelBtn.dataset.bound = 'true';
      }
    }, 100);
  }
}

// 关闭退出确认区域
function closeLogoutSection() {
  const logoutSection = document.getElementById('logoutSection');
  if (logoutSection) {
    logoutSection.style.display = 'none';
  }
}

// 退出时生成明信片
function handleLogoutGenerate() {
  closeLogoutSection();
  // 显示主页面的明信片区域
  const postcardSection = document.getElementById('postcardSection');
  if (postcardSection) {
    postcardSection.style.display = 'block';
    const preview = document.getElementById('postcardPreview');
    if (preview) preview.style.display = 'none';
    const message = document.getElementById('postcardMessage');
    if (message) message.value = '';
    // 滚动到明信片区域
    postcardSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// 确认退出
function handleLogoutConfirm() {
  // 直接执行退出，不再二次确认
  if (confirm('确定要退出吗？')) {
    doLogout();
  } else {
    // 如果取消，关闭退出确认区域
    closeLogoutSection();
  }
}

// 执行退出
function doLogout() {
  currentUser = null;
  onlineId = null;
  localStorage.removeItem('user');
  location.reload();
}

// 加载消息
async function loadMessages() {
  try {
    const res = await fetch('/api/messages');
    const messages = await res.json();
    displayMessages(messages);
  } catch (err) {
    console.error('Load messages error:', err);
  }
}

// 显示消息 - 气球全局飘动模式
function displayMessages(messages) {
  const bubbleWall = document.getElementById('bubbleWall');
  
  // 清空
  bubbleWall.innerHTML = '';
  bubbleWall.style.display = 'block';
  
  messages.forEach((msg, index) => {
    const time = new Date(msg.created_at).toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // 创建气球消息（延迟创建，避免同时出现太多）
    setTimeout(() => {
      const bubbleEl = createBubbleMessage(msg, time, index);
      bubbleWall.appendChild(bubbleEl);
      
      // 添加进入动画
      setTimeout(() => {
        bubbleEl.classList.add('animate-in');
      }, 50);
    }, index * 100); // 每个气泡延迟100ms创建
  });
}

// 创建气泡消息（气球全局飘动）
function createBubbleMessage(msg, time, index) {
  const msgEl = document.createElement('div');
  msgEl.className = 'message-item bubble balloon-float';
  msgEl.dataset.id = msg.id;
  msgEl.dataset.userId = msg.user_id;
  
  // 获取视口尺寸
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  // 随机初始位置（避免太靠近边缘和顶部导航栏）
  const topMargin = 150; // 顶部留出空间给导航栏
  const margin = 50;
  const bubbleWidth = 300;
  const bubbleHeight = 200;
  const startX = margin + Math.random() * (viewportWidth - 2 * margin - bubbleWidth);
  const startY = topMargin + Math.random() * (viewportHeight - topMargin - margin - bubbleHeight);
  
  // 设置初始位置
  msgEl.style.left = `${startX}px`;
  msgEl.style.top = `${startY}px`;
  
  // 生成随机飘动路径（在整个屏幕范围内，但避开顶部导航栏）
  const pathRange = Math.min(500, viewportWidth * 0.4); // 飘动范围
  const mid1X = startX + (Math.random() - 0.5) * pathRange;
  const mid1Y = startY + (Math.random() - 0.5) * pathRange;
  const mid2X = startX + (Math.random() - 0.5) * pathRange;
  const mid2Y = startY + (Math.random() - 0.5) * pathRange;
  const mid3X = startX + (Math.random() - 0.5) * pathRange;
  const mid3Y = startY + (Math.random() - 0.5) * pathRange;
  
  // 确保路径点不超出视口
  const clampX = (x) => Math.max(margin, Math.min(viewportWidth - margin - bubbleWidth, x));
  const clampY = (y) => Math.max(topMargin, Math.min(viewportHeight - margin - bubbleHeight, y));
  
  // 随机动画延迟和时长
  const randomDelay = Math.random() * 3; // 0-3秒延迟
  const randomDuration = 20 + Math.random() * 15; // 20-35秒动画时长，更慢更优雅
  
  // 计算相对位移（相对于初始位置）
  const delta1X = clampX(mid1X) - startX;
  const delta1Y = clampY(mid1Y) - startY;
  const delta2X = clampX(mid2X) - startX;
  const delta2Y = clampY(mid2Y) - startY;
  const delta3X = clampX(mid3X) - startX;
  const delta3Y = clampY(mid3Y) - startY;
  
  // 设置动画变量（使用相对位移）
  msgEl.style.setProperty('--start-x', '0px');
  msgEl.style.setProperty('--start-y', '0px');
  msgEl.style.setProperty('--mid1-x', `${delta1X}px`);
  msgEl.style.setProperty('--mid1-y', `${delta1Y}px`);
  msgEl.style.setProperty('--mid2-x', `${delta2X}px`);
  msgEl.style.setProperty('--mid2-y', `${delta2Y}px`);
  msgEl.style.setProperty('--mid3-x', `${delta3X}px`);
  msgEl.style.setProperty('--mid3-y', `${delta3Y}px`);
  msgEl.style.setProperty('--float-delay', `${randomDelay}s`);
  msgEl.style.setProperty('--float-duration', `${randomDuration}s`);
  
  // 强制应用动画，确保动画能正常工作
  msgEl.style.animation = `balloonFloatGlobal ${randomDuration}s ease-in-out ${randomDelay}s infinite`;
  
  const isOwn = currentUser && msg.user_id === currentUser.userId;
  
  msgEl.innerHTML = `
    <div class="message-header">
      <span class="message-author">${escapeHtml(msg.nickname)}</span>
      <span class="message-time">${time}</span>
      ${isOwn ? `<button class="msg-action-btn" onclick="editMessage(${msg.id})" title="编辑">✏️</button>
                  <button class="msg-action-btn" onclick="deleteMessage(${msg.id})" title="删除">🗑️</button>` : ''}
    </div>
    <div class="message-content">${escapeHtml(msg.content)}</div>
    ${msg.replies && msg.replies.length > 0 ? `
      <div class="replies-container">
        ${msg.replies.map(reply => `
          <div class="reply-item">
            <span class="reply-author">${escapeHtml(reply.nickname)}</span>
            <span class="reply-content">${escapeHtml(reply.content)}</span>
          </div>
        `).join('')}
      </div>
    ` : ''}
    <button class="reply-btn" onclick="showReplyForm(${msg.id})">💬 回复</button>
  `;
  
  return msgEl;
}

// 创建星空消息
function createStarMessage(msg, time, index) {
  const starEl = document.createElement('div');
  starEl.className = 'star-item';
  starEl.dataset.id = msg.id;
  
  const angle = (index * 137.5) % 360; // 黄金角度分布
  const distance = 150 + (index % 5) * 50;
  const x = Math.cos(angle * Math.PI / 180) * distance;
  const y = Math.sin(angle * Math.PI / 180) * distance;
  
  starEl.style.left = `calc(50% + ${x}px)`;
  starEl.style.top = `calc(50% + ${y}px)`;
  starEl.style.animationDelay = `${index * 0.1}s`;
  
  starEl.innerHTML = `
    <div class="star-content">
      <div class="star-author">${escapeHtml(msg.nickname)}</div>
      <div class="star-text">${escapeHtml(msg.content)}</div>
      <div class="star-time">${time}</div>
    </div>
  `;
  
  return starEl;
}

// 发送消息
async function sendMessage() {
  const input = document.getElementById('messageInput');
  const content = input.value.trim();
  
  if (!content) {
    showToast('请输入祝福内容', 'error');
    return;
  }
  
  if (!currentUser) {
    showToast('请先登录', 'error');
    return;
  }
  
  try {
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.userId, content })
    });
    const data = await res.json();
    
    if (data.success) {
      input.value = '';
      updateCharCount();
      showToast('祝福发送成功！', 'success');
      loadMessages();
      createFirework();
      // 立即更新统计数据
      updateTopStats();
    } else {
      showToast('发送失败', 'error');
    }
  } catch (err) {
    showToast('网络错误', 'error');
  }
}

// 字符计数
function updateCharCount() {
  const input = document.getElementById('messageInput');
  const count = document.getElementById('charCount');
  count.textContent = input.value.length;
}

// 初始化事件监听
function initEventListeners() {
  // 发送按钮
  document.getElementById('sendBtn').addEventListener('click', sendMessage);
  
  // Enter发送
  document.getElementById('messageInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  
  // 字符计数
  document.getElementById('messageInput').addEventListener('input', updateCharCount);
  
  // 视图切换
  // 视图切换已移除，只使用气球浮动模式
  
  // 点赞
  document.getElementById('likeBtn').addEventListener('click', async () => {
    if (!currentUser) {
      showToast('请先登录', 'error');
      return;
    }
    try {
      await fetch('/api/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.userId })
      });
      createLikeEffect();
      showToast('点赞成功！', 'success');
      // 立即更新统计数据
      updateTopStats();
    } catch (err) {
      showToast('操作失败', 'error');
    }
  });
  
  // 礼物按钮
  document.querySelectorAll('.gift-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!currentUser) {
        showToast('请先登录', 'error');
        return;
      }
      const gift = btn.dataset.gift;
      try {
        await fetch('/api/gift', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser.userId })
        });
        
        // 特殊处理：放烟花点击一次放10次
        if (gift === 'firework') {
          // 直接触发10次烟花效果
          for (let i = 0; i < 10; i++) {
            setTimeout(() => {
              triggerFireworks();
            }, i * 500); // 每次间隔500ms，让烟花更分散
          }
          showToast('礼物发送成功！', 'success');
        } else if (gift === 'spring') {
          // 送春联：生成春联从底部上升（不需要等待API，直接显示效果）
          createCoupletEffect();
          showToast('春联已送出！', 'success');
        } else {
          createGiftEffect(gift);
          showToast('礼物发送成功！', 'success');
        }
        // 立即更新统计数据
        updateTopStats();
      } catch (err) {
        console.error('Gift send error:', err);
        // 即使API失败，也显示效果（对于春联）
        if (gift === 'spring') {
          createCoupletEffect();
          showToast('春联已送出！', 'success');
        } else {
          showToast('操作失败', 'error');
        }
      }
    });
  });
  
  // 表情按钮
  document.querySelectorAll('.emoji-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const emoji = btn.dataset.emoji;
      const input = document.getElementById('messageInput');
      input.value += emoji;
      updateCharCount();
      input.focus();
    });
  });
  
  // 明信片按钮 - 切换主页面明信片区域显示/隐藏
  document.getElementById('postcardBtn').addEventListener('click', () => {
    const postcardSection = document.getElementById('postcardSection');
    if (postcardSection.style.display === 'none' || !postcardSection.style.display) {
      postcardSection.style.display = 'block';
      document.getElementById('postcardPreview').style.display = 'none';
      document.getElementById('postcardMessage').value = '';
      // 滚动到明信片区域
      postcardSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // 确保按钮事件绑定（在区域显示后重新绑定）
      setTimeout(() => {
        const generateBtn = document.getElementById('generatePostcardBtn');
        const downloadBtn = document.getElementById('downloadPostcardBtn');
        if (generateBtn && !generateBtn.dataset.bound) {
          generateBtn.addEventListener('click', generatePostcard);
          generateBtn.dataset.bound = 'true';
        }
        if (downloadBtn && !downloadBtn.dataset.bound) {
          downloadBtn.addEventListener('click', downloadPostcard);
          downloadBtn.dataset.bound = 'true';
        }
      }, 100);
    } else {
      postcardSection.style.display = 'none';
    }
  });
  
  // 页面加载时自动加载合并的数据
  if (currentUser) {
    setTimeout(() => {
      loadCombinedStats();
    }, 500);
  }
  
  // 分享按钮
  document.getElementById('shareBtn').addEventListener('click', () => {
    document.getElementById('shareModal').style.display = 'flex';
    // 更新分享文本
    const url = window.location.href;
    document.getElementById('shareText').value = `🎉 2026马年祝福墙
✨ 马到成功 · 万事如意 ✨
欢迎你的加入！一起来许愿送祝福吧！
网址：`;
  });
  
  // 生成明信片按钮 - 使用事件委托，确保即使按钮在隐藏区域也能绑定
  document.addEventListener('click', (e) => {
    // 检查是否点击了生成按钮或其子元素
    const generateBtn = e.target.closest('#generatePostcardBtn');
    const downloadBtn = e.target.closest('#downloadPostcardBtn');
    
    if (generateBtn) {
      e.preventDefault();
      e.stopPropagation();
      console.log('Generate button clicked via delegation');
      generatePostcard();
      return false;
    }
    
    if (downloadBtn) {
      e.preventDefault();
      e.stopPropagation();
      console.log('Download button clicked via delegation');
      downloadPostcard();
      return false;
    }
  }, true); // 使用捕获阶段，确保能捕获到事件
  
  // 也直接绑定一次（如果按钮已存在）
  const generateBtn = document.getElementById('generatePostcardBtn');
  const downloadBtn = document.getElementById('downloadPostcardBtn');
  if (generateBtn) {
    generateBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Generate button clicked directly');
      generatePostcard();
    });
  }
  if (downloadBtn) {
    downloadBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Download button clicked directly');
      downloadPostcard();
    });
  }
  
  // 退出按钮 - 使用全局事件委托，确保能捕获到（在捕获阶段）
  document.addEventListener('click', function logoutHandler(e) {
    const logoutBtn = e.target.closest('#logoutBtn');
    if (logoutBtn) {
      e.preventDefault();
      e.stopPropagation();
      console.log('Logout button clicked via delegation');
      handleLogout();
      return false;
    }
  }, true);
  
  // 也直接绑定一次（如果按钮已存在）
  function bindLogoutButton() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      // 移除旧的事件监听器
      const newBtn = logoutBtn.cloneNode(true);
      logoutBtn.parentNode.replaceChild(newBtn, logoutBtn);
      
      // 绑定新的事件监听器
      newBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Logout button clicked directly');
        handleLogout();
      });
      
      console.log('Logout button bound directly');
      return true;
    }
    return false;
  }
  
  // 立即尝试绑定
  bindLogoutButton();
  
  // 延迟再次尝试绑定（确保主页面显示后）
  setTimeout(bindLogoutButton, 500);
  
  // 音乐切换按钮已移除
  
  // 关闭模态框
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  });
}

// 关闭模态框
function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
}

// 抽奖转盘
document.getElementById('spinBtn')?.addEventListener('click', async () => {
  const btn = document.getElementById('spinBtn');
  const wheel = document.getElementById('wheel');
  const result = document.getElementById('wheelResult');
  
  btn.disabled = true;
  result.style.display = 'none';
  wheel.style.animation = 'spin 3s cubic-bezier(0.4, 0, 0.2, 1)';
  
  try {
    const res = await fetch(`/api/lucky-wheel?industry=${currentUser?.industry || 'general'}`);
    const data = await res.json();
    
    setTimeout(() => {
      wheel.style.animation = 'none';
      result.style.display = 'block';
      document.getElementById('resultText').textContent = data.blessing;
      document.getElementById('resultRarity').textContent = 
        data.rarity === 'legendary' ? '🌟 传说' : 
        data.rarity === 'rare' ? '✨ 稀有' : '⭐ 普通';
      document.getElementById('resultRarity').className = `result-rarity ${data.rarity}`;
      btn.disabled = false;
    }, 3000);
  } catch (err) {
    btn.disabled = false;
    showToast('抽奖失败', 'error');
  }
});

// 加载排行榜
async function loadLeaderboard() {
  try {
    const res = await fetch('/api/leaderboard');
    const data = await res.json();
    const list = document.getElementById('leaderboardList');
    
    if (data.length === 0) {
      list.innerHTML = '<p class="empty-state">暂无数据</p>';
      return;
    }
    
    list.innerHTML = data.map((item, index) => `
      <div class="leaderboard-item">
        <span class="rank">${index + 1}</span>
        <span class="name">${escapeHtml(item.nickname)}</span>
        <span class="score">${item.score}分</span>
      </div>
    `).join('');
  } catch (err) {
    console.error('Load leaderboard error:', err);
  }
}

// 分享功能 - 已移到文件末尾优化版本

// 祝福语轮播 - 已移到文件末尾优化版本

// 弹幕系统
function startDanmaku() {
  let lastTime = Date.now();
  
  danmakuInterval = setInterval(async () => {
    try {
      const res = await fetch(`/api/danmaku?since=${lastTime}`);
      const danmakus = await res.json();
      
      danmakus.forEach(d => {
        createDanmaku(d.content, d.nickname);
        lastTime = Math.max(lastTime, d.time);
      });
    } catch (err) {
      console.error('Danmaku error:', err);
    }
  }, 3000);
}

// 创建弹幕
function createDanmaku(content, nickname) {
  const container = document.getElementById('fallingItems');
  const danmaku = document.createElement('div');
  danmaku.className = 'danmaku-item';
  danmaku.textContent = `${nickname}: ${content}`;
  danmaku.style.left = Math.random() * 80 + '%';
  danmaku.style.animationDuration = (Math.random() * 3 + 5) + 's';
  container.appendChild(danmaku);
  
  setTimeout(() => danmaku.remove(), 8000);
}

// 倒计时 - 已移到文件末尾优化版本

// 更新统计
// 更新统计（实时更新）
// 更新顶部统计卡片
async function updateTopStats() {
  try {
    const res = await fetch('/api/overview');
    const data = await res.json();
    
    const statOnlineEl = document.getElementById('statOnline');
    const statMessagesEl = document.getElementById('statMessages');
    const statLikesEl = document.getElementById('statLikes');
    const statGiftsEl = document.getElementById('statGifts');
    
    if (statOnlineEl) statOnlineEl.textContent = data.onlineCount || 0;
    if (statMessagesEl) statMessagesEl.textContent = data.totalMessages || 0;
    if (statLikesEl) statLikesEl.textContent = data.totalLikes || 0;
    if (statGiftsEl) statGiftsEl.textContent = data.totalGifts || 0;
  } catch (err) {
    console.error('Top stats update error:', err);
  }
}

function startStatsUpdate() {
  // 立即更新一次顶部统计卡片（不管是否登录）
  updateTopStats();
  
  // 如果已登录，也更新详细数据
  if (currentUser) {
    if (typeof loadCombinedStats === 'function') {
      loadCombinedStats();
    }
  }
  
  // 每5秒更新一次实时数据
  setInterval(async () => {
    // 更新顶部统计卡片（不管是否登录）
    await updateTopStats();
    
    // 如果已登录，也更新详细数据
    if (currentUser) {
      if (typeof loadCombinedStats === 'function') {
        loadCombinedStats();
      }
    }
  }, 5000);
}

// 背景动画
function initBackground() {
  const bgCanvas = document.getElementById('bgCanvas');
  const fwCanvas = document.getElementById('fwCanvas');
  
  if (!bgCanvas || !fwCanvas) return;
  
  const bgCtx = bgCanvas.getContext('2d');
  const fwCtx = fwCanvas.getContext('2d');
  
  function resizeCanvas() {
    bgCanvas.width = window.innerWidth;
    bgCanvas.height = window.innerHeight;
    fwCanvas.width = window.innerWidth;
    fwCanvas.height = window.innerHeight;
  }
  
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  // 雪花效果
  const snowflakes = [];
  for (let i = 0; i < 50; i++) {
    snowflakes.push({
      x: Math.random() * bgCanvas.width,
      y: Math.random() * bgCanvas.height,
      radius: Math.random() * 3 + 1,
      speed: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.5 + 0.5
    });
  }
  
  function animateSnow() {
    bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    bgCtx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    
    snowflakes.forEach(flake => {
      flake.y += flake.speed;
      flake.x += Math.sin(flake.y * 0.01) * 0.5;
      
      if (flake.y > bgCanvas.height) {
        flake.y = 0;
        flake.x = Math.random() * bgCanvas.width;
      }
      
      bgCtx.beginPath();
      bgCtx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
      bgCtx.fill();
    });
    
    requestAnimationFrame(animateSnow);
  }
  
  animateSnow();
}

// 烟花效果 - 已移到文件末尾优化版本

// 点赞效果
function createLikeEffect() {
  const btn = document.getElementById('likeBtn');
  const like = document.createElement('div');
  like.className = 'floating-like';
  like.textContent = '❤️';
  like.style.left = btn.offsetLeft + 'px';
  like.style.top = btn.offsetTop + 'px';
  document.body.appendChild(like);
  
  setTimeout(() => like.remove(), 1000);
}

// 礼物效果 - 已移到文件末尾优化版本

// 音乐切换 - 切换不同的音乐，音乐永远无法关闭
let currentMusicIndex = 0;
const allMusicList = [
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3'
];

function toggleMusic() {
  const music = document.getElementById('bgMusic');
  const btn = document.getElementById('musicToggle');
  
  if (!music) return;
  
  // 切换到下一首音乐
  currentMusicIndex = (currentMusicIndex + 1) % allMusicList.length;
  const nextMusicUrl = allMusicList[currentMusicIndex];
  
  // 保存当前播放时间（用于平滑切换）
  const wasPlaying = !music.paused;
  const currentTime = music.currentTime;
  
  // 加载新音乐
  music.src = nextMusicUrl;
  music.loop = true;
  music.volume = 0.3;
  music.load();
  
  // 更新按钮图标（显示当前音乐序号）
  btn.textContent = `🎵${currentMusicIndex + 1}`;
  
  // 播放新音乐
  music.play().then(() => {
    showToast(`已切换到第 ${currentMusicIndex + 1} 首音乐`, 'success');
  }).catch(err => {
    console.log('Music switch failed:', err);
    showToast('切换音乐失败，继续播放当前音乐', 'error');
    // 如果切换失败，尝试恢复之前的音乐
    if (currentMusicIndex === 0) {
      currentMusicIndex = allMusicList.length - 1;
    } else {
      currentMusicIndex--;
    }
    music.src = allMusicList[currentMusicIndex];
    music.load();
    music.play().catch(() => {});
  });
  
  // 确保音乐结束后重新播放（双重保险）
  music.onended = () => {
    music.currentTime = 0;
    music.play().catch(err => {
      console.log('Background music replay failed:', err);
    });
  };
  
  // 监听音乐加载错误，自动切换到下一首
  music.onerror = () => {
    console.log('Music load error, trying next song');
    if (currentMusicIndex < allMusicList.length - 1) {
      currentMusicIndex++;
    } else {
      currentMusicIndex = 0;
    }
    music.src = allMusicList[currentMusicIndex];
    music.load();
    music.play().catch(() => {});
  };
}

// 工具函数
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// ========== 新增功能 ==========

// Overview功能
// Overview按钮已移除，数据直接显示在页面上

// 加载合并的数据（总数据 + 排行榜）
async function loadCombinedStats() {
  try {
    // 同时加载详细数据和排行榜
    const [overviewRes, leaderboardRes] = await Promise.all([
      fetch('/api/overview/detailed'),
      fetch('/api/leaderboard')
    ]);
    
    const overviewData = await overviewRes.json();
    const leaderboardData = await leaderboardRes.json();
    
    // 更新总数据
    document.getElementById('ovOnline').textContent = overviewData.onlineCount || 0;
    document.getElementById('ovTotalUsers').textContent = overviewData.totalUsers || 0;
    document.getElementById('ovMessages').textContent = overviewData.totalMessages || 0;
    document.getElementById('ovReplies').textContent = overviewData.totalReplies || 0;
    document.getElementById('ovLikes').textContent = overviewData.totalLikes || 0;
    document.getElementById('ovGifts').textContent = overviewData.totalGifts || 0;
    document.getElementById('ovTodayActive').textContent = overviewData.todayActive || 0;
    
    // 行业统计
    const industryStats = document.getElementById('industryStats');
    if (overviewData.industryStats && overviewData.industryStats.length > 0) {
      industryStats.innerHTML = '<h4 class="industry-title">行业分布</h4>' + overviewData.industryStats.map(item => `
        <div class="industry-stat-item">
          <span class="industry-name">${item.industry}</span>
          <span class="industry-count">${item.count}人</span>
        </div>
      `).join('');
    } else {
      industryStats.innerHTML = '<p class="empty-state">暂无数据</p>';
    }
    
    // 更新排行榜
    const list = document.getElementById('leaderboardList');
    if (leaderboardData.length === 0) {
      list.innerHTML = '<p class="empty-state">暂无数据</p>';
    } else {
      list.innerHTML = leaderboardData.map((item, index) => `
        <div class="leaderboard-item">
          <span class="rank">${index + 1}</span>
          <span class="name">${escapeHtml(item.nickname)}</span>
          <span class="score">${item.score}分</span>
        </div>
      `).join('');
    }
  } catch (err) {
    console.error('Load combined stats error:', err);
  }
}

// 保留原函数以兼容（如果需要）
async function loadOverview() {
  await loadCombinedStats();
}

// 回复功能
function showReplyForm(messageId) {
  if (!currentUser) {
    showToast('请先登录', 'error');
    return;
  }
  
  const content = prompt('输入你的回复：');
  if (!content || !content.trim()) return;
  
  sendReply(messageId, content.trim());
}

async function sendReply(parentId, content) {
  try {
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.userId, content, parentId })
    });
    const data = await res.json();
    
    if (data.success) {
      showToast('回复成功！', 'success');
      loadMessages();
    } else {
      showToast('回复失败', 'error');
    }
  } catch (err) {
    showToast('网络错误', 'error');
  }
}

// 编辑消息
async function editMessage(messageId) {
  const msgEl = document.querySelector(`[data-id="${messageId}"]`);
  if (!msgEl) return;
  
  const contentEl = msgEl.querySelector('.message-content');
  const oldContent = contentEl.textContent;
  const newContent = prompt('编辑祝福内容：', oldContent);
  
  if (!newContent || newContent.trim() === oldContent) return;
  
  try {
    const res = await fetch(`/api/messages/${messageId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.userId, content: newContent.trim() })
    });
    const data = await res.json();
    
    if (data.success) {
      showToast('编辑成功！', 'success');
      loadMessages();
    } else {
      showToast('编辑失败', 'error');
    }
  } catch (err) {
    showToast('网络错误', 'error');
  }
}

// 删除消息
async function deleteMessage(messageId) {
  if (!confirm('确定要删除这条祝福吗？')) return;
  
  try {
    const res = await fetch(`/api/messages/${messageId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.userId })
    });
    const data = await res.json();
    
    if (data.success) {
      showToast('删除成功！', 'success');
      loadMessages();
      // 立即更新统计数据
      updateTopStats();
    } else {
      showToast('删除失败', 'error');
    }
  } catch (err) {
    showToast('网络错误', 'error');
  }
}

// 修复烟花图层 - 使用独立的canvas层
function createFirework() {
  const canvas = document.getElementById('fwCanvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const x = Math.random() * canvas.width;
  const y = Math.random() * canvas.height * 0.5;
  
  const colors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#a8e6cf', '#ff8b94', '#ffd93d'];
  const particles = [];
  
  for (let i = 0; i < 50; i++) {
    const angle = (Math.PI * 2 * i) / 50;
    const speed = Math.random() * 5 + 2;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 1,
      size: Math.random() * 4 + 2
    });
  }
  
  let frameCount = 0;
  const maxFrames = 60;
  
  function animate() {
    frameCount++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    
    particles.forEach(p => {
      if (p.life > 0) {
        alive = true;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15;
        p.vx *= 0.98;
        p.life -= 1 / maxFrames;
        
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });
    
    if (alive && frameCount < maxFrames) {
      requestAnimationFrame(animate);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
  
  animate();
}

// 优化音乐功能 - 根据行业加载不同音乐
const industryMusic = {
  tech: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  design: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  finance: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  student: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  medical: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
  teacher: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
  general: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
};

function loadMusicForIndustry(industry) {
  const music = document.getElementById('bgMusic');
  if (!music) {
    // 如果元素不存在，延迟重试
    setTimeout(() => loadMusicForIndustry(industry), 100);
    return;
  }
  
  // 根据行业选择初始音乐，但之后可以通过切换按钮切换
  const industryMusicUrl = industryMusic[industry] || industryMusic.general;
  
  // 找到该音乐在全部音乐列表中的索引
  const index = allMusicList.findIndex(url => url === industryMusicUrl);
  if (index !== -1) {
    currentMusicIndex = index;
  } else {
    // 如果不在列表中，使用第一首
    currentMusicIndex = 0;
  }
  
  const musicUrl = allMusicList[currentMusicIndex];
  
  // 如果音乐URL已经设置且相同，直接播放（避免重复加载）
  if (music.src && music.src.includes(musicUrl.split('/').pop())) {
    if (music.paused) {
      music.play().catch(err => {
        console.log('Background music resume failed:', err);
      });
    }
    // 更新按钮图标
    const btn = document.getElementById('musicToggle');
    if (btn) btn.textContent = `🎵${currentMusicIndex + 1}`;
    return;
  }
  
  music.src = musicUrl;
  music.loop = true; // 确保循环播放
  music.load();
  
  // 自动播放背景音乐
  music.volume = 0.3;
  
  // 尝试播放，如果失败（浏览器自动播放策略），等待用户交互
  const tryPlay = () => {
    music.play().then(() => {
      musicPlaying = true;
      const btn = document.getElementById('musicToggle');
      if (btn) btn.textContent = `🎵${currentMusicIndex + 1}`; // 显示当前音乐序号
    }).catch(err => {
      console.log('Background music autoplay failed (may need user interaction):', err);
      // 如果自动播放失败，设置标志但不标记为错误
      // 用户可以通过点击音乐按钮来播放
      musicPlaying = false;
      
      // 监听页面点击事件，一旦用户交互就尝试播放
      const playOnInteraction = () => {
        if (!musicPlaying && currentUser) {
          music.play().then(() => {
            musicPlaying = true;
            const btn = document.getElementById('musicToggle');
            if (btn) btn.textContent = `🎵${currentMusicIndex + 1}`;
            // 移除监听器
            document.removeEventListener('click', playOnInteraction);
            document.removeEventListener('touchstart', playOnInteraction);
          }).catch(() => {
            // 仍然失败，保持监听
          });
        }
      };
      
      // 添加一次性的交互监听
      document.addEventListener('click', playOnInteraction, { once: true });
      document.addEventListener('touchstart', playOnInteraction, { once: true });
    });
  };
  
  // 等待音乐加载完成后再播放
  if (music.readyState >= 3) {
    // 已经可以播放，立即尝试
    tryPlay();
  } else {
    // 等待加载完成
    music.addEventListener('canplaythrough', tryPlay, { once: true });
  }
  
  // 确保音乐结束后重新播放（双重保险）
  music.onended = () => {
    if (musicPlaying) {
      music.currentTime = 0;
      music.play().catch(err => {
        console.log('Background music replay failed:', err);
      });
    }
  };
  
  // 监听音乐加载错误，自动切换到下一首
  music.onerror = () => {
    console.log('Music load error, trying next song');
    if (currentMusicIndex < allMusicList.length - 1) {
      currentMusicIndex++;
    } else {
      currentMusicIndex = 0;
    }
    music.src = allMusicList[currentMusicIndex];
    music.load();
    music.play().catch(() => {});
  };
}

// 优化分享功能
function shareToApp(app) {
  const url = window.location.href;
  const shareText = document.getElementById('shareText').value;
  
  if (navigator.clipboard) {
    navigator.clipboard.writeText(shareText + url).then(() => {
      document.getElementById('shareSuccess').style.display = 'block';
      setTimeout(() => {
        document.getElementById('shareSuccess').style.display = 'none';
      }, 2000);
    });
  }
}

function copyShareText() {
  const url = window.location.href;
  const shareText = document.getElementById('shareText').value;
  
  if (navigator.clipboard) {
    navigator.clipboard.writeText(shareText + url).then(() => {
      document.getElementById('shareSuccess').style.display = 'block';
      setTimeout(() => {
        document.getElementById('shareSuccess').style.display = 'none';
      }, 2000);
    });
  }
}

// 优化倒计时
function initCountdown() {
  // 清除之前的倒计时
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }
  
  // 设置目标日期：2026年春节（2月17日）
  const targetDate = new Date('2026-02-17T00:00:00+08:00').getTime();
  
  const updateCountdown = () => {
    // 检查元素是否存在
    const daysEl = document.getElementById('countDays');
    const hoursEl = document.getElementById('countHours');
    const minutesEl = document.getElementById('countMinutes');
    const secondsEl = document.getElementById('countSeconds');
    
    if (!daysEl || !hoursEl || !minutesEl || !secondsEl) {
      return; // 元素不存在，跳过更新
    }
    
    const now = Date.now();
    const diff = targetDate - now;
    
    if (diff > 0) {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      daysEl.textContent = String(days).padStart(2, '0');
      hoursEl.textContent = String(hours).padStart(2, '0');
      minutesEl.textContent = String(minutes).padStart(2, '0');
      secondsEl.textContent = String(seconds).padStart(2, '0');
      
      // 更新标题
      const titleEl = document.querySelector('.countdown-section h2');
      if (titleEl) {
        if (diff < 0) {
          titleEl.innerHTML = '<span class="title-icon">✅</span> 春节已结束，感谢参与！';
          const displayEl = document.querySelector('.countdown-display');
          if (displayEl) {
            displayEl.style.display = 'none';
          }
        }
      }
    } else {
      // 时间已过
      const titleEl = document.querySelector('.countdown-section h2');
      if (titleEl) {
        titleEl.innerHTML = '<span class="title-icon">✅</span> 春节已结束，感谢参与！';
      }
      const displayEl = document.querySelector('.countdown-display');
      if (displayEl) {
        displayEl.style.display = 'none';
      }
    }
  };
  
  // 立即执行一次
  updateCountdown();
  
  // 每秒更新
  countdownInterval = setInterval(updateCountdown, 1000);
}

// 优化祝福轮播 - 定时切换，动画更好
async function startBlessingCarousel() {
  // 先清除之前的定时器
  if (blessingInterval) {
    clearInterval(blessingInterval);
    blessingInterval = null;
  }
  
  const textEl = document.getElementById('blessingText');
  const progressEl = document.getElementById('blessingProgress');
  
  // 确保元素存在
  if (!textEl || !progressEl) {
    console.warn('Blessing carousel elements not found, retrying...');
    // 如果元素不存在，延迟重试
    setTimeout(() => {
      startBlessingCarousel();
    }, 500);
    return;
  }
  
  const updateBlessing = async () => {
    try {
      // 如果没有用户，使用默认祝福语
      let blessings = [];
      if (currentUser) {
        const res = await fetch(`/api/blessings?nickname=${encodeURIComponent(currentUser.nickname)}&industry=${currentUser.industry || 'general'}`);
        blessings = await res.json();
      }
      
      // 如果没有获取到祝福语，使用默认列表
      if (!blessings || blessings.length === 0) {
        blessings = [
          '🎉 新年快乐，马到成功！',
          '✨ 万事如意，心想事成！',
          '🎊 身体健康，工作顺利！',
          '🌟 财源广进，步步高升！',
          '🎁 阖家欢乐，幸福美满！'
        ];
      }
      
      // 切换到下一条祝福语
      blessingIndex = (blessingIndex + 1) % blessings.length;
      
      // 检查是否已经有内容显示
      const hasContent = textEl.textContent && textEl.textContent !== '加载祝福中...' && textEl.style.opacity !== '0';
      
      if (hasContent) {
        // 已经有内容，需要淡出动画
        textEl.style.transition = 'opacity 0.5s ease-out';
        textEl.style.opacity = '0';
        
        setTimeout(() => {
          textEl.textContent = blessings[blessingIndex];
          // 淡入动画
          textEl.style.transition = 'opacity 0.5s ease-in';
          textEl.style.opacity = '1';
          
          // 进度条动画
          progressEl.style.width = '0%';
          progressEl.style.transition = 'none';
          setTimeout(() => {
            progressEl.style.transition = 'width 6s linear';
            progressEl.style.width = '100%';
          }, 10);
        }, 500);
      } else {
        // 首次显示，直接设置内容
        textEl.textContent = blessings[blessingIndex];
        textEl.style.opacity = '1';
        textEl.style.transition = 'opacity 0.5s ease-in';
        
        // 进度条动画
        progressEl.style.width = '0%';
        progressEl.style.transition = 'none';
        setTimeout(() => {
          progressEl.style.transition = 'width 6s linear';
          progressEl.style.width = '100%';
        }, 10);
      }
    } catch (err) {
      console.error('Load blessings error:', err);
      // 出错时显示默认文本
      const defaultBlessings = [
        '🎉 新年快乐，马到成功！',
        '✨ 万事如意，心想事成！',
        '🎊 身体健康，工作顺利！'
      ];
      blessingIndex = (blessingIndex + 1) % defaultBlessings.length;
      textEl.textContent = defaultBlessings[blessingIndex];
      textEl.style.opacity = '1';
    }
  };
  
  // 初始化索引
  blessingIndex = -1;
  
  // 立即执行一次，确保首次加载时显示内容
  updateBlessing();
  
  // 每6.5秒切换一次
  blessingInterval = setInterval(updateBlessing, 6500);
}

// 优化礼物特效 - 不只是emoji
function createGiftEffect(gift) {
  const emojis = {
    firework: '🎆',
    hongbao: '🧧',
    horse: '🐴',
    spring: '🧨'
  };
  
  const emoji = emojis[gift] || '🎁';
  
  // 创建多个礼物元素
  for (let i = 0; i < 8; i++) {
    setTimeout(() => {
      const giftEl = document.createElement('div');
      giftEl.className = 'floating-gift';
      giftEl.textContent = emoji;
      giftEl.style.left = Math.random() * window.innerWidth + 'px';
      giftEl.style.top = window.innerHeight + 'px';
      giftEl.style.fontSize = (Math.random() * 20 + 20) + 'px';
      giftEl.style.animationDuration = (Math.random() * 1 + 2) + 's';
      giftEl.style.animationDelay = (Math.random() * 0.5) + 's';
      document.body.appendChild(giftEl);
      
      setTimeout(() => giftEl.remove(), 3000);
    }, i * 100);
  }
  
  // 特殊效果
  if (gift === 'firework') {
    triggerFireworks();
  }
}

// 生成随机春联
function generateCouplet() {
  const upperLines = [
    '福满人间喜气盈',
    '春回大地万象新',
    '马到成功事业兴',
    '花开富贵满堂春',
    '岁岁平安福满门',
    '年年有余财源广',
    '家和万事兴',
    '国泰民安乐',
    '春风得意马蹄疾',
    '瑞雪纷飞兆丰年',
    '金马奔腾迎新春',
    '玉兔辞旧岁',
    '红梅报春来',
    '喜气洋洋过大年',
    '财源滚滚进家门'
  ];
  
  const lowerLines = [
    '门迎百福福星照',
    '户纳千祥祥云开',
    '一帆风顺年年好',
    '万事如意步步高',
    '天增岁月人增寿',
    '春满乾坤福满门',
    '心想事成',
    '万事如意',
    '一日千里展宏图',
    '五谷丰登庆有余',
    '骏马奔腾前程远',
    '金鸡报晓',
    '紫燕迎春',
    '合家欢乐迎新春',
    '五福临门喜气来'
  ];
  
  const upper = upperLines[Math.floor(Math.random() * upperLines.length)];
  const lower = lowerLines[Math.floor(Math.random() * lowerLines.length)];
  
  return { upper, lower };
}

// 送春联效果：从底部上升
function createCoupletEffect() {
  const couplet = generateCouplet();
  
  // 创建春联容器
  const coupletContainer = document.createElement('div');
  coupletContainer.className = 'couplet-container';
  coupletContainer.style.cssText = `
    position: fixed;
    bottom: -200px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    pointer-events: none;
    font-family: "KaiTi", "楷体", "STKaiti", serif;
  `;
  
  // 上联
  const upperLine = document.createElement('div');
  upperLine.className = 'couplet-line upper-line';
  upperLine.textContent = couplet.upper;
  upperLine.style.cssText = `
    background: linear-gradient(135deg, #d32f2f, #f44336);
    color: #ffd700;
    padding: 1rem 2rem;
    border-radius: 8px;
    font-size: 1.8rem;
    font-weight: bold;
    box-shadow: 0 4px 15px rgba(211, 47, 47, 0.5);
    border: 3px solid #ffd700;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
    writing-mode: horizontal-tb;
    white-space: nowrap;
  `;
  
  // 下联
  const lowerLine = document.createElement('div');
  lowerLine.className = 'couplet-line lower-line';
  lowerLine.textContent = couplet.lower;
  lowerLine.style.cssText = `
    background: linear-gradient(135deg, #d32f2f, #f44336);
    color: #ffd700;
    padding: 1rem 2rem;
    border-radius: 8px;
    font-size: 1.8rem;
    font-weight: bold;
    box-shadow: 0 4px 15px rgba(211, 47, 47, 0.5);
    border: 3px solid #ffd700;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
    writing-mode: horizontal-tb;
    white-space: nowrap;
  `;
  
  coupletContainer.appendChild(upperLine);
  coupletContainer.appendChild(lowerLine);
  document.body.appendChild(coupletContainer);
  
  // 上升动画
  const startY = window.innerHeight + 200;
  const endY = window.innerHeight * 0.3;
  const duration = 3000; // 3秒
  const startTime = Date.now();
  
  function animate() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // 使用缓动函数
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const currentY = startY - (startY - endY) * easeOut;
    
    coupletContainer.style.bottom = `${window.innerHeight - currentY}px`;
    
    // 透明度变化
    const opacity = progress < 0.1 ? progress * 10 : (progress > 0.9 ? (1 - progress) * 10 : 1);
    coupletContainer.style.opacity = opacity;
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      // 动画结束后移除
      setTimeout(() => {
        if (coupletContainer.parentNode) {
          coupletContainer.remove();
        }
      }, 500);
    }
  }
  
  requestAnimationFrame(animate);
}

// 登录成功后加载音乐
function showMainPage() {
  document.getElementById('authModal').style.display = 'none';
  document.getElementById('mainPage').style.display = 'block';
  if (currentUser) {
    document.getElementById('displayName').textContent = currentUser.nickname;
    // 刷新页面后自动加载并播放背景音乐
    setTimeout(() => {
      loadMusicForIndustry(currentUser.industry || 'general');
    }, 500); // 延迟500ms，确保页面完全加载
    // 确保祝福轮播在主页面显示时重新初始化
    if (blessingInterval) {
      clearInterval(blessingInterval);
    }
    startBlessingCarousel();
  }
  // 确保倒计时在主页面显示时重新初始化
  initCountdown();
  // 确保马特效在主页面显示时重新初始化
  initHorseFollower();
  loadMessages();
  // 立即更新顶部统计卡片
  updateTopStats();
  // 页面加载时自动加载合并的数据
  if (currentUser) {
    loadCombinedStats();
  }
  
  // 确保退出按钮在主页面显示后绑定
  setTimeout(() => {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      // 移除旧的事件监听器（如果存在）
      const newBtn = logoutBtn.cloneNode(true);
      logoutBtn.parentNode.replaceChild(newBtn, logoutBtn);
      
      // 绑定新的事件监听器
      newBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Logout button clicked in showMainPage');
        handleLogout();
      });
      
      console.log('Logout button bound in showMainPage');
    } else {
      console.warn('Logout button not found in showMainPage');
    }
  }, 200);
}

// ========== 鼠标跟随的马特效 ==========
let horseTargetX = window.innerWidth / 2;
let horseTargetY = window.innerHeight / 2;
let horseCurrentX = window.innerWidth / 2;
let horseCurrentY = window.innerHeight / 2;
let horseRotation = 0;
let horseScale = 1;
let animationFrameId = null;
let horseInitialized = false;

function initHorseFollower() {
  const horse = document.getElementById('horseFollower');
  if (!horse) {
    // 如果元素不存在，延迟重试
    setTimeout(initHorseFollower, 100);
    return;
  }
  
  // 如果已经初始化，先停止之前的动画
  if (horseInitialized && animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  
  // 初始化位置在屏幕中央
  horseCurrentX = window.innerWidth / 2;
  horseCurrentY = window.innerHeight / 2;
  horseTargetX = horseCurrentX;
  horseTargetY = horseCurrentY;
  
  horse.style.left = horseCurrentX + 'px';
  horse.style.top = horseCurrentY + 'px';
  horse.style.display = 'block'; // 确保显示
  
  // 移除旧的监听器（如果存在）
  const mouseHandler = (e) => {
    horseTargetX = e.clientX;
    horseTargetY = e.clientY;
  };
  
  const touchHandler = (e) => {
    if (e.touches.length > 0) {
      horseTargetX = e.touches[0].clientX;
      horseTargetY = e.touches[0].clientY;
    }
  };
  
  // 监听鼠标移动
  document.removeEventListener('mousemove', mouseHandler);
  document.addEventListener('mousemove', mouseHandler);
  
  // 监听触摸移动（移动端支持）
  document.removeEventListener('touchmove', touchHandler);
  document.addEventListener('touchmove', touchHandler, { passive: true });
  
  // 平滑动画循环
  function animateHorse() {
    // 使用缓动函数，让移动更平滑自然（非常缓慢）
    const easing = 0.02; // 这个值越小，移动越缓慢（0.02 = 非常缓慢）
    
    // 计算距离
    const dx = horseTargetX - horseCurrentX;
    const dy = horseTargetY - horseCurrentY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // 更新当前位置（缓慢移动）
    horseCurrentX += dx * easing;
    horseCurrentY += dy * easing;
    
    // 计算旋转角度，让马朝向鼠标方向
    if (distance > 1) { // 只有距离足够大时才更新角度
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      // 平滑旋转
      let angleDiff = angle - horseRotation;
      // 处理角度跨越180度的情况
      if (angleDiff > 180) angleDiff -= 360;
      if (angleDiff < -180) angleDiff += 360;
      horseRotation += angleDiff * 0.1; // 旋转也使用缓动
    }
    
    // 呼吸动画（轻微的缩放）
    const time = Date.now() * 0.001;
    horseScale = 1 + Math.sin(time * 2) * 0.05; // 轻微的呼吸效果
    
    // 应用位置、旋转和缩放
    horse.style.left = horseCurrentX + 'px';
    horse.style.top = horseCurrentY + 'px';
    horse.style.transform = `translate(-50%, -50%) rotate(${horseRotation}deg) scale(${horseScale})`;
    
    animationFrameId = requestAnimationFrame(animateHorse);
  }
  
  // 窗口大小改变时重新定位
  window.addEventListener('resize', () => {
    // 保持相对位置
    const ratioX = horseCurrentX / (window.innerWidth || 1);
    const ratioY = horseCurrentY / (window.innerHeight || 1);
    horseCurrentX = window.innerWidth * ratioX;
    horseCurrentY = window.innerHeight * ratioY;
    horseTargetX = window.innerWidth / 2;
    horseTargetY = window.innerHeight / 2;
  });
  
  // 开始动画
  animateHorse();
  horseInitialized = true;
}

// ========== 明信片生成功能 ==========
let currentPostcardData = null;

async function generatePostcard() {
  console.log('generatePostcard called'); // 调试信息
  
  if (!currentUser) {
    showToast('请先登录', 'error');
    return;
  }
  
  const userMessageEl = document.getElementById('postcardMessage');
  const btn = document.getElementById('generatePostcardBtn');
  
  if (!btn) {
    console.error('Generate button not found');
    showToast('按钮未找到，请刷新页面重试', 'error');
    return;
  }
  
  if (!userMessageEl) {
    console.error('Postcard message element not found');
    showToast('输入框未找到，请刷新页面重试', 'error');
    return;
  }
  
  const userMessage = userMessageEl.value.trim();
  
  btn.disabled = true;
  btn.innerHTML = '<span>生成中...</span>';
  
  try {
    console.log('Sending request to /api/postcard/generate');
    const res = await fetch('/api/postcard/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.userId, userMessage })
    });
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    console.log('Response data:', data);
    
    if (data.success) {
      currentPostcardData = data;
      drawPostcard(data);
      const preview = document.getElementById('postcardPreview');
      if (preview) {
        preview.style.display = 'block';
        // 滚动到预览区域
        preview.scrollIntoView({ behavior: 'smooth', block: 'start' });
        showToast('明信片生成成功！可以下载了', 'success');
      } else {
        console.error('Preview element not found');
        showToast('预览区域未找到', 'error');
      }
    } else {
      showToast(data.error || '生成失败', 'error');
    }
  } catch (err) {
    console.error('Generate postcard error:', err);
    showToast('网络错误: ' + err.message, 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span>生成明信片 🎨</span>';
    }
  }
}

function drawPostcard(data) {
  const canvas = document.getElementById('postcardCanvas');
  const ctx = canvas.getContext('2d');
  
  // 设置画布尺寸（明信片比例）
  canvas.width = 800;
  canvas.height = 1200;
  
  // 清空画布
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // 背景渐变（漫画风格）
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#ffecd2');
  gradient.addColorStop(0.5, '#fcb69f');
  gradient.addColorStop(1, '#ff9a9e');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // 绘制装饰边框（漫画风格）
  ctx.strokeStyle = '#8b4513';
  ctx.lineWidth = 8;
  ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
  
  // 绘制虚线边框
  ctx.setLineDash([10, 5]);
  ctx.strokeStyle = '#d2691e';
  ctx.lineWidth = 3;
  ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
  ctx.setLineDash([]);
  
  // 标题区域（使用用户昵称）- 使用可爱字体
  ctx.fillStyle = '#8b4513';
  ctx.font = 'bold 48px "Comic Sans MS", "幼圆", "微软雅黑", "Arial Rounded MT Bold", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`🎴 ${data.userInfo.nickname}的2026马年专属明信片`, canvas.width / 2, 120);
  
  // 明信片编号 - 使用可爱字体
  ctx.fillStyle = '#654321';
  ctx.font = '24px "Comic Sans MS", "幼圆", "微软雅黑", "Arial Rounded MT Bold", sans-serif';
  ctx.fillText(`编号: ${data.cardNumber}`, canvas.width / 2, 160);
  
  // 用户信息区域（漫画风格对话框）
  const userBoxY = 220;
  drawComicBubble(ctx, 60, userBoxY, canvas.width - 120, 150, '#fff8dc');
  
  ctx.fillStyle = '#8b4513';
  ctx.font = 'bold 36px "Comic Sans MS", "幼圆", "微软雅黑", "Arial Rounded MT Bold", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`👤 ${data.userInfo.nickname}`, 100, userBoxY + 50);
  
  const industryNames = {
    tech: '💻 程序员/IT',
    design: '🎨 设计师',
    finance: '💰 金融/财务',
    student: '📚 学生',
    medical: '🏥 医疗/健康',
    teacher: '👨‍🏫 教育/教师',
    general: '🌟 通用'
  };
  ctx.fillStyle = '#654321';
  ctx.font = '28px "Comic Sans MS", "幼圆", "微软雅黑", "Arial Rounded MT Bold", sans-serif';
  ctx.fillText(industryNames[data.userInfo.industry] || '🌟 通用', 100, userBoxY + 100);
  
  // 用户说的话
  if (data.userMessage) {
    const messageBoxY = userBoxY + 180;
    drawComicBubble(ctx, 60, messageBoxY, canvas.width - 120, 120, '#e6f3ff');
    
    ctx.fillStyle = '#1a1a1a';
    ctx.font = '28px "Comic Sans MS", "幼圆", "微软雅黑", "Arial Rounded MT Bold", sans-serif';
    ctx.textAlign = 'left';
    wrapText(ctx, data.userMessage, 100, messageBoxY + 50, canvas.width - 200, 32);
  }
  
  // 统计数据区域（漫画风格）
  const statsBoxY = data.userMessage ? userBoxY + 320 : userBoxY + 180;
  drawComicBubble(ctx, 60, statsBoxY, canvas.width - 120, 200, '#fffacd');
  
  ctx.fillStyle = '#8b4513';
  ctx.font = 'bold 32px "Comic Sans MS", "幼圆", "微软雅黑", "Arial Rounded MT Bold", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('📊 你的足迹', 100, statsBoxY + 50);
  
  ctx.fillStyle = '#654321';
  ctx.font = '24px "Comic Sans MS", "幼圆", "微软雅黑", "Arial Rounded MT Bold", sans-serif';
  const stats = [
    `💬 发送了 ${data.stats.messagesCount} 条祝福`,
    `❤️ 点赞了 ${data.stats.likesCount} 次`,
    `🎁 送出了 ${data.stats.giftsCount} 份礼物`,
    `⏱️ 在此停留了 ${data.stats.interactionDurationFormatted}`
  ];
  stats.forEach((stat, i) => {
    ctx.fillText(stat, 100, statsBoxY + 90 + i * 35);
  });
  
  // 网站祝福区域（大对话框）
  const blessingBoxY = statsBoxY + 220;
  drawComicBubble(ctx, 60, blessingBoxY, canvas.width - 120, 180, '#ffe4e1');
  
  ctx.fillStyle = '#8b4513';
  ctx.font = 'bold 32px "Comic Sans MS", "幼圆", "微软雅黑", "Arial Rounded MT Bold", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🎉 网站对你的祝福', canvas.width / 2, blessingBoxY + 50);
  
  ctx.fillStyle = '#1a1a1a';
  ctx.font = '28px "Comic Sans MS", "幼圆", "微软雅黑", "Arial Rounded MT Bold", sans-serif';
  wrapText(ctx, data.websiteBlessing, canvas.width / 2, blessingBoxY + 100, canvas.width - 200, 32);
  
  // 底部信息 - 使用可爱字体
  const bottomY = blessingBoxY + 220;
  ctx.fillStyle = '#654321';
  ctx.font = '20px "Comic Sans MS", "幼圆", "微软雅黑", "Arial Rounded MT Bold", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`生成时间: ${data.createdAt}`, canvas.width / 2, bottomY);
  ctx.fillText('2026马年祝福墙 · 马到成功 · 万事如意', canvas.width / 2, bottomY + 35);
  ctx.fillText('@xiaomo · 独一份的回忆', canvas.width / 2, bottomY + 60);
  
  // 时间戳证明（小字）- 保持等宽字体
  ctx.fillStyle = '#999';
  ctx.font = '16px "Comic Sans MS", "幼圆", "微软雅黑", monospace';
  ctx.fillText(`时间戳: ${data.timestampProof}`, canvas.width / 2, bottomY + 90);
}

// 绘制漫画风格对话框
function drawComicBubble(ctx, x, y, width, height, fillColor) {
  ctx.save();
  
  // 填充
  ctx.fillStyle = fillColor;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 20);
  ctx.fill();
  
  // 边框
  ctx.strokeStyle = '#8b4513';
  ctx.lineWidth = 4;
  ctx.stroke();
  
  // 高光
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.beginPath();
  ctx.roundRect(x + 5, y + 5, width - 10, 30, 15);
  ctx.fill();
  
  ctx.restore();
}

// 文本换行（支持中文）
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const chars = text.split('');
  let line = '';
  let currentY = y;
  const isCenter = ctx.textAlign === 'center';
  
  for (let i = 0; i < chars.length; i++) {
    const testLine = line + chars[i];
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    
    if (testWidth > maxWidth && i > 0) {
      const drawX = isCenter ? x : x;
      ctx.fillText(line, drawX, currentY);
      line = chars[i];
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  const drawX = isCenter ? x : x;
  ctx.fillText(line, drawX, currentY);
}

// 下载明信片
function downloadPostcard() {
  if (!currentPostcardData) {
    showToast('请先生成明信片', 'error');
    return;
  }
  
  const canvas = document.getElementById('postcardCanvas');
  const link = document.createElement('a');
  link.download = `明信片_${currentPostcardData.cardNumber}_${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  showToast('明信片下载成功！', 'success');
}

// 扩展Canvas的roundRect方法（如果浏览器不支持）
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
    this.beginPath();
    this.moveTo(x + radius, y);
    this.lineTo(x + width - radius, y);
    this.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.lineTo(x + width, y + height - radius);
    this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.lineTo(x + radius, y + height);
    this.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.lineTo(x, y + radius);
    this.quadraticCurveTo(x, y, x + radius, y);
    this.closePath();
  };
}

// ========== 烟花效果 ==========
let fireworksCanvas = null;
let fireworksCtx = null;
let fireworks = [];
let particles = [];
let fireworksAnimationId = null;
let fireworksMusicPlaying = false;

// 初始化烟花画布
function initFireworksCanvas() {
  fireworksCanvas = document.getElementById('fireworksCanvas');
  if (!fireworksCanvas) return;
  
  fireworksCtx = fireworksCanvas.getContext('2d');
  resizeFireworksCanvas();
  window.addEventListener('resize', resizeFireworksCanvas);
}

function resizeFireworksCanvas() {
  if (!fireworksCanvas) return;
  fireworksCanvas.width = window.innerWidth;
  fireworksCanvas.height = window.innerHeight;
}

// 烟花粒子类
class Particle {
  constructor(x, y, color, velocity) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.velocity = velocity;
    this.alpha = 1;
    this.decay = Math.random() * 0.015 + 0.01; // 稍微减慢衰减，让粒子持续更久
    this.gravity = 0.08; // 稍微减小重力，让粒子飞得更远
    this.friction = 0.98; // 稍微减小摩擦，让粒子保持速度更久
  }
  
  update() {
    this.velocity.x *= this.friction;
    this.velocity.y *= this.friction;
    this.velocity.y += this.gravity;
    this.x += this.velocity.x;
    this.y += this.velocity.y;
    this.alpha -= this.decay;
  }
  
  draw() {
    if (!fireworksCtx) return;
    fireworksCtx.save();
    fireworksCtx.globalAlpha = this.alpha;
    fireworksCtx.fillStyle = this.color;
    fireworksCtx.shadowBlur = 10;
    fireworksCtx.shadowColor = this.color;
    fireworksCtx.beginPath();
    fireworksCtx.arc(this.x, this.y, 3, 0, Math.PI * 2); // 稍微增大粒子大小
    fireworksCtx.fill();
    fireworksCtx.restore();
  }
}

// 烟花类
class Firework {
  constructor(x, y, targetY) {
    this.x = x;
    this.y = y;
    this.targetY = targetY;
    this.velocity = {
      x: (Math.random() - 0.5) * 2,
      y: -Math.random() * 3 - 2
    };
    this.exploded = false;
    this.particles = [];
    this.color = `hsl(${Math.random() * 360}, 100%, 60%)`;
  }
  
  update() {
    if (!this.exploded) {
      this.x += this.velocity.x;
      this.y += this.velocity.y;
      
      if (this.y <= this.targetY) {
        this.explode();
      }
    } else {
      this.particles.forEach((particle, index) => {
        particle.update();
        if (particle.alpha <= 0) {
          this.particles.splice(index, 1);
        }
      });
    }
  }
  
  explode() {
    this.exploded = true;
    // 增加粒子数量，让烟花更猛烈
    const particleCount = 100;
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = Math.random() * 8 + 3; // 增加速度范围
      this.particles.push(new Particle(
        this.x,
        this.y,
        this.color,
        {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed
        }
      ));
    }
  }
  
  draw() {
    if (!fireworksCtx) return;
    if (!this.exploded) {
      fireworksCtx.save();
      fireworksCtx.fillStyle = this.color;
      fireworksCtx.beginPath();
      fireworksCtx.arc(this.x, this.y, 3, 0, Math.PI * 2);
      fireworksCtx.fill();
      fireworksCtx.restore();
    } else {
      this.particles.forEach(particle => particle.draw());
    }
  }
}

// 烟花动画循环
function animateFireworks() {
  if (!fireworksCtx || !fireworksCanvas) return;
  
  fireworksCtx.fillStyle = 'rgba(0, 0, 0, 0.1)';
  fireworksCtx.fillRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);
  
  // 更新和绘制所有烟花
  fireworks.forEach((firework, index) => {
    firework.update();
    firework.draw();
    
    // 移除已完成的烟花
    if (firework.exploded && firework.particles.length === 0) {
      fireworks.splice(index, 1);
    }
  });
  
  // 如果还有烟花，继续动画
  if (fireworks.length > 0) {
    fireworksAnimationId = requestAnimationFrame(animateFireworks);
  } else {
    // 清理画布
    fireworksCtx.clearRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);
    fireworksAnimationId = null;
  }
}

// 触发烟花效果
function triggerFireworks(callback) {
  if (!fireworksCanvas) {
    initFireworksCanvas();
  }
  
  // 播放烟花音乐（如果有的话）
  const fireworksMusic = document.getElementById('fireworksMusic');
  if (fireworksMusic && !fireworksMusicPlaying) {
    fireworksMusicPlaying = true;
    fireworksMusic.volume = 0.6; // 稍微增大音量
    fireworksMusic.currentTime = 0; // 从头开始播放
    fireworksMusic.play().catch(err => {
      console.log('Fireworks music play failed (this is OK if no music file is provided):', err);
      fireworksMusicPlaying = false;
    });
    
    // 音乐结束后重置标志
    fireworksMusic.onended = () => {
      fireworksMusicPlaying = false;
    };
  }
  
  // 创建更多烟花，让效果更猛烈
  const fireworkCount = 20; // 从8增加到20
  const delay = 150; // 从300减少到150，让烟花更频繁
  
  for (let i = 0; i < fireworkCount; i++) {
    setTimeout(() => {
      const x = Math.random() * window.innerWidth;
      const targetY = Math.random() * (window.innerHeight * 0.5) + 100;
      fireworks.push(new Firework(x, window.innerHeight, targetY));
      
      // 如果这是第一个烟花，开始动画循环
      if (fireworks.length === 1 && !fireworksAnimationId) {
        animateFireworks();
      }
    }, i * delay);
  }
  
  // 计算总时长：最后一个烟花发射时间 + 烟花持续时间（约4秒，因为粒子更多）
  const totalDuration = (fireworkCount - 1) * delay + 4000;
  
  setTimeout(() => {
    // 停止烟花音乐
    if (fireworksMusic) {
      fireworksMusic.pause();
      fireworksMusic.currentTime = 0;
      fireworksMusicPlaying = false;
    }
    
    // 确保背景音乐继续播放
    const bgMusic = document.getElementById('bgMusic');
    if (bgMusic && musicPlaying) {
      // 如果背景音乐暂停了，重新播放
      if (bgMusic.paused) {
        bgMusic.play().catch(err => {
          console.log('Background music resume failed:', err);
        });
      }
    }
    
    // 执行回调（播放背景音乐）
    if (callback) {
      callback();
    }
  }, totalDuration);
}

// 在DOM加载时初始化烟花画布
document.addEventListener('DOMContentLoaded', () => {
  initFireworksCanvas();
});

