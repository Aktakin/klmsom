/* ==========================================================================
   KLM Online School of Ministry — main.js
   Progressive enhancement only: every page remains usable without this file.
   ========================================================================== */

(function () {
  "use strict";

  document.documentElement.classList.remove("no-js");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ----------------------------------------------------------------------
     Mobile navigation
     ---------------------------------------------------------------------- */
  function initNav() {
    var burger = document.querySelector("[data-burger]");
    var nav = document.querySelector("[data-nav]");
    if (!burger || !nav) return;

    function setOpen(open) {
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute("aria-label", open ? "Close main menu" : "Open main menu");
      nav.classList.toggle("is-open", open);
      document.body.classList.toggle("nav-open", open);
    }

    burger.addEventListener("click", function () {
      setOpen(burger.getAttribute("aria-expanded") !== "true");
    });

    nav.addEventListener("click", function (e) {
      if (e.target.closest("a") && window.innerWidth <= 820) setOpen(false);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && burger.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        burger.focus();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 820) setOpen(false);
    });
  }

  /* ----------------------------------------------------------------------
     Sticky masthead state
     ---------------------------------------------------------------------- */
  function initStickyHeader() {
    var masthead = document.querySelector("[data-masthead]");
    if (!masthead) return;
    var ticking = false;

    function update() {
      masthead.classList.toggle("is-stuck", window.scrollY > 40);
      ticking = false;
    }

    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          ticking = true;
          window.requestAnimationFrame(update);
        }
      },
      { passive: true }
    );
    update();
  }

  /* ----------------------------------------------------------------------
     Back to top
     ---------------------------------------------------------------------- */
  function initToTop() {
    var btn = document.querySelector("[data-totop]");
    if (!btn) return;

    window.addEventListener(
      "scroll",
      function () {
        btn.classList.toggle("is-visible", window.scrollY > 700);
      },
      { passive: true }
    );

    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  /* ----------------------------------------------------------------------
     Scroll reveal
     ---------------------------------------------------------------------- */
  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) {
        el.classList.add("is-in");
      });
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          var delay = parseInt(el.getAttribute("data-reveal-delay") || "0", 10);
          window.setTimeout(function () {
            el.classList.add("is-in");
          }, delay);
          io.unobserve(el);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    items.forEach(function (el) {
      io.observe(el);
    });
  }

  /* ----------------------------------------------------------------------
     Countdown to a dated milestone. Dormant unless a page supplies a date.
     ---------------------------------------------------------------------- */
  function initCountdown() {
    var root = document.querySelector("[data-countdown]");
    if (!root) return;

    var target = new Date(root.getAttribute("data-countdown"));
    if (isNaN(target.getTime())) return;

    var cells = {
      days: root.querySelector('[data-unit="days"]'),
      hours: root.querySelector('[data-unit="hours"]'),
      minutes: root.querySelector('[data-unit="minutes"]'),
      seconds: root.querySelector('[data-unit="seconds"]')
    };

    function pad(n) {
      return n < 10 ? "0" + n : String(n);
    }

    function tick() {
      var diff = target.getTime() - Date.now();
      if (diff <= 0) {
        Object.keys(cells).forEach(function (k) {
          if (cells[k]) cells[k].textContent = "00";
        });
        var note = root.querySelector("[data-countdown-note]");
        if (note) note.textContent = "Classes are now in session.";
        window.clearInterval(timer);
        return;
      }
      var s = Math.floor(diff / 1000);
      if (cells.days) cells.days.textContent = pad(Math.floor(s / 86400));
      if (cells.hours) cells.hours.textContent = pad(Math.floor((s % 86400) / 3600));
      if (cells.minutes) cells.minutes.textContent = pad(Math.floor((s % 3600) / 60));
      if (cells.seconds) cells.seconds.textContent = pad(s % 60);
    }

    tick();
    var timer = window.setInterval(tick, 1000);
  }

  /* ----------------------------------------------------------------------
     Accordions
     ---------------------------------------------------------------------- */
  function initAccordions() {
    document.querySelectorAll("[data-accordion]").forEach(function (group) {
      var single = group.getAttribute("data-accordion") === "single";
      var triggers = group.querySelectorAll(".accordion__trigger");

      function close(trigger) {
        var panel = document.getElementById(trigger.getAttribute("aria-controls"));
        trigger.setAttribute("aria-expanded", "false");
        if (panel) panel.style.maxHeight = "0px";
      }

      function open(trigger) {
        var panel = document.getElementById(trigger.getAttribute("aria-controls"));
        trigger.setAttribute("aria-expanded", "true");
        if (panel) panel.style.maxHeight = panel.scrollHeight + "px";
      }

      triggers.forEach(function (trigger) {
        close(trigger);
        trigger.addEventListener("click", function () {
          var isOpen = trigger.getAttribute("aria-expanded") === "true";
          if (single) {
            triggers.forEach(function (t) {
              if (t !== trigger) close(t);
            });
          }
          isOpen ? close(trigger) : open(trigger);
        });
      });

      window.addEventListener("resize", function () {
        triggers.forEach(function (trigger) {
          if (trigger.getAttribute("aria-expanded") === "true") open(trigger);
        });
      });
    });

    // Deep link support: /page#faq-id opens that item.
    if (window.location.hash) {
      var hit = document.querySelector(
        '.accordion__trigger[aria-controls="' + window.location.hash.slice(1) + '"]'
      );
      if (hit) hit.click();
    }
  }

  /* ----------------------------------------------------------------------
     Tabs
     ---------------------------------------------------------------------- */
  function initTabs() {
    document.querySelectorAll("[data-tabs]").forEach(function (root) {
      var tabs = Array.prototype.slice.call(root.querySelectorAll('[role="tab"]'));
      if (!tabs.length) return;

      function select(index, focus) {
        tabs.forEach(function (tab, i) {
          var selected = i === index;
          tab.setAttribute("aria-selected", String(selected));
          tab.setAttribute("tabindex", selected ? "0" : "-1");
          var panel = document.getElementById(tab.getAttribute("aria-controls"));
          if (panel) panel.hidden = !selected;
        });
        if (focus) tabs[index].focus();
      }

      tabs.forEach(function (tab, i) {
        tab.addEventListener("click", function () {
          select(i);
        });
        tab.addEventListener("keydown", function (e) {
          var next = null;
          if (e.key === "ArrowRight") next = (i + 1) % tabs.length;
          if (e.key === "ArrowLeft") next = (i - 1 + tabs.length) % tabs.length;
          if (e.key === "Home") next = 0;
          if (e.key === "End") next = tabs.length - 1;
          if (next === null) return;
          e.preventDefault();
          select(next, true);
        });
      });

      select(0);
    });
  }

  /* ----------------------------------------------------------------------
     Forms — validation, draft saving, reference generation
     ---------------------------------------------------------------------- */
  function fieldError(input, message) {
    var wrap = input.closest(".field") || input.closest("fieldset");
    var slot = wrap ? wrap.querySelector(".field__error") : null;
    if (message) {
      input.setAttribute("aria-invalid", "true");
      if (slot) slot.textContent = message;
    } else {
      input.removeAttribute("aria-invalid");
      if (slot) slot.textContent = "";
    }
  }

  function validate(input) {
    var value = (input.value || "").trim();
    var label = input.getAttribute("data-label") || "This field";

    if (input.required && !value) {
      fieldError(input, label + " is required.");
      return false;
    }
    if (input.type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      fieldError(input, "Enter a valid email address, e.g. name@example.com.");
      return false;
    }
    if (input.type === "tel" && value && !/^[+()\d\s-]{7,22}$/.test(value)) {
      fieldError(input, "Enter a valid telephone number, including country code.");
      return false;
    }
    fieldError(input, "");
    return true;
  }

  function reference(prefix) {
    var stamp = Date.now().toString(36).toUpperCase().slice(-5);
    var rand = Math.floor(Math.random() * 1296)
      .toString(36)
      .toUpperCase();
    return prefix + "-" + new Date().getFullYear() + "-" + stamp + rand.padStart(2, "0");
  }

  function initForms() {
    document.querySelectorAll("form[data-form]").forEach(function (form) {
      var kind = form.getAttribute("data-form");
      var status = form.querySelector("[data-status]");
      var storeKey = "klmsom:" + kind;
      var fields = Array.prototype.slice.call(
        form.querySelectorAll("input, select, textarea")
      ).filter(function (el) {
        return el.type !== "submit" && el.type !== "hidden";
      });

      // Restore a saved draft of the long application form.
      if (form.hasAttribute("data-persist")) {
        try {
          var saved = JSON.parse(window.localStorage.getItem(storeKey) || "{}");
          fields.forEach(function (el) {
            if (!el.name || !(el.name in saved)) return;
            if (el.type === "checkbox" || el.type === "radio") {
              el.checked = Array.isArray(saved[el.name])
                ? saved[el.name].indexOf(el.value) > -1
                : saved[el.name] === el.value;
            } else {
              el.value = saved[el.name];
            }
          });
        } catch (err) {
          /* ignore malformed drafts */
        }

        var saveTimer;
        form.addEventListener("input", function () {
          window.clearTimeout(saveTimer);
          saveTimer = window.setTimeout(function () {
            var data = {};
            fields.forEach(function (el) {
              if (!el.name) return;
              if (el.type === "checkbox") {
                if (!Array.isArray(data[el.name])) data[el.name] = [];
                if (el.checked) data[el.name].push(el.value);
              } else if (el.type === "radio") {
                if (el.checked) data[el.name] = el.value;
              } else {
                data[el.name] = el.value;
              }
            });
            try {
              window.localStorage.setItem(storeKey, JSON.stringify(data));
            } catch (err) {
              /* storage unavailable — drafts simply will not persist */
            }
            var hint = form.querySelector("[data-draft-hint]");
            if (hint) {
              hint.textContent =
                "Draft saved on this device at " +
                new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) +
                ".";
            }
          }, 500);
        });
      }

      fields.forEach(function (el) {
        el.addEventListener("blur", function () {
          if (el.value || el.required) validate(el);
        });
        el.addEventListener("input", function () {
          if (el.getAttribute("aria-invalid") === "true") validate(el);
        });
      });

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var firstBad = null;
        fields.forEach(function (el) {
          if (!validate(el) && !firstBad) firstBad = el;
        });

        var consent = form.querySelector("[data-consent]");
        if (consent && !consent.checked) {
          fieldError(consent, "Please confirm the declaration before submitting.");
          if (!firstBad) firstBad = consent;
        } else if (consent) {
          fieldError(consent, "");
        }

        if (firstBad) {
          if (status) {
            status.hidden = false;
            status.className = "form__status form__status--error";
            status.innerHTML =
              "<strong>Please review your entries</strong>One or more required fields still need attention. The first is highlighted below.";
          }
          firstBad.focus();
          return;
        }

        if (status) {
          status.hidden = false;
          status.className = "form__status form__status--ok";
          if (kind === "application") {
            var ref = reference("KLMSOM");
            status.innerHTML =
              "<strong>Application received</strong>Thank you. Your application reference is " +
              '<span class="form__ref">' +
              ref +
              "</span>. Please keep this reference safe and quote it in any correspondence. " +
              "For enquiries, call or message +234 802 322 0455.";
            try {
              window.localStorage.removeItem(storeKey);
            } catch (err) {
              /* nothing to clear */
            }
          } else if (kind === "alumni") {
            status.innerHTML =
              "<strong>Thank you</strong>Your details have been submitted. " +
              "For enquiries, call or message +234 802 322 0455.";
          } else if (kind === "testimony") {
            status.innerHTML =
              "<strong>Testimony submitted</strong>Thank you for sharing what God has done.";
          } else {
            status.innerHTML =
              "<strong>Message sent</strong>Thank you for contacting the School of Ministry. " +
              "For enquiries, call or message +234 802 322 0455.";
          }
        }

        form.reset();
        fields.forEach(function (el) {
          fieldError(el, "");
        });
        var hintEl = form.querySelector("[data-draft-hint]");
        if (hintEl) hintEl.textContent = "";
        if (status) status.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
      });
    });
  }

  /* ----------------------------------------------------------------------
     Filter chips (news page)
     ---------------------------------------------------------------------- */
  function initFilters() {
    var root = document.querySelector("[data-filter-root]");
    if (!root) return;
    var buttons = root.querySelectorAll("[data-filter]");
    var items = root.querySelectorAll("[data-category]");

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var want = btn.getAttribute("data-filter");
        buttons.forEach(function (b) {
          b.setAttribute("aria-selected", String(b === btn));
        });
        var shown = 0;
        items.forEach(function (item) {
          var match = want === "all" || item.getAttribute("data-category") === want;
          item.hidden = !match;
          if (match) shown++;
        });
        var empty = root.querySelector("[data-filter-empty]");
        if (empty) empty.hidden = shown > 0;
      });
    });
  }

  /* ----------------------------------------------------------------------
     Boot
     ---------------------------------------------------------------------- */
  function boot() {
    initNav();
    initStickyHeader();
    initToTop();
    initReveal();
    initCountdown();
    initAccordions();
    initTabs();
    initForms();
    initFilters();

    var year = document.querySelectorAll("[data-year]");
    year.forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
