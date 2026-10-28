/* Logica pagina Alice. Dati in config.js. Lingua UI primaria: it. */
(function () {
  "use strict";
  var C = window.CONFIG || {};
  var $ = function (id) { return document.getElementById(id); };
  var LANG = "it";
  var BASE = (document.currentScript && document.currentScript.src) ? new URL(".", document.currentScript.src).href : "";

  var T = {
    locale: "it-IT",
    mancano: function (x) { return "mancano " + x; },
    raggiunto: "obiettivo raggiunto, grazie di cuore!",
    aggiornato: " · aggiornato il ",
    raccoltiSu: " raccolti su ",
    titoloBanca: function (b) { return "Bonifico sul conto " + b; },
    ibanMancante: "L'IBAN non è ancora stato inserito.",
    causaleMancante: "La causale non è ancora stata inserita.",
    ibanCopiato: "IBAN copiato negli appunti",
    causaleCopiata: "Causale copiata negli appunti",
    linkCopiato: "Link copiato negli appunti",
    copiaFallita: "Copia non riuscita: seleziona il testo e copialo a mano.",
    numeroCopiato: "Numero copiato negli appunti",
    bicCopiato: "BIC copiato negli appunti",
    datoMancante: "Questo dato non è ancora stato inserito.",
    shareTitolo: "Aiutiamo Alice — 5 anni, leucemia, Lituania",
    shareTesto: function (x) {
      return "Alice ha 5 anni (cittadinanza lituana) e ha bisogno di un trapianto di midollo in Inghilterra. Stiamo raccogliendo " + x + ": anche 1 € o una condivisione aiutano. Privacy: solo nome di battesimo; foto con volto oscurato.";
    },
    ph: { intestatario: "[INTESTATARIO]", iban: "[IBAN]", ibanRevolut: "[IBAN REVOLUT]", causale: "[CAUSALE]", contatto: "[CONTATTO]" }
  };

  function isPlaceholder(v) {
    return typeof v !== "string" || v.trim() === "" || v.trim().charAt(0) === "[";
  }
  function num(v, def) {
    var n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
    return isFinite(n) && n >= 0 ? n : def;
  }
  function euro(n) {
    var dec = Math.round(n * 100) % 100 !== 0;
    return new Intl.NumberFormat(T.locale, {
      style: "currency", currency: "EUR",
      minimumFractionDigits: dec ? 2 : 0, maximumFractionDigits: dec ? 2 : 0
    }).format(n);
  }
  function data(v) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v).trim());
    if (!m) return String(v);
    var d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    return new Intl.DateTimeFormat(T.locale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(d);
  }

  var toastTimer;
  function toast(msg) {
    var t = $("toast");
    t.textContent = msg;
    t.classList.add("visibile");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("visibile"); }, 2600);
  }

  function copia(testo, msgOk) {
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = testo;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      toast(ok ? msgOk : T.copiaFallita);
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(testo).then(function () { toast(msgOk); }, fallback);
    } else {
      fallback();
    }
  }

  if (C.donazioniChiuse === true) {
    var sezDona = $("dona");
    if (sezDona) sezDona.hidden = true;
    Array.prototype.forEach.call(document.querySelectorAll('a.btn[href="#dona"]'), function (el) { el.hidden = true; });
  }

  var obiettivo = num(C.obiettivo, 690) || 690;
  var raccolto = num(C.raccolto, 0);
  var perc = Math.min(100, Math.round((raccolto / obiettivo) * 100));
  var mancano = Math.max(0, obiettivo - raccolto);

  $("raccolto").textContent = euro(raccolto);
  $("obiettivo").textContent = euro(obiettivo);
  $("percentuale").textContent = perc + "%";
  $("mancano").textContent = mancano > 0 ? T.mancano(euro(mancano)) : T.raggiunto;
  if (C.aggiornatoIl) $("aggiornato").textContent = T.aggiornato + data(C.aggiornatoIl);
  var barra = $("barra");
  barra.setAttribute("aria-valuemax", String(obiettivo));
  barra.setAttribute("aria-valuenow", String(Math.min(raccolto, obiettivo)));
  barra.setAttribute("aria-valuetext", euro(raccolto) + T.raccoltiSu + euro(obiettivo));
  if (mancano === 0) {
    document.querySelector(".progresso").classList.add("completo");
    var rag = $("obiettivo-raggiunto");
    if (rag) rag.hidden = false;
  }

  var banner = $("urgenza");
  if (banner) {
    if (C.urgenza === true && mancano > 0) {
      Array.prototype.forEach.call(document.querySelectorAll("[data-mancano]"), function (el) { el.textContent = euro(mancano); });
      Array.prototype.forEach.call(document.querySelectorAll("[data-persone]"), function (el) {
        el.textContent = new Intl.NumberFormat(T.locale).format(Math.ceil(mancano));
      });
    } else {
      banner.hidden = true;
    }
  }
  requestAnimationFrame(function () {
    $("barra-riempimento").style.width = (raccolto > 0 ? Math.max(perc, 2) : 0) + "%";
  });

  function ibanCompatto(v) { return String(v).replace(/\s+/g, "").toUpperCase(); }
  function ibanLeggibile(v) { return ibanCompatto(v).replace(/(.{4})(?=.)/g, "$1 "); }

  var valori = {
    intestatario: C.intestatario || T.ph.intestatario,
    iban: C.iban || T.ph.iban,
    ibanRevolut: C.ibanRevolut || T.ph.ibanRevolut,
    causale: C.causale || T.ph.causale,
    contatto: C.contatto || T.ph.contatto,
    telefonoRevolut: C.telefonoRevolut || "",
    bicRevolut: C.bicRevolut || "",
    bancaRevolut: C.bancaRevolut || "",
    indirizzoBancaRevolut: C.indirizzoBancaRevolut || "",
    bicCorrispondente: C.bicCorrispondente || ""
  };
  Array.prototype.forEach.call(document.querySelectorAll("[data-campo]"), function (el) {
    var k = el.getAttribute("data-campo"), v = valori[k];
    if (v == null) return;
    var ph = isPlaceholder(v);
    el.textContent = (!ph && (k === "iban" || k === "ibanRevolut")) ? ibanLeggibile(v) : v;
    el.classList.toggle("placeholder", ph);
  });

  if (C.banca && !isPlaceholder(C.banca) && $("titolo-banca")) {
    $("titolo-banca").textContent = T.titoloBanca(C.banca);
  }

  if (!isPlaceholder(C.contatto)) {
    var c = C.contatto.trim(), href = null;
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c)) href = "mailto:" + c;
    else if (/^\+?[\d\s.\-()]{6,}$/.test(c)) href = "tel:" + c.replace(/[^\d+]/g, "");
    if (href) {
      var a = document.createElement("a");
      a.href = href; a.textContent = c;
      var span = $("contatto"); span.textContent = ""; span.appendChild(a);
    }
  }

  Array.prototype.forEach.call(document.querySelectorAll("[data-copia]"), function (btn) {
    btn.addEventListener("click", function () {
      var k = btn.getAttribute("data-copia"), v = valori[k];
      if (k === "causale") {
        if (isPlaceholder(v)) { toast(T.causaleMancante); return; }
        copia(v.trim(), T.causaleCopiata);
      } else if (k === "telefonoRevolut") {
        if (isPlaceholder(v) || !v) { toast(T.datoMancante); return; }
        copia(v.replace(/[^\d+]/g, ""), T.numeroCopiato);
      } else if (k === "bicRevolut" || k === "bicCorrispondente") {
        if (isPlaceholder(v) || !v) { toast(T.datoMancante); return; }
        copia(ibanCompatto(v), T.bicCopiato);
      } else {
        if (isPlaceholder(v) || !v) { toast(T.ibanMancante); return; }
        copia(ibanCompatto(v), T.ibanCopiato);
      }
    });
  });

  if (!C.iban || C.iban === "") {
    var cb = $("card-banca");
    if (cb) cb.hidden = true;
  }
  if (C.ibanRevolut === "") {
    var cr = $("card-revolut");
    if (cr) cr.hidden = true;
  }
  if (!C.telefonoRevolut) {
    var ct = $("card-revolut-tel");
    if (ct) ct.hidden = true;
  }
  if (!C.bicRevolut && !C.bancaRevolut && !C.indirizzoBancaRevolut && !C.bicCorrispondente && $("extra-sepa")) {
    $("extra-sepa").hidden = true;
  }
  if (typeof C.revolutLink === "string" && /^https:\/\/\S+$/.test(C.revolutLink.trim())) {
    var rl = $("revolut-link");
    rl.href = C.revolutLink.trim();
    rl.hidden = false;
  }

  function caricaImmagine(src, onOk) {
    var img = new Image();
    img.onload = function () { if (img.naturalWidth > 0) onOk(img); };
    img.src = src;
  }
  function mostraRicevuta(file, boxId, testo, onOk) {
    var src = BASE + file;
    caricaImmagine(src, function (img) {
      img.alt = testo;
      var fig = document.createElement("figure");
      var link = document.createElement("a");
      link.href = src; link.target = "_blank"; link.rel = "noopener";
      link.appendChild(img);
      var cap = document.createElement("figcaption");
      cap.textContent = testo;
      fig.appendChild(link); fig.appendChild(cap);
      var box = $(boxId); box.innerHTML = ""; box.appendChild(fig);
      if (onOk) onOk();
    });
  }

  if (C.ricevutaPubblicata === true) {
    mostraRicevuta("images/ricevuta.jpg", "ricezione",
      C.ricevutaDidascalia || "Conferma di donazioni ricevute",
      function () { $("blocco-ricezione").hidden = false; });
  }
  if (C.bonificoFinalePubblicato === true) {
    mostraRicevuta("images/bonifico-famiglia.jpg", "ricevuta",
      C.bonificoFinaleDidascalia || "Ricevuta del bonifico alla famiglia di Alice");
  }

  var url = location.href.split("#")[0];
  if (C.urlPagina && C.urlPagina.trim()) url = C.urlPagina.trim();
  var messaggio = T.shareTesto(euro(obiettivo));

  $("share-whatsapp").href = "https://wa.me/?text=" + encodeURIComponent(messaggio + " " + url);
  $("share-facebook").href = "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(url);
  $("share-copia").addEventListener("click", function () { copia(url, T.linkCopiato); });

  if (navigator.share) {
    var nat = $("share-nativo");
    nat.hidden = false;
    nat.addEventListener("click", function () {
      navigator.share({ title: T.shareTitolo, text: messaggio, url: url }).catch(function () {});
    });
  }
})();
