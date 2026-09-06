const root = document.documentElement;

// Image annotations: px coords (relative to natural size) → % so notes track
// image bounds at any rendered width. Percent is size-invariant → compute once.
document.querySelectorAll(".img-annotated").forEach((fig) => {
  const img = fig.querySelector("img");
  if (!img) return;
  const place = () => {
    if (!img.naturalWidth || fig.dataset.annotated) return;
    fig.dataset.annotated = "1";
    fig.querySelectorAll(".img-note").forEach((n) => {
      n.style.left = (parseFloat(n.style.left) / img.naturalWidth) * 100 + "%";
      n.style.top = (parseFloat(n.style.top) / img.naturalHeight) * 100 + "%";
    });
  };
  if (img.complete) place();
  else img.addEventListener("load", place, { once: true });
});

// Written dates → reader's local time
document.querySelectorAll("time[datetime]").forEach((t) => {
  const d = new Date(t.getAttribute("datetime"));
  if (!isNaN(d.getTime()))
    t.textContent = d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
});

document.getElementById("theme-toggle")?.addEventListener("click", (e) => {
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  const apply = () => {
    root.dataset.theme = next;
    localStorage.setItem("theme", next);
  };
  if (!document.startViewTransition) {
    apply();
    return;
  }
  // Circle cutout expanding from the button
  const rect = e.currentTarget.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  const vt = document.startViewTransition(apply);
  vt.ready.then(() => {
    document.documentElement.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
      { duration: 450, easing: "ease-in-out", pseudoElement: "::view-transition-new(root)" }
    );
  });
});

// Tooltip bounds-aware placement: reset to above-center, then clamp/flip
function positionTip(note) {
  const tip = note.querySelector(".img-tip");
  if (!tip) return;
  tip.style.left = "50%";
  tip.style.right = "auto";
  tip.style.top = "auto";
  tip.style.bottom = "18px";
  tip.style.transform = "translateX(-50%)";
  const MARGIN = 8;
  const r = tip.getBoundingClientRect();
  if (r.left < MARGIN) {
    tip.style.left = "0";
    tip.style.transform = "translateX(0)";
  } else if (r.right > innerWidth - MARGIN) {
    tip.style.left = "auto";
    tip.style.right = "0";
    tip.style.transform = "none";
  }
  if (r.top < MARGIN) {
    tip.style.bottom = "auto";
    tip.style.top = "18px";
  }
}

document.addEventListener("mouseover", (e) => {
  const note = e.target instanceof Element && e.target.closest(".img-note");
  if (note) positionTip(note);
});
document.addEventListener("focusin", (e) => {
  const note = e.target instanceof Element && e.target.closest(".img-note");
  if (note) positionTip(note);
});

document.addEventListener("click", (e) => {
  const target = e.target;
  if (!(target instanceof Element)) return;
  const opener = target.closest(".term");
  if (opener) {
    const id = "term-" + opener.getAttribute("data-term");
    document.getElementById(id)?.showModal();
    return;
  }
  const closer = target.closest(".term-close");
  if (closer) {
    const id = "term-" + closer.getAttribute("data-close");
    document.getElementById(id)?.close();
    return;
  }
  if (target instanceof HTMLDialogElement) target.close(); // backdrop click
});
