const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const progress = document.querySelector(".scroll-progress");
const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");
const navLinks = Array.from(document.querySelectorAll(".site-nav a"));
const revealItems = Array.from(document.querySelectorAll(".reveal"));
const countItems = Array.from(document.querySelectorAll("[data-count]"));

function updateProgress() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const percent = max > 0 ? (scrollTop / max) * 100 : 0;
  if (progress) progress.style.width = `${Math.min(100, Math.max(0, percent))}%`;
}

function setActiveNav() {
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);
  let activeId = "";

  for (const section of sections) {
    const rect = section.getBoundingClientRect();
    if (rect.top <= 120 && rect.bottom >= 120) {
      activeId = `#${section.id}`;
      break;
    }
  }

  navLinks.forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === activeId);
  });
}

navToggle?.addEventListener("click", () => {
  const expanded = navToggle.getAttribute("aria-expanded") === "true";
  navToggle.setAttribute("aria-expanded", String(!expanded));
  siteNav?.classList.toggle("is-open", !expanded);
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    navToggle?.setAttribute("aria-expanded", "false");
    siteNav?.classList.remove("is-open");
  });
});

if (prefersReducedMotion.matches) {
  revealItems.forEach((item) => item.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14 }
  );
  revealItems.forEach((item) => revealObserver.observe(item));
}

function formatCount(value, suffix) {
  return `${Math.round(value).toLocaleString()}${suffix || ""}`;
}

function animateCount(element) {
  const target = Number(element.dataset.count || "0");
  const suffix = element.dataset.suffix || "";
  if (!target || prefersReducedMotion.matches) {
    element.textContent = formatCount(target, suffix);
    return;
  }

  const start = performance.now();
  const duration = 900;

  function tick(now) {
    const progressValue = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - progressValue, 3);
    element.textContent = formatCount(target * eased, suffix);
    if (progressValue < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

const countObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        countObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.6 }
);
countItems.forEach((item) => countObserver.observe(item));

const canvas = document.getElementById("ambientParticles");
const ctx = canvas?.getContext("2d");
let particles = [];
let particleFrame = 0;
let particlesActive = false;
let heroVisible = true;

function resizeCanvas() {
  if (!canvas || !ctx) return;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(window.innerWidth * ratio);
  canvas.height = Math.floor(window.innerHeight * ratio);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function createParticles() {
  const count = Math.min(36, Math.max(18, Math.floor(window.innerWidth / 48)));
  particles = Array.from({ length: count }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    radius: Math.random() * 1.8 + 0.4,
    speed: Math.random() * 0.22 + 0.08,
    alpha: Math.random() * 0.42 + 0.16
  }));
}

function drawParticles() {
  if (!canvas || !ctx || !particlesActive || prefersReducedMotion.matches || document.hidden || !heroVisible) {
    particleFrame = 0;
    return;
  }

  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  particles.forEach((particle) => {
    particle.y -= particle.speed;
    if (particle.y < -10) {
      particle.y = window.innerHeight + 10;
      particle.x = Math.random() * window.innerWidth;
    }
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(119, 217, 255, ${particle.alpha})`;
    ctx.fill();
  });

  particleFrame = requestAnimationFrame(drawParticles);
}

function startParticles() {
  if (!canvas || !ctx || prefersReducedMotion.matches || particlesActive) return;
  particlesActive = true;
  drawParticles();
}

function stopParticles() {
  particlesActive = false;
  if (particleFrame) cancelAnimationFrame(particleFrame);
  particleFrame = 0;
  ctx?.clearRect(0, 0, window.innerWidth, window.innerHeight);
}

if (canvas && ctx && !prefersReducedMotion.matches) {
  resizeCanvas();
  createParticles();
  startParticles();

  const hero = document.querySelector(".hero");
  if (hero) {
    const particleObserver = new IntersectionObserver(
      (entries) => {
        heroVisible = entries.some((entry) => entry.isIntersecting);
        if (heroVisible) startParticles();
        else stopParticles();
      },
      { threshold: 0.08 }
    );
    particleObserver.observe(hero);
  }

  window.addEventListener("resize", () => {
    resizeCanvas();
    createParticles();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopParticles();
    else startParticles();
  });
}

prefersReducedMotion.addEventListener("change", () => {
  if (prefersReducedMotion.matches) stopParticles();
  revealItems.forEach((item) => item.classList.add("is-visible"));
});

window.addEventListener("scroll", () => {
  updateProgress();
  setActiveNav();
}, { passive: true });

updateProgress();
setActiveNav();
