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

}); // DOMContentLoaded 終了
