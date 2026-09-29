(() => {
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const mobile = matchMedia("(max-width: 899px)");
  const header = document.querySelector(".site-header");
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".site-nav");
  const links = [...nav.querySelectorAll('a[href^="#"]')];
  const sections = links.map((link) => document.querySelector(link.hash));
  const progress = document.querySelector(".reading-progress");
  let scheduled = false;

  document.documentElement.classList.add("js-nav");
  toggle.hidden = false;

  function setMenu(open, returnFocus = false) {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute(
      "aria-label",
      open ? "Close navigation" : "Open navigation",
    );
    nav.classList.toggle("is-open", open);
    if (returnFocus) toggle.focus();
  }

  toggle.addEventListener("click", () =>
    setMenu(toggle.getAttribute("aria-expanded") !== "true"),
  );
  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      toggle.getAttribute("aria-expanded") === "true"
    )
      setMenu(false, true);
  });
  document.addEventListener("click", (event) => {
    if (!header.contains(event.target)) setMenu(false);
  });
  header.addEventListener("focusout", (event) => {
    if (event.relatedTarget && !header.contains(event.relatedTarget))
      setMenu(false);
  });
  mobile.addEventListener("change", () => setMenu(false));

  links.forEach((link) =>
    link.addEventListener("click", () => {
      const target = document.querySelector(link.hash);
      if (mobile.matches && target) {
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
        target.addEventListener(
          "blur",
          () => target.removeAttribute("tabindex"),
          { once: true },
        );
      }
      setMenu(false);
    }),
  );

  function updatePosition() {
    scheduled = false;
    const maxScroll = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform =
      "scaleX(" +
      (maxScroll > 0 ? Math.max(0, Math.min(1, scrollY / maxScroll)) : 0) +
      ")";
    let active = 0;
    sections.forEach((section, index) => {
      if (
        section &&
        section.getBoundingClientRect().top <= header.offsetHeight + 100
      )
        active = index;
    });
    if (maxScroll > 0 && scrollY >= maxScroll - 5) active = sections.length - 1;
    links.forEach((link, index) => {
      if (index === active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }

  function schedulePosition() {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(updatePosition);
    }
  }
  addEventListener("scroll", schedulePosition, { passive: true });
  addEventListener("resize", schedulePosition, { passive: true });
  document.addEventListener("toggle", schedulePosition, true);
  updatePosition();

  if ("IntersectionObserver" in window && !motion.matches) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    document
      .querySelectorAll(".reveal")
      .forEach((element) => observer.observe(element));
    motion.addEventListener("change", () => {
      if (motion.matches) observer.disconnect();
    });
  }

  // Legacy anchors may target content now inside progressive disclosure.
  function revealHashTarget() {
    let target;
    try {
      target = document.getElementById(
        decodeURIComponent(location.hash.slice(1)),
      );
    } catch {
      return;
    }
    if (!target) return;
    let ancestor = target.parentElement;
    let opened = false;
    while (ancestor) {
      if (ancestor instanceof HTMLDetailsElement && !ancestor.open) {
        ancestor.open = true;
        opened = true;
      }
      ancestor = ancestor.parentElement;
    }
    if (opened) requestAnimationFrame(() => target.scrollIntoView());
  }
  addEventListener("hashchange", revealHashTarget);
  revealHashTarget();
})();
