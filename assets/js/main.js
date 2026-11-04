/* Studio Tirso — demo Mockly. JavaScript senza librerie. */
(function () {
  "use strict";

  var WA = "https://wa.me/393517578080";
  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var MONTHS = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
  var MONTHS_SHORT = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];
  var DAYS = ["dom", "lun", "mar", "mer", "gio", "ven", "sab"];

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function today() { var d = new Date(); d.setHours(0, 0, 0, 0); return d; }

  /* ---------- Scadenze fiscali (calendario indicativo) ----------
     Date generali e ricorrenti. Sabato e domenica slittano al lunedì;
     il 16 agosto slitta al 20. I festivi non sono calcolati. */
  var FIXED = [
    { m: 2, d: 16, what: "Saldo IVA dell'anno prima", who: "Partita IVA" },
    { m: 2, d: 16, what: "CU all'Agenzia delle Entrate", who: "Chi ha dipendenti o collaboratori" },
    { m: 3, d: 30, what: "Dichiarazione IVA annuale", who: "Partita IVA" },
    { m: 5, d: 16, what: "IMU, acconto", who: "Proprietari di seconde case e immobili" },
    { m: 5, d: 30, what: "Saldo e primo acconto delle imposte", who: "Chi presenta il modello Redditi" },
    { m: 8, d: 30, what: "Invio del 730", who: "Dipendenti e pensionati" },
    { m: 9, d: 31, what: "Modello Redditi e 770", who: "Partita IVA, sostituti d'imposta" },
    { m: 10, d: 30, what: "Secondo acconto delle imposte", who: "Chi ha pagato il primo acconto" },
    { m: 11, d: 16, what: "IMU, saldo", who: "Proprietari di seconde case e immobili" },
    { m: 11, d: 27, what: "Acconto IVA", who: "Partita IVA in regime ordinario" }
  ];
  var COLF = [0, 3, 6, 9]; // contributi colf: 10 gennaio, aprile, luglio, ottobre

  function shift(date) {
    var d = new Date(date);
    if (d.getMonth() === 7 && d.getDate() === 16) d.setDate(20);
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
    return d;
  }
  function deadlinesOf(year, month) {
    var list = [];
    list.push({ date: shift(new Date(year, month, 16)), what: "F24 del mese", who: "Ritenute dei dipendenti, IVA mensile" });
    if (COLF.indexOf(month) > -1) list.push({ date: shift(new Date(year, month, 10)), what: "Contributi della colf o badante", who: "Famiglie con lavoro domestico" });
    FIXED.forEach(function (f) {
      if (f.m === month) list.push({ date: shift(new Date(year, month, f.d)), what: f.what, who: f.who });
    });
    list.sort(function (a, b) { return a.date - b.date; });
    return list;
  }
  function nextDeadline() {
    var t = today();
    for (var i = 0; i < 14; i++) {
      var y = t.getFullYear() + Math.floor((t.getMonth() + i) / 12);
      var m = (t.getMonth() + i) % 12;
      var found = deadlinesOf(y, m).filter(function (x) { return x.date >= t; });
      if (found.length) return found[0];
    }
    return null;
  }
  function fmt(d) { return DAYS[d.getDay()] + " " + d.getDate() + " " + MONTHS[d.getMonth()]; }

  /* ---------- Prima schermata: la prossima scadenza ---------- */
  function initDeadline() {
    var box = $("[data-deadline]");
    if (!box) return;
    var n = nextDeadline();
    if (!n) return;
    var days = Math.round((n.date - today()) / 86400000);
    $("[data-deadline-what]", box).textContent = n.what;
    $("[data-deadline-date]", box).textContent = fmt(n.date) + " " + n.date.getFullYear();
    $("[data-deadline-unit]", box).textContent = days === 0 ? "è oggi" : days === 1 ? "giorno" : "giorni";
    var num = $("[data-deadline-n]", box);
    box.setAttribute("aria-label", "Prossima scadenza: " + n.what + ", " + fmt(n.date) + (days === 0 ? ", oggi" : ", fra " + days + (days === 1 ? " giorno" : " giorni")) + ". Apri il calendario");
    if (reduce || days === 0) { num.textContent = days === 0 ? "0" : String(days); return; }
    // Il numero scorre fino al valore, come un contatore meccanico
    var start = null, from = Math.max(days + 30, 40);
    num.classList.add("is-counting");
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / 900, 1);
      var e = 1 - Math.pow(1 - p, 3);
      num.textContent = String(Math.round(from + (days - from) * e));
      if (p < 1) requestAnimationFrame(step); else num.classList.remove("is-counting");
    }
    setTimeout(function () { requestAnimationFrame(step); }, 350);
    setTimeout(function () { num.textContent = String(days); num.classList.remove("is-counting"); }, 1600);
  }

  /* ---------- Calendario da toccare ---------- */
  function initCalendar() {
    var cal = $("[data-cal]");
    if (!cal) return;
    var t = today();
    var year = t.getFullYear();
    var grid = $("[data-cal-months]", cal);
    var list = $("[data-cal-list]", cal);
    var title = $("[data-cal-title]", cal);
    var count = $("[data-cal-count]", cal);
    var buttons = [];

    for (var m = 0; m < 12; m++) {
      var items = deadlinesOf(year, m);
      var b = document.createElement("button");
      b.type = "button";
      b.className = "cal__month";
      b.setAttribute("aria-pressed", "false");
      b.setAttribute("aria-label", MONTHS[m] + ": " + items.length + " scadenze");
      b.dataset.month = m;
      if (m < t.getMonth()) b.classList.add("is-past");
      if (m === t.getMonth()) b.classList.add("is-now");
      var dots = items.map(function () { return "<i></i>"; }).join("");
      b.innerHTML = '<span class="cal__name">' + MONTHS_SHORT[m] + '</span><span class="cal__dots" aria-hidden="true">' + dots + "</span>";
      grid.appendChild(b);
      buttons.push(b);
    }

    function show(m, animate) {
      buttons.forEach(function (b) { b.setAttribute("aria-pressed", String(+b.dataset.month === m)); });
      var items = deadlinesOf(year, m);
      function render() {
        title.textContent = MONTHS[m].charAt(0).toUpperCase() + MONTHS[m].slice(1) + " " + year;
        count.textContent = items.length + (items.length === 1 ? " scadenza" : " scadenze");
        list.innerHTML = items.map(function (x, i) {
          var done = x.date < t;
          var btn = done ? "" : '<button class="cal__remind" type="button" data-remind="' + i + '" aria-label="Ricordamelo: ' + x.what + ", " + fmt(x.date) + '">' +
            '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="3" y="4" width="14" height="13" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M3 8h14M7 2v4M13 2v4" stroke="currentColor" stroke-width="1.5"/></svg>Ricordamelo</button>';
          return '<li class="' + (done ? "is-done" : "") + '"><span class="cal__day">' + x.date.getDate() +
            "<small>" + DAYS[x.date.getDay()] + (done ? " · passata" : "") + '</small></span><span><span class="cal__what">' + x.what +
            '</span><br><span class="cal__who">' + x.who + "</span>" + btn + "</span></li>";
        }).join("");
        current = items;
      }
      if (!animate || reduce) { render(); return; }
      list.classList.add("is-swapping");
      setTimeout(function () { render(); list.classList.remove("is-swapping"); }, 150);
    }

    // "Ricordamelo": un file di calendario con promemoria tre giorni prima
    var current = [];
    function pad(n) { return String(n).padStart(2, "0"); }
    function ymd(d) { return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()); }
    list.addEventListener("click", function (e) {
      var b = e.target.closest("[data-remind]");
      if (!b) return;
      var x = current[+b.dataset.remind];
      var next = new Date(x.date); next.setDate(next.getDate() + 1);
      var now = new Date();
      var stamp = now.getUTCFullYear() + pad(now.getUTCMonth() + 1) + pad(now.getUTCDate()) + "T" + pad(now.getUTCHours()) + pad(now.getUTCMinutes()) + "00Z";
      var ics = [
        "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Mockly//Demo Studio Tirso//IT", "CALSCALE:GREGORIAN",
        "BEGIN:VEVENT", "UID:" + ymd(x.date) + "-" + b.dataset.remind + "@studio-tirso.demo", "DTSTAMP:" + stamp,
        "DTSTART;VALUE=DATE:" + ymd(x.date), "DTEND;VALUE=DATE:" + ymd(next),
        "SUMMARY:" + x.what + " (scadenza indicativa)",
        "DESCRIPTION:Promemoria di prova dal sito dimostrativo Studio Tirso\\, realizzato da Mockly. Lo studio è inventato: controlla la data vera con il tuo commercialista.",
        "BEGIN:VALARM", "TRIGGER:-P3D", "ACTION:DISPLAY", "DESCRIPTION:" + x.what + " fra tre giorni", "END:VALARM",
        "END:VEVENT", "END:VCALENDAR"
      ].join("\r\n");
      var url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
      var a = document.createElement("a");
      a.href = url; a.download = "scadenza-" + ymd(x.date) + ".ics";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      b.classList.add("is-done");
      b.lastChild.textContent = "Aggiunto";
    });

    grid.addEventListener("click", function (e) {
      var b = e.target.closest(".cal__month");
      if (b) show(+b.dataset.month, true);
    });
    grid.addEventListener("keydown", function (e) {
      var i = buttons.indexOf(document.activeElement);
      if (i < 0) return;
      var k = e.key, n = null;
      if (k === "ArrowRight") n = (i + 1) % 12;
      if (k === "ArrowLeft") n = (i + 11) % 12;
      if (n !== null) { e.preventDefault(); buttons[n].focus(); show(n, true); }
    });
    show(t.getMonth(), false);
  }

  /* ---------- Domande cercabili ---------- */
  function initFaq() {
    var box = $("[data-faq]");
    if (!box) return;
    var input = $("[data-faq-input]", box);
    var items = $$("[data-qa]", box);
    var empty = $("[data-faq-empty]", box);
    var emptyTerm = $("[data-faq-term]", box);
    var counter = $("[data-faq-count]", box);
    var search = $(".search", box);
    var chips = $$("[data-faq-chip]", box);
    var askLink = $("[data-faq-ask]", box);
    items.forEach(function (it) {
      $$("[data-text]", it).forEach(function (el) { el.dataset.original = el.innerHTML; });
    });
    function norm(s) { return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
    function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

    // Evidenzia nel testo, senza toccare i tag
    function highlight(el, words) {
      el.innerHTML = el.dataset.original;
      if (!words.length) return;
      var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      var nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach(function (node) {
        var text = node.nodeValue, n = norm(text), ranges = [];
        words.forEach(function (w) {
          var re = new RegExp(esc(w), "g"), m;
          while ((m = re.exec(n))) ranges.push([m.index, m.index + w.length]);
        });
        if (!ranges.length) return;
        ranges.sort(function (a, b) { return a[0] - b[0]; });
        var frag = document.createDocumentFragment(), pos = 0;
        ranges.forEach(function (r) {
          if (r[0] < pos) return;
          frag.appendChild(document.createTextNode(text.slice(pos, r[0])));
          var mk = document.createElement("mark");
          mk.textContent = text.slice(r[0], r[1]);
          frag.appendChild(mk);
          pos = r[1];
        });
        frag.appendChild(document.createTextNode(text.slice(pos)));
        node.parentNode.replaceChild(frag, node);
      });
    }

    function run() {
      var q = norm(input.value.trim());
      var words = q.split(/\s+/).filter(function (w) { return w.length > 1; });
      search.classList.toggle("has-text", input.value.length > 0);
      var shown = 0;
      items.forEach(function (it) {
        var hay = norm(it.textContent);
        var ok = words.every(function (w) { return hay.indexOf(w) > -1; });
        it.hidden = !ok;
        $$("[data-text]", it).forEach(function (el) { highlight(el, ok ? words : []); });
        if (ok) shown++;
      });
      items.forEach(function (it) {
        if (!words.length) { it.open = false; return; }
        if (!it.hidden && (shown <= 3 || $(".qa__body mark", it))) it.open = true;
      });
      empty.hidden = shown > 0;
      emptyTerm.textContent = input.value.trim();
      if (askLink) askLink.href = WA + "?text=" + encodeURIComponent("DEMO Studio Tirso (sito dimostrativo Mockly): ho una domanda che non trovo sul sito: " + input.value.trim());
      counter.textContent = words.length ? (shown === 1 ? "1 risposta" : shown + " risposte") + " per «" + input.value.trim() + "»" : items.length + " domande. Scrivi una parola, per esempio «730» o «cartella».";
      chips.forEach(function (c) { c.setAttribute("aria-pressed", String(norm(c.dataset.faqChip) === q)); });
    }
    var timer;
    input.addEventListener("input", function () { clearTimeout(timer); timer = setTimeout(run, 60); });
    $("[data-faq-clear]", box).addEventListener("click", function () { input.value = ""; run(); input.focus(); });
    chips.forEach(function (c) {
      c.addEventListener("click", function () {
        input.value = c.getAttribute("aria-pressed") === "true" ? "" : c.dataset.faqChip;
        run();
      });
    });
    run();
  }

  /* ---------- Servizi: filtri e liste da spuntare ---------- */
  function initServices() {
    var wrap = $("[data-services]");
    if (!wrap) return;
    var cards = $$(".svc", wrap);
    var filters = $$("[data-filter]");
    var empty = $("[data-services-empty]");
    function apply(f) {
      var shown = 0;
      cards.forEach(function (c) {
        var ok = f === "tutti" || c.dataset.for.split(" ").indexOf(f) > -1;
        c.hidden = !ok;
        if (ok) shown++;
      });
      filters.forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.filter === f)); });
      if (empty) empty.hidden = shown > 0;
    }
    filters.forEach(function (b) { b.addEventListener("click", function () { apply(b.dataset.filter); }); });

    $$(".bring").forEach(function (box) {
      var checks = $$("input[type=checkbox]", box);
      var bar = $(".bring__progress i", box);
      var label = $("[data-bring-count]", box);
      var done = $("[data-bring-done]", box);
      function update() {
        var n = checks.filter(function (c) { return c.checked; }).length;
        bar.style.transform = "scaleX(" + n / checks.length + ")";
        label.textContent = n + " di " + checks.length;
        done.textContent = n === checks.length ? "Tutto pronto. Ci vediamo in studio." : "";
      }
      checks.forEach(function (c) { c.addEventListener("change", update); });
      update();
    });
  }

  /* ---------- Prenotazione su WhatsApp ---------- */
  function initBooking() {
    var form = $("[data-booking]");
    if (!form) return;
    var params = new URLSearchParams(location.search);
    var pre = params.get("motivo");
    if (pre) {
      var r = form.querySelector('input[name="motivo"][value="' + pre.replace(/"/g, "") + '"]');
      if (r) r.checked = true;
    }
    var date = form.elements.giorno;
    var t = today();
    var min = new Date(t); min.setDate(min.getDate() + 1);
    var max = new Date(t); max.setDate(max.getDate() + 60);
    function iso(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
    date.min = iso(min); date.max = iso(max);

    var out = {
      motivo: $("[data-r=motivo]"), modo: $("[data-r=modo]"), giorno: $("[data-r=giorno]"),
      fascia: $("[data-r=fascia]"), nome: $("[data-r=nome]")
    };
    function radio(name) { var c = form.querySelector('input[name="' + name + '"]:checked'); return c ? c.value : ""; }
    function labelOf(name) { var c = form.querySelector('input[name="' + name + '"]:checked'); return c ? c.nextElementSibling.textContent.trim() : ""; }
    function dayText() {
      if (!date.value) return "";
      var p = date.value.split("-"); var d = new Date(+p[0], +p[1] - 1, +p[2]);
      return fmt(d);
    }
    function set(el, val, emptyText) {
      var before = el.textContent;
      el.textContent = val || emptyText;
      el.classList.toggle("is-empty", !val);
      if (val && before !== val && !reduce) { el.classList.remove("is-new"); void el.offsetWidth; el.classList.add("is-new"); }
    }
    function sync() {
      set(out.motivo, labelOf("motivo"), "da scegliere");
      set(out.modo, labelOf("modo"), "da scegliere");
      set(out.giorno, dayText(), "da scegliere");
      set(out.fascia, labelOf("fascia"), "da scegliere");
      set(out.nome, form.elements.nome.value.trim(), "da scrivere");
    }
    form.addEventListener("input", sync);
    form.addEventListener("change", sync);
    sync();

    function fieldOf(el) { return el.closest(".field"); }
    function setError(name, msg) {
      var f = form.querySelector('[data-field="' + name + '"]');
      f.classList.toggle("has-error", !!msg);
      $(".error", f).textContent = msg || "";
      return !msg;
    }
    function validate() {
      var ok = true, first = null;
      function check(name, msg) { var r = setError(name, msg); if (!r && !first) first = name; ok = ok && r; }
      check("motivo", radio("motivo") ? "" : "Scegli per cosa vuoi venire.");
      check("modo", radio("modo") ? "" : "Scegli come preferisci incontrarci.");
      var dmsg = "";
      if (!date.value) dmsg = "Scegli un giorno.";
      else {
        var p = date.value.split("-"); var d = new Date(+p[0], +p[1] - 1, +p[2]);
        if (d < min) dmsg = "Scegli un giorno da domani in poi.";
        else if (d > max) dmsg = "Si prenota al massimo due mesi avanti.";
        else if (d.getDay() === 0 || d.getDay() === 6) dmsg = "Sabato e domenica lo studio è chiuso: scegli un giorno dal lunedì al venerdì.";
      }
      check("giorno", dmsg);
      var fmsg = radio("fascia") ? "" : "Scegli mattina o pomeriggio.";
      if (!fmsg && !dmsg && radio("fascia") === "pomeriggio") {
        var q = date.value.split("-");
        if (new Date(+q[0], +q[1] - 1, +q[2]).getDay() === 5) fmsg = "Il venerdì pomeriggio lo studio è chiuso: scegli la mattina o un altro giorno.";
      }
      check("fascia", fmsg);
      var nome = form.elements.nome.value.trim();
      check("nome", nome.length >= 2 ? "" : "Scrivi il tuo nome, così sappiamo chi cercare.");
      if (first) {
        var f = form.querySelector('[data-field="' + first + '"]');
        f.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
        var focusable = f.querySelector("input, textarea");
        if (focusable) setTimeout(function () { focusable.focus({ preventScroll: true }); }, reduce ? 0 : 350);
      }
      return ok;
    }
    $$("input, textarea", form).forEach(function (el) {
      el.addEventListener("change", function () { var f = fieldOf(el); if (f && f.classList.contains("has-error")) validate(); });
    });

    var status = $("[data-status]");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      status.className = "form__status";
      if (!validate()) {
        status.textContent = "Mancano alcune cose: le trovi segnate in rosso.";
        status.classList.add("is-visible", "is-error");
        return;
      }
      var btn = $("button[type=submit]", form);
      btn.classList.add("is-busy");
      $("[data-btn-text]", btn).textContent = "Preparo il messaggio…";
      var note = form.elements.note.value.trim();
      var text = [
        "DIMOSTRAZIONE: questo messaggio arriva dal sito di prova «Studio Tirso», realizzato da Mockly. Lo studio non esiste.",
        "",
        "Vorrei un primo appuntamento.",
        "Per: " + labelOf("motivo"),
        "Come: " + labelOf("modo"),
        "Giorno preferito: " + dayText(),
        "Fascia: " + labelOf("fascia"),
        "Nome: " + form.elements.nome.value.trim()
      ];
      if (note) text.push("Note: " + note);
      var url = WA + "?text=" + encodeURIComponent(text.join("\n"));
      // Apertura immediata: con un ritardo Safari su iPhone la bloccherebbe
      var win = window.open(url, "_blank");
      if (win) win.opener = null; else location.href = url;
      setTimeout(function () {
        btn.classList.remove("is-busy");
        $("[data-btn-text]", btn).textContent = "Apri WhatsApp con il riepilogo";
        status.innerHTML = "Fatto: il riepilogo è pronto su WhatsApp, devi solo premere invia. È una dimostrazione, arriva a Mockly. " +
          '<a class="link" href="' + url + '" target="_blank" rel="noopener">Non si è aperto? Tocca qui</a>';
        status.classList.add("is-visible");
      }, reduce ? 0 : 400);
    });
  }

  /* ---------- Orari: evidenzia oggi ---------- */
  function initHours() {
    var d = new Date().getDay();
    $$("[data-day]").forEach(function (row) { if (+row.dataset.day === d) row.classList.add("is-today"); });
    var strip = $("[data-strip]");
    if (strip) {
      var spans = $$("span", strip);
      var draw = function () {
        var cols = parseInt(getComputedStyle(root).getPropertyValue("--cols"), 10) || 4;
        var t = today(), n = nextDeadline();
        var end = n ? n.date : new Date(t.getFullYear(), t.getMonth(), t.getDate() + 12);
        var span = Math.max(Math.round((end - t) / 86400000), cols - 1);
        spans.forEach(function (s, i) {
          s.hidden = i >= cols;
          s.className = "";
          if (i >= cols) return;
          var x = new Date(t); x.setDate(t.getDate() + Math.round(span * i / (cols - 1)));
          s.textContent = i === 0 ? "oggi" : x.getDate() + " " + MONTHS_SHORT[x.getMonth()].toLowerCase();
          if (i === 0) s.className = "is-today";
          if (i === cols - 1 && n) { s.className = "is-due"; s.textContent += " · " + n.what; }
        });
      };
      draw();
      window.addEventListener("resize", draw);
    }
  }

  /* ---------- Menu ---------- */
  function initMenu() {
    var menu = $("[data-menu]");
    var open = $("[data-menu-open]");
    if (!menu || !open) return;
    var close = $("[data-menu-close]", menu);
    var veil = $(".menu__veil", menu);
    var panel = $(".menu__panel", menu);
    var lastFocus = null, hideTimer;
    function isOpen() { return menu.classList.contains("is-open"); }
    function show() {
      clearTimeout(hideTimer);
      lastFocus = document.activeElement;
      menu.hidden = false;
      void menu.offsetWidth;
      menu.classList.add("is-open");
      open.setAttribute("aria-expanded", "true");
      document.body.classList.add("is-locked");
      setTimeout(function () { close.focus(); }, 30);
    }
    function hide() {
      if (!isOpen()) return;
      menu.classList.remove("is-open");
      open.setAttribute("aria-expanded", "false");
      document.body.classList.remove("is-locked");
      hideTimer = setTimeout(function () { menu.hidden = true; }, reduce ? 0 : 340);
      if (lastFocus) lastFocus.focus();
    }
    open.addEventListener("click", show);
    close.addEventListener("click", hide);
    veil.addEventListener("click", hide);
    $$("a", panel).forEach(function (a) { a.addEventListener("click", function () { hide(); }); });
    document.addEventListener("keydown", function (e) {
      if (!isOpen()) return;
      if (e.key === "Escape") { e.preventDefault(); hide(); }
      if (e.key === "Tab") {
        var f = $$("a, button", panel);
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    window.matchMedia("(min-width: 64em)").addEventListener("change", function (m) { if (m.matches) hide(); });
  }

  /* ---------- Barra col pollice: si nasconde vicino al finale ---------- */
  function initThumb() {
    var bar = $(".thumb-bar");
    var end = $("[data-hide-thumb]");
    if (!bar || !end || !("IntersectionObserver" in window)) return;
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { bar.classList.toggle("is-hidden", e.isIntersecting); });
    }).observe(end);
  }

  /* ---------- Comparse: i blocchi scattano nella loro colonna ---------- */
  function initSnap() {
    var els = $$("[data-snap], .rule[data-draw]");
    if (reduce || !("IntersectionObserver" in window)) { els.forEach(function (el) { el.classList.add("is-in"); }); return; }
    // Ritardo a scaletta per i fratelli che entrano insieme
    $$("[data-stagger]").forEach(function (group) {
      $$("[data-snap]", group).forEach(function (el, i) { el.style.setProperty("--d", Math.min(i * 70, 420) + "ms"); });
    });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.01 });
    els.forEach(function (el) { io.observe(el); });
  }

  initMenu();
  initDeadline();
  initCalendar();
  initFaq();
  initServices();
  initBooking();
  initHours();
  initThumb();
  initSnap();
  // Riserva: se il programma non disegna fotogrammi, il titolo compare comunque
  function ready() { root.classList.add("is-ready"); }
  requestAnimationFrame(function () { requestAnimationFrame(ready); });
  setTimeout(ready, 120);
})();
