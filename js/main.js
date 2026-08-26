// 主入口：视差滚动 · 导航效果 · 入场动画 · 作品集渲染 · 弹窗 · 卡片光晕 · 无障碍
(function () {
  "use strict";

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

  // ---------- 卡片鼠标光晕追踪（rAF 节流） ----------
  const glowCards = document.querySelectorAll(".card, .grant-card");
  glowCards.forEach((card) => {
    let rafId = null;
    let targetX = 50, targetY = 50;

    const updateGlow = () => {
      card.style.setProperty("--mouse-x", targetX + "%");
      card.style.setProperty("--mouse-y", targetY + "%");
      rafId = null;
    };

    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      targetX = ((e.clientX - rect.left) / rect.width) * 100;
      targetY = ((e.clientY - rect.top) / rect.height) * 100;
      if (!rafId) rafId = requestAnimationFrame(updateGlow);
    });
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

  worksData.forEach((w, i) => {
    const card = document.createElement("div");
    card.className = "work-card fade-in";
    card.setAttribute("role", "listitem");
    card.setAttribute("tabindex", "0");
    card.setAttribute("aria-label", `查看作品：${w.title}`);
    card.style.transitionDelay = (i % 3) * 70 + Math.floor(i / 3) * 35 + "ms";
    card.innerHTML = `
      <div class="work-thumb">
        <img src="${w.image}" alt="${w.title}" loading="lazy" decoding="async" />
      </div>
      <div class="work-body">
        <h3>${w.title}</h3>
        <p class="work-date">${w.date}</p>
        <p class="work-desc">${w.desc}</p>
        <span class="work-tag">${w.tag}</span>
      </div>
    `;

    // 3D 悬浮倾斜效果（优化版：缓存尺寸 + lerp 平滑 + 防抖动）
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
      activeCard = card;
      // 禁用交互但保持可见，让动画连贯
      card.style.pointerEvents = "none";
      // 停止3D动画循环，但保留当前transform状态
      isHovering = false;
      if (rafId3d) {
        cancelAnimationFrame(rafId3d);
        rafId3d = null;
      }
      // 0.3s 后卡片逐渐消失
      card.style.transition = "opacity 400ms cubic-bezier(0.22, 1, 0.36, 1)";
      setTimeout(() => {
        if (activeCard === card) {
          card.style.opacity = "0";
        }
      }, 300);
      openModal(w, rect, currentX, currentY);
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
        <img src="${work.image}" alt="${work.title}" />
      </div>
      <h2 id="modal-title">${work.title}</h2>
      <p class="modal-date">${work.date} · ${work.tag}</p>
      <p class="modal-desc">${work.desc}</p>
      ${work.link
        ? `<a href="${work.link}" target="_blank" rel="noopener" class="modal-btn">查看链接 →</a>`
        : `<span style="color:var(--text-tertiary);font-size:12px">暂无链接</span>`}
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

        modalContent.style.transform = `translate3d(${startX}px, ${startY}px, 0) scale(${startScale}) perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
        modalContent.style.opacity = "0";
        modalContent.style.borderRadius = "12px";
        modalBody.style.opacity = "0";
        modalBackdrop.style.opacity = "0";

        // 强制回流
        modalContent.offsetWidth;

        // 终态 — 连贯流畅的共享元素动画
        modal.style.opacity = "1";
        modalContent.style.transition =
          "transform 700ms cubic-bezier(0.34, 1.56, 0.64, 1), " +
          "opacity 250ms cubic-bezier(0.16, 1, 0.3, 1), " +
          "border-radius 500ms cubic-bezier(0.22, 1, 0.36, 1)";
        modalBackdrop.style.transition = "opacity 400ms cubic-bezier(0.22, 1, 0.36, 1)";
        modalBody.style.transition = "opacity 400ms cubic-bezier(0.22, 1, 0.36, 1) 200ms";

        modalContent.style.transform = "translate3d(0, 0, 0) scale(1) perspective(1000px) rotateX(0) rotateY(0)";
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

    // 先显示原卡片，让飞回动画连贯
    if (activeCard) {
      activeCard.style.opacity = "";
    }

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
        "transform 500ms cubic-bezier(0.4, 0, 0.2, 1), " +
        "opacity 300ms cubic-bezier(0.4, 0, 1, 1), " +
        "border-radius 300ms ease";
      modalBackdrop.style.transition = "opacity 350ms cubic-bezier(0.4, 0, 1, 1)";

      modalContent.style.transform = `translate3d(${endX}px, ${endY}px, 0) scale(${endScale})`;
      modalContent.style.opacity = "0";
      modalContent.style.borderRadius = "12px";
      modalBackdrop.style.opacity = "0";
    });

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

    // 恢复原卡片显示
    if (activeCard) {
      activeCard.style.opacity = "";
      activeCard.style.pointerEvents = "";
      activeCard.style.transition = "";
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
