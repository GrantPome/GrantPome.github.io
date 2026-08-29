// 主入口：粒子聚集 · 视差滚动 · 导航效果 · 入场动画 · 作品集渲染 · 弹窗 · 卡片光晕 · 无障碍
(function () {
  "use strict";

  // 刷新时始终回到首屏顶部
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }
  window.scrollTo(0, 0);

  // ---------- iPadOS 风格形变鼠标球（三态状态机） ----------
  (function () {
    const glow = document.getElementById("cursor-glow");
    const inner = document.getElementById("cursor-glow-inner");
    if (!glow || !inner) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let glowX = mouseX;
    let glowY = mouseY;

    // 状态机：normal | card | button
    let mode = "normal";
    let btnEl = null;
    let btnRect = null;
    let stickyX = 0;
    let stickyY = 0;
    let cardLeaveTimer = null;

    const STICKY_FACTOR = 0.2;

    const cardSelector = ".work-card, .contact-card, .grant-card, .card, .about-item";
    const buttonSelector = "button, .theme-toggle, .modal-close, .nav-logo, .scroll-hint, .nav-links a, .footer-col-list a, .modal-btn";

    const animate = () => {
      if (mode === "normal") {
        // 线性 1:1 跟随，无形变
        glowX = mouseX;
        glowY = mouseY;
        glow.style.opacity = "1";
        glow.style.transform = `translate(${glowX}px, ${glowY}px)`;
        inner.style.transform = "translate(-50%, -50%)";
      } else if (mode === "button" && btnRect) {
        const tx = btnRect.left + btnRect.width / 2 + stickyX;
        const ty = btnRect.top + btnRect.height / 2 + stickyY;
        glowX += (tx - glowX) * 0.3;
        glowY += (ty - glowY) * 0.3;
        glow.style.opacity = "1";
        glow.style.transform = `translate(${glowX}px, ${glowY}px)`;
        inner.style.transform = "translate(-50%, -50%)";
      } else if (mode === "card") {
        glow.style.opacity = "0";
      }

      requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (mode === "button" && btnRect) {
        const cx = btnRect.left + btnRect.width / 2;
        const cy = btnRect.top + btnRect.height / 2;
        stickyX = (e.clientX - cx) * STICKY_FACTOR;
        stickyY = (e.clientY - cy) * STICKY_FACTOR;

        const maxOffset = Math.max(btnRect.width, btnRect.height) * 0.6;
        const dist = Math.sqrt(stickyX * stickyX + stickyY * stickyY);
        if (dist > maxOffset) {
          resetButton();
        } else if (btnEl) {
          btnEl.style.translate = `${stickyX}px ${stickyY}px`;
        }
      }
    });

    // ===== 事件委托：按钮 + 卡片 =====
    document.addEventListener("mouseover", (e) => {
      const btn = e.target.closest(buttonSelector);
      const card = e.target.closest(cardSelector);

      // 只在进入卡片或按钮时取消离开计时器（避免移到普通元素时误清）
      if ((btn || card) && cardLeaveTimer) {
        clearTimeout(cardLeaveTimer);
        cardLeaveTimer = null;
      }

      if (btn) {
        if (mode === "card") {
          mode = "normal";
          glowX = mouseX;
          glowY = mouseY;
        }
        if (mode === "button" && btnEl === btn) return;
        if (mode === "button") resetButton();
        if (mode === "normal") enterButton(btn);
        return;
      }

      if (card && mode === "normal") {
        mode = "card";
      }
    });

    document.addEventListener("mouseout", (e) => {
      // 按钮离开
      if (mode === "button" && btnEl) {
        if (e.relatedTarget && btnEl.contains(e.relatedTarget)) return;
        if (e.relatedTarget && e.relatedTarget.closest(buttonSelector)) return;
        if (e.relatedTarget && e.relatedTarget.closest(cardSelector)) { resetButton(); return; }
        resetButton();
        return;
      }

      // 卡片离开
      if (mode === "card") {
        const card = e.target.closest(cardSelector);
        if (!card) return;
        if (e.relatedTarget && card.contains(e.relatedTarget)) return;
        if (e.relatedTarget && e.relatedTarget.closest(cardSelector)) return;
        if (e.relatedTarget && e.relatedTarget.closest(buttonSelector)) {
          mode = "normal";
          glowX = mouseX;
          glowY = mouseY;
          return;
        }
        // 延迟切回正常，避免卡片间移动闪烁
        cardLeaveTimer = setTimeout(() => {
          if (mode === "card") {
            mode = "normal";
            // 立即同步到鼠标位置，避免出现在过期位置
            glowX = mouseX;
            glowY = mouseY;
          }
          cardLeaveTimer = null;
        }, 80);
      }
    });

    function enterButton(btn) {
      mode = "button";
      btnEl = btn;
      btn.style.translate = "";
      btnRect = btn.getBoundingClientRect();
      stickyX = 0;
      stickyY = 0;
      // 从当前鼠标位置开始吸附
      glowX = mouseX;
      glowY = mouseY;

      const isCircle = btn.classList.contains("modal-close") || btn.classList.contains("theme-toggle");
      // 无背景/无框线按钮（如 scroll-hint、页脚链接）：光晕略大于目标（排除导航栏）
      const cs = getComputedStyle(btn);
      const inNavbar = btn.closest(".navbar");
      const hasBg = cs.backgroundColor !== "rgba(0, 0, 0, 0)" && cs.backgroundColor !== "transparent";
      const hasBorder = parseInt(cs.borderWidth) > 0;
      const expand = (!inNavbar && !hasBg && !hasBorder) ? 8 : 0;
      inner.style.width = (btnRect.width + expand) + "px";
      inner.style.height = (btnRect.height + expand) + "px";
      inner.style.borderRadius = isCircle ? "50%" : (cs.borderRadius && cs.borderRadius !== "0px" ? cs.borderRadius : "8px");
      inner.style.background = "rgba(128, 128, 128, 0.12)";
      inner.style.borderColor = "rgba(128, 128, 128, 0.4)";

      const isSmall = btnRect.width < 48 || btnRect.height < 48;
      btn.classList.add(isSmall ? "btn-sticky-glow-sm" : "btn-sticky-glow");
    }

    function resetButton() {
      if (btnEl) {
        btnEl.style.translate = "";
        btnEl.classList.remove("btn-sticky-glow");
        btnEl.classList.remove("btn-sticky-glow-sm");
      }
      inner.style.width = "";
      inner.style.height = "";
      inner.style.borderRadius = "";
      inner.style.background = "";
      inner.style.borderColor = "";

      mode = "normal";
      btnEl = null;
      btnRect = null;
      stickyX = 0;
      stickyY = 0;
      // 同步到鼠标位置
      glowX = mouseX;
      glowY = mouseY;
    }

    // 按下缩小（仅正常模式）
    window.addEventListener("mousedown", () => {
      if (mode === "normal") inner.classList.add("pressed");
    });
    window.addEventListener("mouseup", () => {
      inner.classList.remove("pressed");
    });

    // 鼠标离开页面时隐藏
    document.documentElement.addEventListener("mouseleave", () => {
      glow.style.opacity = "0";
    });
    document.documentElement.addEventListener("mouseenter", () => {
      if (mode !== "card") glow.style.opacity = "1";
    });

    animate();
  })();

  // ---------- Hero 方形粒子聚集成像特效（电影级序列） ----------
  (function () {
    const canvas = document.getElementById("hero-particles");
    const heroBg = document.querySelector(".hero-bg");
    const heroInner = document.querySelector(".hero-inner");
    const navbar = document.getElementById("navbar");
    const scrollHint = document.querySelector(".scroll-hint");
    if (!canvas || !heroBg) return;

    const ctx = canvas.getContext("2d");
    // 使用 data URL 避免 file:// 协议下 canvas 被污染导致 getImageData 抛出 SecurityError
    const IMG_SRC = "data:image/jpeg;base64,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";
    const SAMPLE_STEP = 7;       // 采样间隔，越大粒子越少
    const DURATION = 2000;       // 聚集动画总时长 ms
    const DELAY_RANGE = 800;     // 粒子延迟分散范围 ms
    const FLOAT_AMPLITUDE = 1.2; // 完成后漂浮幅度 px
    const FLOAT_SPEED = 0.002;   // 漂浮速度

    // 动画序列时间节点（相对于聚集完成时间）
    const SEQ = {
      bgBlurIn: 0,          // 所有粒子集齐后，模糊背景淡入
      bgSharpen: 300,       // 背景从模糊变清晰（延迟，让用户先看到模糊态）
      overlayFadeIn: 800,   // 黑色遮罩淡入
      canvasFadeOut: 1000,  // 粒子画布淡出
      avatarIn: 1200,       // 头像淡入
      navbarIn: 1400,       // 导航栏淡入
      contentIn: 1600,      // 其余内容淡入
    };

    let particles = [];
    let startTime = 0;
    let animationId = null;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let allDone = false;
    let floatTime = 0;
    let doneTimestamp = 0;
    let blurTriggered = false;

    const resizeCanvas = () => {
      const hero = canvas.parentElement;
      const rect = hero.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    const img = new Image();
    let sequenceStarted = false;

    // 安全兜底：5 秒后无论如何都显示内容（防止图片加载失败导致页面空白）
    const safetyTimer = setTimeout(() => {
      if (!sequenceStarted) {
        sequenceStarted = true;
        showAllContent();
        canvas.style.display = "none";
        if (animationId) {
          cancelAnimationFrame(animationId);
          animationId = null;
        }
      }
    }, 5000);

    img.onload = () => {
      clearTimeout(safetyTimer);
      resizeCanvas();
      try {
        initParticles(img);
        startTime = performance.now();
        animationId = requestAnimationFrame(animate);
      } catch (err) {
        console.error("粒子初始化失败:", err);
        sequenceStarted = true;
        showAllContent();
        canvas.style.display = "none";
      }
    };

    img.onerror = () => {
      clearTimeout(safetyTimer);
      sequenceStarted = true;
      showAllContent();
      canvas.style.display = "none";
    };

    img.src = IMG_SRC;

    function showAllContent() {
      heroBg.classList.add("blur-in");
      heroBg.classList.add("sharpen");
      heroBg.classList.add("overlay-in");
      if (heroInner) {
        heroInner.classList.add("avatar-in");
        heroInner.classList.add("content-in");
      }
      if (navbar) {
        navbar.classList.add("visible");
      }
      if (scrollHint) {
        scrollHint.classList.add("visible");
      }
    }

    function initParticles(imgEl) {
      particles = [];
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      const offscreen = document.createElement("canvas");
      const offCtx = offscreen.getContext("2d");

      const imgRatio = imgEl.width / imgEl.height;
      const canvasRatio = w / h;
      let drawW, drawH, drawX, drawY;

      if (imgRatio > canvasRatio) {
        drawH = h;
        drawW = h * imgRatio;
        drawX = (w - drawW) / 2;
        drawY = 0;
      } else {
        drawW = w;
        drawH = w / imgRatio;
        drawX = 0;
        drawY = (h - drawH) / 2;
      }

      offscreen.width = Math.floor(w);
      offscreen.height = Math.floor(h);
      // 先对离屏画布做模糊处理，使粒子组成的是模糊版图片
      offCtx.filter = "blur(15px)";
      offCtx.drawImage(imgEl, drawX, drawY, drawW, drawH);
      offCtx.filter = "none";

      const imageData = offCtx.getImageData(0, 0, Math.floor(w), Math.floor(h));
      const data = imageData.data;

      for (let y = 0; y < h; y += SAMPLE_STEP) {
        for (let x = 0; x < w; x += SAMPLE_STEP) {
          const idx = (y * Math.floor(w) + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3];
          if (a < 10) continue;

          // 随机起始位置：从画面外围散开
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.random() * Math.max(w, h) * 0.7 + 150;
          const startX = w / 2 + Math.cos(angle) * dist;
          const startY = h / 2 + Math.sin(angle) * dist;

          // 亮度决定粒子大小：亮处稍大，暗处稍小
          const brightness = (r + g + b) / 3 / 255;
          const baseSize = SAMPLE_STEP * 0.4;
          const size = baseSize + brightness * baseSize * 0.5 + Math.random() * 0.6;

          particles.push({
            x: startX,
            y: startY,
            targetX: x + (Math.random() - 0.5) * 2,
            targetY: y + (Math.random() - 0.5) * 2,
            color: `rgb(${r},${g},${b})`,
            delay: Math.random() * DELAY_RANGE,
            size: size,
            floatPhase: Math.random() * Math.PI * 2,
            floatSpeed: 0.8 + Math.random() * 0.6,
          });
        }
      }
    }

    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function runSequence() {
      sequenceStarted = true;

      // 序列 0：所有粒子集齐后，模糊背景淡入
      heroBg.classList.add("blur-in");

      // 序列 1：背景从模糊变清晰（延迟，让用户先看到模糊态）
      setTimeout(() => {
        heroBg.classList.add("sharpen");
      }, SEQ.bgSharpen);

      // 序列 2：黑色遮罩淡入
      setTimeout(() => {
        heroBg.classList.add("overlay-in");
      }, SEQ.overlayFadeIn);

      // 序列 3：粒子画布淡出
      setTimeout(() => {
        canvas.classList.add("fade-out");
      }, SEQ.canvasFadeOut);

      // 序列 4：头像淡入上浮
      if (heroInner) {
        setTimeout(() => {
          heroInner.classList.add("avatar-in");
        }, SEQ.avatarIn);
      }

      // 序列 5：导航栏淡入
      if (navbar) {
        setTimeout(() => {
          navbar.classList.add("visible");
        }, SEQ.navbarIn);
      }

      // 序列 6：其余内容淡入
      if (heroInner) {
        setTimeout(() => {
          heroInner.classList.add("content-in");
        }, SEQ.contentIn);
      }

      // 滚动提示淡入
      if (scrollHint) {
        setTimeout(() => {
          scrollHint.classList.add("visible");
        }, SEQ.contentIn + 200);
      }

      // 完全淡出后停止粒子动画
      setTimeout(() => {
        if (animationId) {
          cancelAnimationFrame(animationId);
          animationId = null;
        }
        canvas.style.display = "none";
      }, SEQ.canvasFadeOut + 900);
    }

    function animate() {
      const now = performance.now();
      const elapsed = now - startTime;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      ctx.clearRect(0, 0, w, h);

      if (!allDone) {
        // 聚集阶段
        let doneCount = 0;
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          const localElapsed = Math.max(0, elapsed - p.delay);
          const progress = Math.min(1, localElapsed / DURATION);

          if (progress >= 1) doneCount++;

          const eased = easeOutCubic(progress);

          const x = p.x + (p.targetX - p.x) * eased;
          const y = p.y + (p.targetY - p.y) * eased;

          const alpha = Math.min(1, progress * 1.5);

          // 方形粒子
          ctx.globalAlpha = alpha;
          ctx.fillStyle = p.color;
          ctx.fillRect(x - p.size, y - p.size, p.size * 2, p.size * 2);
        }

        ctx.globalAlpha = 1;

        if (doneCount === particles.length) {
          allDone = true;
          doneTimestamp = now;
          runSequence();
        }
      } else {
        // 漂浮阶段
        floatTime += 16;
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          const floatX = Math.sin(floatTime * FLOAT_SPEED * p.floatSpeed + p.floatPhase) * FLOAT_AMPLITUDE;
          const floatY = Math.cos(floatTime * FLOAT_SPEED * p.floatSpeed * 0.7 + p.floatPhase) * FLOAT_AMPLITUDE * 0.6;

          ctx.fillStyle = p.color;
          ctx.fillRect(
            p.targetX + floatX - p.size,
            p.targetY + floatY - p.size,
            p.size * 2,
            p.size * 2
          );
        }
      }

      if (animationId !== null) {
        animationId = requestAnimationFrame(animate);
      }
    }

    // 窗口大小变化时重采样
    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (animationId) {
          cancelAnimationFrame(animationId);
          animationId = null;
        }
        allDone = false;
        floatTime = 0;
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        resizeCanvas();
        if (img.complete) {
          initParticles(img);
          startTime = performance.now();
          animationId = requestAnimationFrame(animate);
        }
      }, 300);
    });

    // 尊重 reduced motion 设置
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      heroBg.classList.add("blur-in");
      heroBg.classList.add("sharpen");
      heroBg.classList.add("overlay-in");
      canvas.style.display = "none";
      if (heroInner) {
        heroInner.classList.add("avatar-in", "content-in");
      }
      if (navbar) {
        navbar.classList.add("visible");
      }
      if (scrollHint) {
        scrollHint.classList.add("visible");
      }
      return;
    }
  })();

  // ---------- 视差滚动（requestAnimationFrame 驱动） ----------
  const parallaxEls = document.querySelectorAll("[data-parallax-speed]");
  let scrollY = 0;
  let ticking = false;

  const updateParallax = () => {
    parallaxEls.forEach((el) => {
      const speed = parseFloat(el.dataset.parallaxSpeed);
      const offset = scrollY * speed;
      el.style.transform = `translate3d(0, ${offset}px, 0)`;
    });

    // Hero 内容渐隐效果（优化：非线性曲线）
    const heroInner = document.querySelector(".hero-inner");
    if (heroInner) {
      const progress = Math.min(1, scrollY / 500);
      const eased = 1 - Math.pow(1 - progress, 2); // easeOutQuad
      heroInner.style.opacity = 1 - eased;
      heroInner.style.transform = `translate3d(0, ${scrollY * 0.4}px, 0) scale(${1 - eased * 0.05})`;
    }

    ticking = false;
  };

  const onScroll = () => {
    scrollY = window.pageYOffset;
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  };

  window.addEventListener("scroll", onScroll, { passive: true });

  // ---------- 导航栏滚动效果 + 激活态 ----------
  const navbar = document.getElementById("navbar");
  const navLinks = document.querySelectorAll(".nav-links a");
  const sections = document.querySelectorAll("section[id]");

  const updateNavbar = () => {
    // 滚动状态
    if (scrollY > 20) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }

    // 当前激活导航项（带偏移缓冲）
    let current = "";
    sections.forEach((sec) => {
      const top = sec.offsetTop - 150;
      if (scrollY >= top) current = sec.id;
    });

    navLinks.forEach((a) => {
      const isActive = a.getAttribute("href") === "#" + current;
      a.classList.toggle("active", isActive);
      if (isActive) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  };

  // 合并滚动回调
  window.removeEventListener("scroll", onScroll);
  window.addEventListener(
    "scroll",
    () => {
      scrollY = window.pageYOffset;
      if (!ticking) {
        requestAnimationFrame(() => {
          updateParallax();
          updateNavbar();
          ticking = false;
        });
        ticking = true;
      }
    },
    { passive: true }
  );

  // ---------- 交错入场动画 ----------
  const fadeEls = document.querySelectorAll(".fade-in");

  // 按网格位置计算交错延迟，自适应列数
  const setStaggerDelay = () => {
    const grids = document.querySelectorAll(".about-grid, .cards-grid, .works-grid, .grant-grid, .grant-stats");
    grids.forEach((grid) => {
      const items = grid.querySelectorAll(".fade-in");
      const gridStyles = getComputedStyle(grid);
      const cols = gridStyles.gridTemplateColumns.split(" ").length;

      items.forEach((item, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        item.style.transitionDelay = col * 70 + row * 35 + "ms";
      });
    });
  };

  setStaggerDelay();
  window.addEventListener("resize", () => {
    let resizeTimer;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(setStaggerDelay, 200);
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -60px 0px" }
  );
  fadeEls.forEach((el) => observer.observe(el));

  // ---------- 卡片鼠标光晕追踪（事件委托 + rAF 节流） ----------
  let glowRafId = null;
  let glowTargetEl = null;
  let glowTargetX = 50, glowTargetY = 50;
  let glowTargetPxX = 0, glowTargetPxY = 0;

  const updateCardGlow = () => {
    if (glowTargetEl) {
      glowTargetEl.style.setProperty("--mouse-x", glowTargetX + "%");
      glowTargetEl.style.setProperty("--mouse-y", glowTargetY + "%");
      glowTargetEl.style.setProperty("--mouse-x-px", glowTargetPxX + "px");
      glowTargetEl.style.setProperty("--mouse-y-px", glowTargetPxY + "px");
    }
    glowRafId = null;
  };

  document.addEventListener("mousemove", (e) => {
    const target = e.target.closest(".card, .grant-card, .work-card, .contact-card, .about-item, .btn-sticky-glow, .btn-sticky-glow-sm");
    if (!target) return;
    const rect = target.getBoundingClientRect();
    glowTargetX = ((e.clientX - rect.left) / rect.width) * 100;
    glowTargetY = ((e.clientY - rect.top) / rect.height) * 100;
    glowTargetPxX = e.clientX - rect.left;
    glowTargetPxY = e.clientY - rect.top;
    glowTargetEl = target;
    if (!glowRafId) glowRafId = requestAnimationFrame(updateCardGlow);
  });

  // ---------- Hero CTA 3D 悬浮效果 ----------
  (function () {
    const cta = document.querySelector(".hero-cta");
    if (!cta) return;

    let rafId = null;
    let btnWidth = 0, btnHeight = 0;
    let currentX = 0, currentY = 0;
    let targetX = 0, targetY = 0;
    let isHovering = false;
    const MAX_ROTATE = 8;
    const LERP_FACTOR = 0.18;

    const update = () => {
      if (!isHovering) { rafId = null; return; }
      currentX += (targetX - currentX) * LERP_FACTOR;
      currentY += (targetY - currentY) * LERP_FACTOR;
      cta.style.transform = `perspective(800px) rotateX(${currentY}deg) rotateY(${currentX}deg) translateZ(4px) scale(1.02)`;
      if (Math.abs(targetX - currentX) < 0.05 && Math.abs(targetY - currentY) < 0.05) {
        currentX = targetX; currentY = targetY;
        cta.style.transform = `perspective(800px) rotateX(${currentY}deg) rotateY(${currentX}deg) translateZ(4px) scale(1.02)`;
        rafId = null;
        return;
      }
      rafId = requestAnimationFrame(update);
    };

    const startLoop = () => { if (!rafId) rafId = requestAnimationFrame(update); };

    cta.addEventListener("mouseenter", () => {
      const rect = cta.getBoundingClientRect();
      btnWidth = rect.width;
      btnHeight = rect.height;
      isHovering = true;
      cta.style.transition = "box-shadow 200ms ease";
    });

    cta.addEventListener("mousemove", (e) => {
      if (!isHovering) return;
      const x = e.offsetX;
      const y = e.offsetY;
      targetX = ((x - btnWidth / 2) / (btnWidth / 2)) * MAX_ROTATE;
      targetY = -((y - btnHeight / 2) / (btnHeight / 2)) * MAX_ROTATE;
      startLoop();
    });

    cta.addEventListener("mouseleave", () => {
      isHovering = false;
      targetX = 0; targetY = 0;
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      cta.style.transition = "transform 500ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 200ms ease";
      cta.style.transform = "perspective(800px) rotateX(0) rotateY(0) translateZ(0) scale(1)";
      const onEnd = (e) => {
        if (e.propertyName !== "transform") return;
        cta.style.transition = "";
        currentX = 0; currentY = 0;
        cta.removeEventListener("transitionend", onEnd);
      };
      cta.addEventListener("transitionend", onEnd);
    });
  })();

  // ---------- 渲染作品集 ----------
  const grid = document.getElementById("works-grid");
  let activeCard = null; // 当前打开的卡片（用于隐藏/显示）

  // 动态计算作品集最新更新日期
  const latestDate = worksData
    .map(w => new Date(w.date.replace(/\//g, "-")))
    .reduce((max, d) => d > max ? d : max, new Date(0));
  const updateEl = document.getElementById("works-last-update");
  if (updateEl && latestDate.getTime() > 0) {
    const y = latestDate.getFullYear();
    const m = String(latestDate.getMonth() + 1).padStart(2, "0");
    const d = String(latestDate.getDate()).padStart(2, "0");
    updateEl.textContent = `${y}/${m}/${d}`;
  }

  // 预加载作品集全部详情素材并提前解码：
  // 弹窗内的标题/日期/标签/描述为内存数据即时可用，此处针对弹窗大图做
  // <link rel="preload"> 请求 + Image() 提前解码，打开详情时图片已就绪、无缝显示
  worksData.forEach((w) => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = w.image;
    document.head.appendChild(link);

    const img = new Image();
    img.decoding = "async";
    img.src = w.image;
  });

  worksData.forEach((w, i) => {
    const card = document.createElement("div");
    card.className = "work-card fade-in";
    card.setAttribute("role", "listitem");
    card.setAttribute("tabindex", "0");
    card.setAttribute("aria-label", `查看作品：${w.title}`);
    card.style.transitionDelay = (i % 3) * 70 + Math.floor(i / 3) * 35 + "ms";
    card.innerHTML = `
      <div class="work-thumb">
        <img src="${w.image}" alt="${w.title}" decoding="async" fetchpriority="high" />
      </div>
      <div class="work-body">
        <h3>${w.title}</h3>
        <p class="work-date">${w.date}</p>
        <p class="work-desc">${w.desc}</p>
        <span class="work-tag">${w.tag}</span>
      </div>
    `;

    // 3D 悬浮倾斜效果（缓存尺寸 + lerp 平滑 + 防抖动）
    let rafId3d = null;
    let cardWidth = 0, cardHeight = 0;
    let currentX = 0, currentY = 0;  // 当前倾斜值（用于 lerp）
    let targetX = 0, targetY = 0;    // 目标倾斜值
    let isHovering = false;
    const MAX_ROTATE = 6; // 削弱到 6 度
    const LERP_FACTOR = 0.15; // 插值系数，越小越平滑

    const update3D = () => {
      if (!isHovering) {
        rafId3d = null;
        return;
      }
      // LERP 平滑插值
      currentX += (targetX - currentX) * LERP_FACTOR;
      currentY += (targetY - currentY) * LERP_FACTOR;

      card.style.transform = `perspective(1000px) rotateX(${currentY}deg) rotateY(${currentX}deg) translateZ(6px)`;

      // 如果接近目标值就停止 rAF
      if (Math.abs(targetX - currentX) < 0.05 && Math.abs(targetY - currentY) < 0.05) {
        currentX = targetX;
        currentY = targetY;
        card.style.transform = `perspective(1000px) rotateX(${currentY}deg) rotateY(${currentX}deg) translateZ(6px)`;
        rafId3d = null;
        return;
      }

      rafId3d = requestAnimationFrame(update3D);
    };

    const startLoop = () => {
      if (!rafId3d) rafId3d = requestAnimationFrame(update3D);
    };

    card.addEventListener("mouseenter", () => {
      // 缓存尺寸，避免每次 mousemove 都触发回流
      const rect = card.getBoundingClientRect();
      cardWidth = rect.width;
      cardHeight = rect.height;
      isHovering = true;
      card.style.transition = "box-shadow 200ms ease, border-color 200ms ease";
    });

    card.addEventListener("mousemove", (e) => {
      if (!isHovering) return;
      const x = e.offsetX;
      const y = e.offsetY;
      const centerX = cardWidth / 2;
      const centerY = cardHeight / 2;
      targetX = ((x - centerX) / centerX) * MAX_ROTATE;
      targetY = -((y - centerY) / centerY) * MAX_ROTATE;
      startLoop();
    });

    card.addEventListener("mouseleave", () => {
      isHovering = false;
      targetX = 0;
      targetY = 0;
      if (rafId3d) {
        cancelAnimationFrame(rafId3d);
        rafId3d = null;
      }
      // 平滑复位
      card.style.transition = "transform 500ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 200ms ease, border-color 200ms ease";
      card.style.transform = "perspective(1000px) rotateX(0) rotateY(0) translateZ(0)";
      // 过渡结束后重置
      const onEnd = (e) => {
        if (e.propertyName !== "transform") return;
        card.style.transition = "";
        currentX = 0;
        currentY = 0;
        card.removeEventListener("transitionend", onEnd);
      };
      card.addEventListener("transitionend", onEnd);
    });

    const openWork = () => {
      const rect = card.getBoundingClientRect();
      // 在 pointerEvents 改变前捕获倾斜值，避免 mouseleave 重置
      const tiltY = currentX;
      const tiltX = currentY;
      activeCard = card;
      card.style.pointerEvents = "none";
      isHovering = false;
      if (rafId3d) {
        cancelAnimationFrame(rafId3d);
        rafId3d = null;
      }
      // 卡片逐渐消失（400ms），与弹窗交叉淡入
      card.style.transition = "opacity 400ms cubic-bezier(0.22, 1, 0.36, 1)";
      card.style.opacity = "0";
      openModal(w, rect, tiltY, tiltX);
    };

    card.addEventListener("click", openWork);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openWork();
      }
    });

    grid.appendChild(card);
    observer.observe(card);
  });

  // ---------- 作品详情弹窗（非线性连贯动画 · 优化版） ----------
  const modal = document.getElementById("work-modal");
  const modalBody = document.getElementById("modal-body");
  const modalContent = modal.querySelector(".modal-content");
  const modalClose = document.getElementById("modal-close");
  const modalBackdrop = modal.querySelector(".modal-backdrop");

  let originRect = null;
  let scrollbarWidth = 0;
  let isAnimating = false;
  let lastFocusedEl = null;

  // 预计算滚动条宽度
  const getScrollbarWidth = () => {
    if (scrollbarWidth) return scrollbarWidth;
    const div = document.createElement("div");
    div.style.cssText = "width:100px;height:100px;overflow:scroll;position:absolute;top:-9999px";
    document.body.appendChild(div);
    scrollbarWidth = div.offsetWidth - div.clientWidth;
    document.body.removeChild(div);
    return scrollbarWidth;
  };

  // 焦点陷阱
  const trapFocus = (e) => {
    if (e.key !== "Tab") return;
    const focusable = modalContent.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  function openModal(work, cardRect, cardRotateY, cardRotateX) {
    if (isAnimating) return;
    isAnimating = true;

    // 保存焦点
    lastFocusedEl = document.activeElement;

    modalBody.innerHTML = `
      <div class="modal-thumb">
        <img src="${work.image}" alt="${work.title}" decoding="async" />
      </div>
      <h2 id="modal-title">${work.title}</h2>
      <p class="modal-date">${work.date} · ${work.tag}</p>
      <p class="modal-desc">${work.desc}</p>
      ${work.link
        ? `<a href="${work.link}" target="_blank" rel="noopener" class="modal-btn">查看链接 →</a>`
        : `<span class="modal-btn modal-btn-disabled" aria-disabled="true">暂无链接</span>`}
    `;

    originRect = {
      left: cardRect.left,
      top: cardRect.top,
      width: cardRect.width,
      height: cardRect.height,
    };

    // 滚动条宽度补偿（先加 padding 再锁滚动，避免布局抖动）
    const sbw = getScrollbarWidth();
    document.body.style.paddingRight = sbw + "px";
    // 强制回流确保 padding 生效后再隐藏滚动条
    document.body.offsetWidth;
    document.body.style.overflow = "hidden";

    // 先设置 modal 为可见但完全透明，避免闪现
    modal.style.display = "flex";
    modal.style.opacity = "0";
    modal.setAttribute("aria-hidden", "false");
    modalContent.style.opacity = "0";
    modalContent.style.transition = "none";
    modalBackdrop.style.opacity = "0";
    modalBackdrop.style.transition = "none";
    modalBody.style.opacity = "0";

    // 双 rAF 启动动画
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const targetRect = modalContent.getBoundingClientRect();

        const startX =
          originRect.left + originRect.width / 2 - (targetRect.left + targetRect.width / 2);
        const startY =
          originRect.top + originRect.height / 2 - (targetRect.top + targetRect.height / 2);
        const startScale = originRect.width / targetRect.width;
        const rotY = cardRotateY || 0;
        const rotX = cardRotateX || 0;
        // 放大倾斜角度，使回正动画更明显
        const amp = 3;
        const startRotY = rotY * amp;
        const startRotX = rotX * amp;

        modalContent.style.transform = `perspective(1000px) translate3d(${startX}px, ${startY}px, 0) scale(${startScale}) rotateX(${startRotX}deg) rotateY(${startRotY}deg)`;
        modalContent.style.opacity = "0";
        modalContent.style.borderRadius = "16px";
        modalBody.style.opacity = "0";
        modalBackdrop.style.opacity = "0";

        // 强制回流
        modalContent.offsetWidth;

        // 终态 — 卡片放大移至中央的连贯共享元素动画
        modal.style.opacity = "1";
        modalContent.style.transition =
          "transform 600ms cubic-bezier(0.22, 1, 0.36, 1), " +
          "opacity 200ms cubic-bezier(0.22, 1, 0.36, 1), " +
          "border-radius 500ms cubic-bezier(0.22, 1, 0.36, 1)";
        modalBackdrop.style.transition = "opacity 400ms cubic-bezier(0.22, 1, 0.36, 1)";
        modalBody.style.transition = "opacity 400ms cubic-bezier(0.22, 1, 0.36, 1) 200ms";

        modalContent.style.transform = "perspective(1000px) translate3d(0, 0, 0) scale(1) rotateX(0) rotateY(0)";
        modalContent.style.opacity = "1";
        modalContent.style.borderRadius = "20px";
        modalBody.style.opacity = "1";
        modalBackdrop.style.opacity = "1";

        const onEnd = (e) => {
          if (e.propertyName !== "transform") return;
          modalContent.removeEventListener("transitionend", onEnd);
          modalContent.style.transition = "";
          modalBody.style.transition = "";
          modalBackdrop.style.transition = "";
          isAnimating = false;
          // 动画结束后聚焦关闭按钮
          modalClose.focus();
        };
        modalContent.addEventListener("transitionend", onEnd);
      });
    });

    modal.classList.add("open");
    document.addEventListener("keydown", trapFocus);
  }

  function closeModal() {
    if (isAnimating) {
      // 如果正在进行开场动画，强制打断直接关闭
      doClose();
      return;
    }
    if (!originRect) {
      doClose();
      return;
    }
    isAnimating = true;

    document.removeEventListener("keydown", trapFocus);

    // 安全检查：来源位置是否在合理范围内
    const targetRect = modalContent.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const isReasonable =
      originRect.left > -200 &&
      originRect.left < vw + 200 &&
      originRect.top > -200 &&
      originRect.top < vh + 200;

    // 位置不合理时直接淡出，不做飞行动画
    if (!isReasonable) {
      modalContent.style.transition = "opacity 0.2s ease";
      modalContent.style.opacity = "0";
      modalBackdrop.style.transition = "opacity 0.2s ease";
      modalBackdrop.style.opacity = "0";
      setTimeout(doClose, 220);
      return;
    }

    const endX =
      originRect.left + originRect.width / 2 - (targetRect.left + targetRect.width / 2);
    const endY =
      originRect.top + originRect.height / 2 - (targetRect.top + targetRect.height / 2);
    const endScale = Math.min(Math.max(originRect.width / targetRect.width, 0.05), 1);

    // 内容先淡出
    modalBody.style.transition = "opacity 180ms cubic-bezier(0.4, 0, 1, 1)";
    modalBody.style.opacity = "0";

    requestAnimationFrame(() => {
      modalContent.style.transition =
        "transform 500ms cubic-bezier(0.22, 1, 0.36, 1), " +
        "opacity 300ms cubic-bezier(0.4, 0, 1, 1), " +
        "border-radius 300ms cubic-bezier(0.22, 1, 0.36, 1)";
      modalBackdrop.style.transition = "opacity 350ms cubic-bezier(0.4, 0, 1, 1)";

      modalContent.style.transform = `translate3d(${endX}px, ${endY}px, 0) scale(${endScale})`;
      modalContent.style.opacity = "0";
      modalContent.style.borderRadius = "16px";
      modalBackdrop.style.opacity = "0";
    });

    // 提前0.4s开始卡片淡入，与弹窗淡出交叉过渡
    setTimeout(() => {
      if (activeCard && activeCard.style.opacity === "0") {
        activeCard.style.transition = "opacity 400ms cubic-bezier(0.22, 1, 0.36, 1)";
        activeCard.style.opacity = "1";
        activeCard.style.pointerEvents = "";
      }
    }, 60);

    setTimeout(() => {
      doClose();
    }, 460);
  }

  function doClose() {
    modal.classList.remove("open");
    modal.style.display = "";
    modal.style.opacity = "";
    modal.setAttribute("aria-hidden", "true");
    modalContent.style.transition = "";
    modalContent.style.transform = "";
    modalContent.style.opacity = "";
    modalContent.style.borderRadius = "";
    modalBody.style.opacity = "";
    modalBody.style.transition = "";
    modalBackdrop.style.opacity = "";
    modalBackdrop.style.transition = "";
    document.body.style.overflow = "";
    document.body.style.paddingRight = "";
    originRect = null;
    isAnimating = false;

    // 恢复原卡片显示（平滑淡入）
    if (activeCard) {
      const cardRef = activeCard;
      // 边界情况：如果提前淡入未触发，立即开始
      if (cardRef.style.opacity === "0") {
        cardRef.style.transition = "opacity 400ms cubic-bezier(0.22, 1, 0.36, 1)";
        cardRef.style.opacity = "1";
      }
      cardRef.style.pointerEvents = "";
      setTimeout(() => {
        cardRef.style.transition = "";
        cardRef.style.opacity = "";
      }, 420);
      activeCard = null;
    }

    // 恢复焦点
    if (lastFocusedEl && lastFocusedEl.focus) {
      lastFocusedEl.focus();
    }
  }

  modalClose.addEventListener("click", closeModal);
  modalBackdrop.addEventListener("click", closeModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("open")) closeModal();
  });

  // ---------- 主题切换（浅色/深色）+ 水波纹动画 ----------
  const themeToggle = document.getElementById("theme-toggle");
  if (themeToggle) {
    const applyTheme = (theme) => {
      if (theme === "light") {
        document.documentElement.setAttribute("data-theme", "light");
        localStorage.setItem("theme", "light");
        document.querySelector('meta[name="theme-color"]').setAttribute("content", "#f5f5f7");
      } else {
        document.documentElement.removeAttribute("data-theme");
        localStorage.setItem("theme", "dark");
        document.querySelector('meta[name="theme-color"]').setAttribute("content", "#000000");
      }
    };

    themeToggle.addEventListener("click", () => {
      if (document.querySelector(".theme-ripple")) return;

      const current = document.documentElement.getAttribute("data-theme");
      const next = current === "light" ? "dark" : "light";
      const rippleColor = next === "light" ? "#f5f5f7" : "#000000";

      // 无障碍：减少动效时直接切换
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        applyTheme(next);
        return;
      }

      // 计算按钮中心坐标
      const rect = themeToggle.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      // 计算覆盖视口的最大半径
      const maxR = Math.hypot(
        Math.max(cx, window.innerWidth - cx),
        Math.max(cy, window.innerHeight - cy)
      );

      // 创建水波纹覆盖层
      const overlay = document.createElement("div");
      overlay.className = "theme-ripple";
      overlay.style.background = rippleColor;
      overlay.style.setProperty("--cx", cx + "px");
      overlay.style.setProperty("--cy", cy + "px");
      document.body.appendChild(overlay);

      // 强制回流后启动扩展动画
      overlay.offsetHeight;
      overlay.style.clipPath = `circle(${maxR}px at ${cx}px ${cy}px)`;

      // 扩展完成：切换主题 + 淡出
      overlay.addEventListener("transitionend", function onExpand(e) {
        if (e.propertyName !== "clip-path") return;
        overlay.removeEventListener("transitionend", onExpand);

        applyTheme(next);
        overlay.style.opacity = "0";

        overlay.addEventListener("transitionend", function onFade(e) {
          if (e.propertyName !== "opacity") return;
          overlay.removeEventListener("transitionend", onFade);
          overlay.remove();
        });
      });
    });
  }

  // ---------- 平滑滚动（导航点击时优化偏移） ----------
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const targetId = link.getAttribute("href");
      if (targetId === "#" || targetId.length < 2) return;
      const target = document.querySelector(targetId);
      if (!target) return;
      // 原生 smooth scroll 已由 html 控制，这里不用额外处理
    });
  });

  // ---------- 初始化 ----------
  scrollY = window.pageYOffset;
  updateParallax();
  updateNavbar();
})();
