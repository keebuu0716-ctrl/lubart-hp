/* ===================================================
   script.js
   ホームページのインタラクション・アニメーション処理
=================================================== */

// DOM 読み込み完了後に実行
document.addEventListener('DOMContentLoaded', () => {

  // ===================================================
  // 1. ヘッダー：スクロール時に背景を追従させる
  // ===================================================
  const header = document.getElementById('header');

  const handleHeaderScroll = () => {
    if (window.scrollY > 60) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  // 初期チェック（ページ途中でリロードされた場合）
  handleHeaderScroll();
  window.addEventListener('scroll', handleHeaderScroll, { passive: true });


  // ===================================================
  // 2. ハンバーガーメニュー：開閉処理
  // ===================================================
  const hamburger = document.getElementById('hamburger');
  const drawer    = document.getElementById('drawer');

  // オーバーレイ要素を動的に生成
  const overlay = document.createElement('div');
  overlay.classList.add('drawer-overlay');
  document.body.appendChild(overlay);

  // ドロワーを開く関数
  const openDrawer = () => {
    hamburger.classList.add('open');
    drawer.classList.add('open');
    overlay.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden'; // 背景スクロールを無効化
  };

  // ドロワーを閉じる関数
  const closeDrawer = () => {
    hamburger.classList.remove('open');
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = ''; // 背景スクロールを再有効化
  };

  // ハンバーガーボタンのクリックで開閉トグル
  hamburger.addEventListener('click', () => {
    const isOpen = drawer.classList.contains('open');
    isOpen ? closeDrawer() : openDrawer();
  });

  // オーバーレイクリックで閉じる
  overlay.addEventListener('click', closeDrawer);

  // ドロワー内リンクをクリックしたら閉じる
  const drawerLinks = drawer.querySelectorAll('.drawer__link');
  drawerLinks.forEach(link => {
    link.addEventListener('click', closeDrawer);
  });

  // Escape キーでドロワーを閉じる
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) {
      closeDrawer();
      hamburger.focus(); // フォーカスをハンバーガーボタンに戻す
    }
  });


  // ===================================================
  // 3. スムーススクロール：アンカーリンク
  // ===================================================
  const anchorLinks = document.querySelectorAll('a[href^="#"]');

  anchorLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');

      // '#' のみの場合はページトップへ
      if (targetId === '#') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      const targetEl = document.querySelector(targetId);
      if (!targetEl) return;

      e.preventDefault();

      // ヘッダーの高さ分オフセット
      const headerHeight = header.offsetHeight;
      const targetTop = targetEl.getBoundingClientRect().top + window.scrollY - headerHeight;

      window.scrollTo({ top: targetTop, behavior: 'smooth' });
    });
  });


  // ===================================================
  // 4. フェードインアニメーション：IntersectionObserver
  // ===================================================
  const fadeElements = document.querySelectorAll('.fade-in');

  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        // 同一セクション内の要素に連番でディレイを設定
        const delay = entry.target.dataset.delay || 0;
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, delay);

        // 一度表示したら監視を解除
        fadeObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15, // 要素の 15% が見えたらトリガー
    rootMargin: '0px 0px -40px 0px',
  });

  fadeElements.forEach((el, i) => {
    // 同一親要素内で順番に応じたディレイを設定（最大 4 要素まで）
    const siblings = el.parentElement.querySelectorAll('.fade-in');
    const index    = Array.from(siblings).indexOf(el);
    el.dataset.delay = Math.min(index * 120, 360); // 最大 360ms
    fadeObserver.observe(el);
  });

  // ヒーローセクション内のすべての fade-in を即時表示（スクロール前なので）
  const heroFades = document.querySelectorAll('.hero .fade-in');
  heroFades.forEach((el, i) => {
    setTimeout(() => {
      el.classList.add('visible');
    }, 300 + i * 150); // テキスト→画像の順に少しずらして表示
  });


  // ===================================================
  // 5. お問い合わせフォーム：送信ハンドリング（仮）
  // ===================================================
  const contactForm = document.querySelector('.contact-form');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      // バリデーション：必須フィールドのチェック
      const requiredFields = contactForm.querySelectorAll('[required]');
      let isValid = true;

      requiredFields.forEach(field => {
        if (!field.value.trim()) {
          isValid = false;
          field.style.borderColor = '#e74c3c';
          field.addEventListener('input', () => {
            field.style.borderColor = '';
          }, { once: true });
        }
      });

      if (!isValid) {
        alert('必須項目をご入力ください。');
        return;
      }

      // 仮の送信完了メッセージ
      // 実際の運用では fetch() でバックエンドに送信する
      const submitBtn = contactForm.querySelector('[type="submit"]');
      submitBtn.textContent = '送信しました。ありがとうございます！';
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.7';
      contactForm.reset();
    });
  }


  // ===================================================
  // 6. ページトップへ戻るボタン：スクロール量に応じて表示
  // ===================================================
  const toTopBtn = document.querySelector('.footer__totop');

  if (toTopBtn) {
    toTopBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ===================================================
  // 7. 1日の流れ：タブ切り替え
  // ===================================================
  const tabBtns     = document.querySelectorAll('.flow__tab-btn');
  const tabContents = document.querySelectorAll('.flow__tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;

      // ボタンのアクティブ切り替え
      tabBtns.forEach(b => {
        b.classList.remove('flow__tab-btn--active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('flow__tab-btn--active');
      btn.setAttribute('aria-selected', 'true');

      // コンテンツのアクティブ切り替え
      tabContents.forEach(content => {
        content.classList.remove('flow__tab-content--active');
      });
      const activeContent = document.getElementById(`tab-${target}`);
      if (activeContent) activeContent.classList.add('flow__tab-content--active');
    });
  });


  // ===================================================
  // 8. AIチャットウィジェット
  // ===================================================
  const chatFab      = document.getElementById('chatFab');
  const chatPanel    = document.getElementById('chatPanel');
  const chatClose    = document.getElementById('chatClose');
  const chatMessages = document.getElementById('chatMessages');
  const chatInput    = document.getElementById('chatInput');
  const chatSend     = document.getElementById('chatSend');

  // 会話履歴（Claude APIに送る messages 配列）
  let conversationHistory = [];

  // チャットパネルを開く
  const openChat = () => {
    chatFab.classList.add('open');
    chatFab.setAttribute('aria-expanded', 'true');
    chatPanel.classList.add('open');
    chatPanel.setAttribute('aria-hidden', 'false');
    chatInput.focus();
    scrollToBottom();
  };

  // チャットパネルを閉じる
  const closeChat = () => {
    chatFab.classList.remove('open');
    chatFab.setAttribute('aria-expanded', 'false');
    chatPanel.classList.remove('open');
    chatPanel.setAttribute('aria-hidden', 'true');
  };

  chatFab.addEventListener('click', () => {
    chatPanel.classList.contains('open') ? closeChat() : openChat();
  });
  chatClose.addEventListener('click', closeChat);

  // メッセージ末尾にスクロール
  const scrollToBottom = () => {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  };

  // メッセージバブルを追加する汎用関数
  const appendMessage = (role, html) => {
    const wrapper = document.createElement('div');
    wrapper.className = `chat-msg chat-msg--${role}`;

    if (role === 'bot') {
      wrapper.innerHTML = `
        <span class="chat-msg__avatar">🤖</span>
        <div class="chat-msg__bubble">${html}</div>`;
    } else if (role === 'user') {
      wrapper.innerHTML = `
        <div class="chat-msg__bubble">${escapeHtml(html)}</div>`;
    } else if (role === 'error') {
      wrapper.innerHTML = `
        <span class="chat-msg__avatar">⚠️</span>
        <div class="chat-msg__bubble">${html}</div>`;
    }

    chatMessages.appendChild(wrapper);
    scrollToBottom();
    return wrapper;
  };

  // ローディングドット表示
  const showLoading = () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'chat-msg chat-msg--bot chat-msg--loading';
    wrapper.id = 'chatLoading';
    wrapper.innerHTML = `
      <span class="chat-msg__avatar">🤖</span>
      <div class="chat-msg__bubble">
        <span class="chat-dot"></span>
        <span class="chat-dot"></span>
        <span class="chat-dot"></span>
      </div>`;
    chatMessages.appendChild(wrapper);
    scrollToBottom();
  };

  // ローディングドットを削除
  const hideLoading = () => {
    const el = document.getElementById('chatLoading');
    if (el) el.remove();
  };

  // HTML エスケープ（ユーザー入力を安全に表示）
  const escapeHtml = (str) =>
    str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
       .replace(/"/g, '&quot;').replace(/\n/g, '<br />');

  // テキストを改行対応HTMLに変換（ボット応答用）
  const textToHtml = (str) =>
    escapeHtml(str).replace(/&lt;br \/&gt;/g, '<br />');

  // 送信処理
  const sendMessage = async () => {
    const text = chatInput.value.trim();
    if (!text) return;

    // ユーザーメッセージを表示 & 履歴に追加
    appendMessage('user', text);
    conversationHistory.push({ role: 'user', content: text });

    // 入力欄リセット・無効化
    chatInput.value = '';
    chatInput.style.height = 'auto';
    chatSend.disabled = true;
    chatInput.disabled = true;

    // ローディング表示
    showLoading();

    try {
      // SSE ストリームで /api/chat を呼び出す
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: conversationHistory }),
      });

      if (!response.ok) {
        throw new Error(`HTTPエラー: ${response.status}`);
      }

      // ローディングを消してボットバブルを準備
      hideLoading();
      const botWrapper = appendMessage('bot', '');
      const bubble = botWrapper.querySelector('.chat-msg__bubble');

      let fullText = ''; // ストリームで積み上げるテキスト

      // SSE テキストを逐次読み込み
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // 改行区切りで SSE イベントを分割
        const lines = buffer.split('\n');
        buffer = lines.pop(); // 末尾の未完行はバッファに残す

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') break;

          try {
            const json = JSON.parse(payload);

            if (json.error) {
              // エラーレスポンスの場合
              bubble.innerHTML = `<span style="color:#c0392b">⚠️ ${escapeHtml(json.error)}</span>`;
              break;
            }

            if (json.text) {
              fullText += json.text;
              // 改行を <br> に変換してリアルタイム表示
              bubble.innerHTML = escapeHtml(fullText).replace(/\n/g, '<br />');
              scrollToBottom();
            }
          } catch {
            // JSONパース失敗は無視
          }
        }
      }

      // 会話履歴にボットの返答を追加
      if (fullText) {
        conversationHistory.push({ role: 'assistant', content: fullText });
      }

    } catch (err) {
      hideLoading();
      appendMessage('error', `通信エラーが発生しました。<br /><small>${escapeHtml(err.message)}</small>`);
      console.error('チャット通信エラー:', err);
    } finally {
      // 入力欄を再有効化
      chatSend.disabled = false;
      chatInput.disabled = false;
      chatInput.focus();
    }
  };

  // 送信ボタンクリック
  chatSend.addEventListener('click', sendMessage);

  // Enter で送信（Shift+Enter は改行）
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // テキストエリアの高さを入力に合わせて自動調整
  chatInput.addEventListener('input', () => {
    chatInput.style.height = 'auto';
    chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
  });

}); // DOMContentLoaded 終了
