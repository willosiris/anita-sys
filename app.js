"use strict";

/* ============================================================================
   ANAROSA · Sistema de Repuestos, Almacén, Administración y Billetera Personal
   app.js
   - Respeta al 100% las tablas existentes en Supabase (cero cambios de esquema)
   - Billetera Personal privada por usuario (aislada de la contabilidad comercial)
   - Categorías de Billetera exclusivas para el Administrador
   - Administración estilo Juanchos: Usuarios/Iconos 1:1, Tickets 80mm/58mm/A4,
     Favicon y Logo en vivo, Paleta de Color, Modo Día/Noche, Privacidad y Método
   - Coreografía de Scroll estilo Artcraft + Teclado Numérico Táctil Inteligente
   ============================================================================ */

// 1. CREDENCIALES SUPABASE Y RESPALDO DE USUARIOS INICIALES (INTACTOS)
const DEFAULT_SUPABASE_URL = "https://qkhliyvtrawtveexuxls.supabase.co";
const DEFAULT_SUPABASE_KEY = "sb_publishable_Ds4IYaHux6yT2koNicw4Ug_OoZYyCQ_";
const STORAGE_KEY = "anarosa_erp_clean_supabase_v3";
const ADMIN_CONFIG_KEY = "anarosa_admin_config_v4";
const WALLET_PREFIX_KEY = "anarosa_wallet_private_v1_";

const INITIAL_USUARIOS = [
  {
    id: 1,
    username: "ANAROSA",
    password: "190324",
    role: "OPERADOR GENERAL",
    permissions: {
      eliminar_ventas: false,
      modificar_precios: false,
      acceso_sql: false,
      gestionar_usuarios: false
    }
  },
  {
    id: 2,
    username: "Admin",
    password: "1903",
    role: "ADMINISTRADOR SQL",
    permissions: {
      eliminar_ventas: true,
      modificar_precios: true,
      acceso_sql: true,
      gestionar_usuarios: false
    }
  },
  {
    id: 3,
    username: "WILLOSIRIS",
    password: "74969686",
    role: "SUPER ADMINISTRADOR",
    permissions: {
      eliminar_ventas: true,
      modificar_precios: true,
      acceso_sql: true,
      gestionar_usuarios: true
    }
  }
];

const DEFAULT_WALLET_CATEGORIES = [
  { id: "cat_alim", name: "ALIMENTACIÓN", type: "GASTO", icon: "utensils", color: "#f59e0b" },
  { id: "cat_trans", name: "TRANSPORTE / PASAJES", type: "GASTO", icon: "bus", color: "#3b82f6" },
  { id: "cat_hogar", name: "HOGAR Y SERVICIOS", type: "GASTO", icon: "home", color: "#8b5cf6" },
  { id: "cat_salud", name: "SALUD Y FARMACIA", type: "GASTO", icon: "heart-pulse", color: "#ef4444" },
  { id: "cat_comp", name: "COMPRAS PERSONALES", type: "GASTO", icon: "shopping-bag", color: "#ec4899" },
  { id: "cat_ocio", name: "SALIDAS / ANTOJOS", type: "GASTO", icon: "coffee", color: "#14b8a6" },
  { id: "cat_cel", name: "RECARGAS / INTERNET", type: "GASTO", icon: "smartphone", color: "#06b6d4" },
  { id: "cat_otros", name: "OTROS GASTOS", type: "GASTO", icon: "wrench", color: "#64748b" },
  { id: "cat_sueldo", name: "SUELDO / PAGO", type: "INGRESO", icon: "wallet", color: "#10b981" },
  { id: "cat_extra", name: "INGRESO EXTRA", type: "INGRESO", icon: "trending-up", color: "#059669" },
  { id: "cat_ahorro", name: "AHORRO / RESERVA", type: "AMBOS", icon: "piggy-bank", color: "#eab308" }
];

const CATEGORY_ICONS = [
  "utensils", "bus", "home", "heart-pulse", "shopping-bag", "coffee", "smartphone", "fuel",
  "graduation-cap", "gift", "wrench", "gamepad-2", "wallet", "trending-up", "piggy-bank", "sparkles"
];

// SVG Data URIs para iconos predeterminados de Avatar / Logo / Favicon
function buildPresetBadgeDataUrl(bgHex, fgHex, labelText) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" rx="28" fill="${bgHex}"/><circle cx="60" cy="60" r="46" fill="none" stroke="${fgHex}" stroke-opacity="0.28" stroke-width="3"/><text x="60" y="73" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="800" font-size="38" fill="${fgHex}">${labelText}</text></svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

const DEFAULT_BRAND_SVG_MARKUP = `
  <svg class="w-full h-full" viewBox="0 0 120 110" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="18,42 36,32 36,52 18,62" fill="#d97706" />
    <polygon points="44,27 64,15 64,35 44,47" fill="#d97706" />
    <polygon points="72,12 94,0 94,20 72,32" fill="#d97706" />
    <polygon points="28,45 44,36 44,85 28,85" fill="#0f172a" />
    <polygon points="55,30 72,20 72,92 55,92" fill="#1e3a8a" />
    <polygon points="83,14 102,4 102,100 83,100" fill="#2563eb" />
    <circle cx="36" cy="94" r="5" fill="#d97706" />
    <circle cx="36" cy="94" r="2" fill="#ffffff" />
  </svg>
`;

const PRESET_AVATARS = [
  { label: "MEC", bg: "#0c1424", fg: "#f59e0b", text: "⚙️" },
  { label: "ADM", bg: "#1e3a8a", fg: "#93c5fd", text: "🛡️" },
  { label: "VTA", bg: "#065f46", fg: "#6ee7b7", text: "💼" },
  { label: "ALM", bg: "#7c2d12", fg: "#fdba74", text: "📦" },
  { label: "AUT", bg: "#312e81", fg: "#c7d2fe", text: "🚘" },
  { label: "PRO", bg: "#881337", fg: "#fda4af", text: "⚡" }
].map(p => ({ label: p.label, url: buildPresetBadgeDataUrl(p.bg, p.fg, p.text) }));

function createDefaultPrinterTemplate(type) {
  if (type === "a4") {
    return {
      brandTitle: "ANAROSA",
      brandSub: "REPUESTOS Y ACCESORIOS AUTOMOTRICES",
      rucLine: "CONTROL DE ALMACÉN Y VENTAS",
      address: "AV. PRINCIPAL S/N",
      city: "JULIACA - PUNO",
      phone: "",
      docTitle: "REPORTE OFICIAL DE VENTAS",
      fontSize: 11,
      footer: "DOCUMENTO ADMINISTRATIVO GENERADO POR EL SISTEMA ANAROSA.",
      promo: "CONTROL INTERNO DE OPERACIONES",
      showLogo: true,
      showIgv: true,
      showBarcode: false
    };
  }
  const isClient = type === "cliente";
  return {
    brandTitle: "ANAROSA",
    brandSub: isClient ? "REPUESTOS Y ACCESORIOS AUTOMOTRICES" : "CONTROL INTERNO · ALMACÉN",
    rucLine: isClient ? "ATENCIÓN Y DESPACHO DE REPUESTOS" : "TICKET INTERNO DE DESPACHO",
    address: "MOSTRADOR CENTRAL",
    city: "JULIACA - PERÚ",
    phone: "",
    docTitle: isClient ? "COMPROBANTE DE VENTA" : "ORDEN DE DESPACHO INTERNO",
    fontSize: 12,
    footer: isClient
      ? "VERIFIQUE SU REPUESTO ANTES DE RETIRARSE. GRACIAS POR SU COMPRA."
      : "ENTREGAR REPUESTOS VERIFICANDO CÓDIGO Y CANTIDAD EN ALMACÉN.",
    promo: isClient ? "¡GRACIAS POR SU PREFERENCIA!" : "CONTROL DE SALIDA DE ALMACÉN",
    showLogo: true,
    showIgv: false,
    showBarcode: true
  };
}

function createDefaultAdminConfig() {
  return {
    theme: "light",
    accent: "amber",
    brand: {
      name: "ANAROSA",
      subtitle: "REPUESTOS Y ACCESORIOS",
      ruc: "",
      logoDataUrl: "",
      faviconDataUrl: "favicon.svg"
    },
    userAvatars: {},
    userPrintPerm: {},
    printing: {
      usarTicketCliente: true,
      autoPrintOnSale: false,
      paperWidth: "80mm",
      a4ColorMode: "color",
      templates: {
        cliente: createDefaultPrinterTemplate("cliente"),
        interno: createDefaultPrinterTemplate("interno"),
        a4: createDefaultPrinterTemplate("a4")
      }
    },
    privacy: {
      inactivityMinutes: 15,
      maskPasswords: true,
      lockoutAfter3Tries: true,
      privacyBlurDefault: false,
      showLoginCards: true,
      allowSelfAvatar: true
    },
    workflow: {
      postSaleFlow: "MODAL",
      defaultPayMode: "CREDITO",
      lowStockThreshold: 3,
      stockMode: "STRICT",
      numpadMode: "AUTO_TOUCH"
    },
    walletCategories: JSON.parse(JSON.stringify(DEFAULT_WALLET_CATEGORIES))
  };
}

// ============================================================================
// 2. ESTADO GLOBAL
// ============================================================================
let adminConfig = loadAdminConfig();

let state = {
  almacen: [],
  ventas: [],
  compras: [],
  clientes: [],
  usuarios: JSON.parse(JSON.stringify(INITIAL_USUARIOS)),
  currentUser: null,
  supabaseGateUnlocked: false,
  tempPriceOverride: false,
  currentTab: "inicio",
  adminSubtab: "adm-usuarios",
  editingPrinterTpl: "cliente",
  dashboardPeriod: "ALL",
  fontEditorial: false,
  privacyBlurActive: Boolean(adminConfig.privacy.privacyBlurDefault),
  posCart: [],
  posSelectedClient: null,
  walletPeriod: "MES",
  tempUserFormAvatar: "",
  revealedUserPasswords: {}
};

let supabaseClient = null;
let isSupabaseOnline = false;

let failedLoginAttempts = 0;
let loginLockoutUntil = 0;
let loginLockoutInterval = null;

let inactivityRemainingSeconds = getInactivityLimitSeconds();
let inactivityInterval = null;
let isSessionLocked = false;
let pendingAdminCallback = null;

let lastCreatedSale = null;
let currentModalPrintContext = { mode: "sale", saleId: null, ticketType: "cliente", reportHtml: "" };
let pendingConfirmAction = null;
let confirmCountdownInterval = null;
let duplicatePendingProduct = null;
let duplicatePendingClient = null;

// Variables de rendimiento (debounce + coalescencia de iconos)
let iconRafId = null;
let buscarDebounceTimer = null;
let posPickerDebounceTimer = null;
let ventasSearchDebounceTimer = null;

function refreshIcons() {
  if (iconRafId) return;
  iconRafId = requestAnimationFrame(() => {
    iconRafId = null;
    if (window.lucide) {
      window.lucide.createIcons();
    }
  });
}

function escHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[ch]));
}

function loadAdminConfig() {
  const base = createDefaultAdminConfig();
  try {
    const raw = localStorage.getItem(ADMIN_CONFIG_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw);
    return {
      ...base,
      ...parsed,
      brand: { ...base.brand, ...(parsed.brand || {}) },
      userAvatars: { ...(parsed.userAvatars || {}) },
      userPrintPerm: { ...(parsed.userPrintPerm || {}) },
      printing: {
        ...base.printing,
        ...(parsed.printing || {}),
        templates: {
          cliente: { ...base.printing.templates.cliente, ...(parsed.printing?.templates?.cliente || {}) },
          interno: { ...base.printing.templates.interno, ...(parsed.printing?.templates?.interno || {}) },
          a4: { ...base.printing.templates.a4, ...(parsed.printing?.templates?.a4 || {}) }
        }
      },
      privacy: { ...base.privacy, ...(parsed.privacy || {}) },
      workflow: { ...base.workflow, ...(parsed.workflow || {}) },
      walletCategories: Array.isArray(parsed.walletCategories) && parsed.walletCategories.length > 0
        ? parsed.walletCategories
        : base.walletCategories
    };
  } catch (e) {
    return base;
  }
}

function saveAdminConfig() {
  try {
    localStorage.setItem(ADMIN_CONFIG_KEY, JSON.stringify(adminConfig));
  } catch (e) {
    console.warn("Aviso guardando configuración local:", e);
  }
}

function getInactivityLimitSeconds() {
  const mins = Number(adminConfig.privacy.inactivityMinutes ?? 15);
  return mins > 0 ? mins * 60 : 0;
}

// ============================================================================
// 3. TEMA (MODO DÍA / MODO NOCHE), PALETA DE COLOR E IDENTIDAD DE MARCA
// ============================================================================
function applyThemeAndAccent() {
  const theme = adminConfig.theme === "dark" ? "dark" : "light";
  const accent = adminConfig.accent || "amber";
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.setAttribute("data-accent", accent);

  const metaTheme = document.getElementById("meta-theme-color");
  if (metaTheme) {
    metaTheme.setAttribute("content", theme === "dark" ? "#090d16" : "#f3f5f8");
  }

  document.querySelectorAll(".theme-mode-label").forEach(lbl => {
    lbl.textContent = theme === "dark" ? "Noche" : "Día";
  });

  const cardLight = document.getElementById("card-theme-light");
  const cardDark = document.getElementById("card-theme-dark");
  if (cardLight && cardDark) {
    cardLight.style.borderColor = theme === "light" ? "var(--accent)" : "var(--line)";
    cardDark.style.borderColor = theme === "dark" ? "var(--accent)" : "var(--line)";
  }

  document.querySelectorAll("#accent-palette-grid [data-accbtn]").forEach(btn => {
    const isAct = btn.dataset.accbtn === accent;
    btn.style.borderColor = isAct ? "var(--accent)" : "var(--line)";
    btn.style.backgroundColor = isAct ? "var(--accent-soft)" : "var(--surface)";
  });

  applyPrivacyBlurUI();
  refreshIcons();
}

function toggleTheme() {
  adminConfig.theme = adminConfig.theme === "dark" ? "light" : "dark";
  saveAdminConfig();
  applyThemeAndAccent();
}

function setThemeExplicit(mode) {
  adminConfig.theme = mode === "dark" ? "dark" : "light";
  saveAdminConfig();
  applyThemeAndAccent();
  showToast(adminConfig.theme === "dark" ? "Modo Noche activado" : "Modo Día activado", "info");
}

function setAccentColor(accentName) {
  adminConfig.accent = accentName;
  saveAdminConfig();
  applyThemeAndAccent();
  showToast("Color de acento actualizado", "success");
}

function setLucideIcon(elId, iconName, classStr = "w-4 h-4") {
  const el = document.getElementById(elId);
  if (!el) return;
  el.outerHTML = `<i id="${elId}" data-lucide="${iconName}" class="${classStr}"></i>`;
}

function applyPrivacyBlurUI() {
  document.body.classList.toggle("privacy-blur", Boolean(state.privacyBlurActive));
  setLucideIcon("privacy-toggle-icon", state.privacyBlurActive ? "eye-off" : "eye", "w-3.5 h-3.5");
  const lbl = document.getElementById("privacy-toggle-label");
  if (lbl) lbl.textContent = state.privacyBlurActive ? "Saldos ocultos" : "Saldos visibles";
}

function togglePrivacyBlur() {
  state.privacyBlurActive = !state.privacyBlurActive;
  applyPrivacyBlurUI();
  refreshIcons();
}

function applyBrandIdentityToDOM() {
  const b = adminConfig.brand;
  const brandName = (b.name || "ANAROSA").toUpperCase();
  const brandSub = (b.subtitle || "REPUESTOS Y ACCESORIOS").toUpperCase();
  const logoHtml = b.logoDataUrl
    ? `<img src="${escHtml(b.logoDataUrl)}" alt="${escHtml(brandName)}" class="w-full h-full object-contain" />`
    : DEFAULT_BRAND_SVG_MARKUP;

  const loginWrap = document.getElementById("login-brand-logo-wrap");
  const sideWrap = document.getElementById("sidebar-brand-logo-wrap");
  const mobWrap = document.getElementById("mobile-brand-logo-wrap");
  const admLogo = document.getElementById("adm-preview-logo");

  if (loginWrap) loginWrap.innerHTML = logoHtml;
  if (sideWrap) sideWrap.innerHTML = logoHtml;
  if (mobWrap) {
    mobWrap.innerHTML = b.logoDataUrl
      ? `<img src="${escHtml(b.logoDataUrl)}" alt="Logo" class="w-full h-full object-contain" />`
      : `<span class="font-display font-bold text-sm">${escHtml(brandName.charAt(0) || "A")}</span>`;
  }
  if (admLogo) admLogo.innerHTML = logoHtml;

  const setTxt = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };
  setTxt("login-brand-name", brandName);
  setTxt("login-brand-sub", brandSub);
  setTxt("sidebar-brand-name", brandName);
  setTxt("sidebar-brand-sub", brandSub);
  setTxt("mobile-brand-name", brandName);
  setTxt("mobile-brand-sub", brandSub);

  document.title = `${brandName} · ${brandSub}`;

  const favHref = b.faviconDataUrl || "favicon.svg";
  const favLink = document.getElementById("faviconLink");
  if (favLink) {
    favLink.href = favHref;
    favLink.type = favHref.startsWith("data:image/png") ? "image/png" : "image/svg+xml";
  }
  const admFav = document.getElementById("adm-preview-favicon");
  if (admFav) admFav.src = favHref;
}

function getUserAvatarUrl(username) {
  if (!username) return "";
  return adminConfig.userAvatars[String(username).trim().toLowerCase()] || "";
}

function getInitials(name) {
  const clean = String(name || "U").trim();
  if (!clean) return "U";
  const parts = clean.split(/[\s_-]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return clean.slice(0, 2).toUpperCase();
}

function renderUserAvatarHtml(username, large = false) {
  const url = getUserAvatarUrl(username);
  const sizeCls = large ? "user-avatar lg" : "user-avatar";
  if (url) {
    return `<span class="${sizeCls}"><img src="${escHtml(url)}" alt="${escHtml(username)}" /></span>`;
  }
  return `<span class="${sizeCls}">${escHtml(getInitials(username))}</span>`;
}

function canUserPrint(userObj) {
  if (!userObj) return false;
  if (String(userObj.username).toUpperCase() === "WILLOSIRIS") return true;
  const key = String(userObj.username).trim().toLowerCase();
  if (key in adminConfig.userPrintPerm) {
    return Boolean(adminConfig.userPrintPerm[key]);
  }
  return true;
}

// ============================================================================
// 4. CONEXIÓN SUPABASE (MODO SEGURO: CERO CAMBIOS A ESQUEMA EXISTENTE)
// ============================================================================
function updateSyncStatusBadge(online, textMsg) {
  isSupabaseOnline = online;
  const badge = document.getElementById("sync-status-badge");
  const dot = document.getElementById("sync-status-dot");
  const text = document.getElementById("sync-status-text");
  if (!badge || !dot || !text) return;

  if (online) {
    badge.className = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold";
    dot.className = "w-1.5 h-1.5 rounded-full bg-emerald-500";
    text.textContent = textMsg || "Supabase Conectado";
  } else {
    badge.className = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] bg-amber-50 text-amber-800 border border-amber-200 font-semibold";
    dot.className = "w-1.5 h-1.5 rounded-full bg-amber-500";
    text.textContent = textMsg || "Modo Local (Offline)";
  }
}

function initSupabaseClient() {
  const savedUrl = localStorage.getItem("anarosa_sb_url") || DEFAULT_SUPABASE_URL;
  const savedKey = localStorage.getItem("anarosa_sb_key") || DEFAULT_SUPABASE_KEY;

  const urlInp = document.getElementById("sb-url-input");
  const keyInp = document.getElementById("sb-key-input");
  if (urlInp) urlInp.value = savedUrl;
  if (keyInp) keyInp.value = savedKey;

  if (window.supabase && savedUrl && savedKey) {
    supabaseClient = window.supabase.createClient(savedUrl, savedKey);
  }
}

async function syncFromSupabase(showFeedback = false) {
  if (!supabaseClient) initSupabaseClient();
  if (!supabaseClient) {
    updateSyncStatusBadge(false, "Sin cliente Supabase");
    return;
  }

  try {
    updateSyncStatusBadge(true, "Sincronizando...");

    const [resAlmacen, resClientes, resVentas, resCompras, resUsuarios] = await Promise.all([
      supabaseClient.from("almacen").select("*").order("id", { ascending: true }),
      supabaseClient.from("clientes").select("*").order("id", { ascending: true }),
      supabaseClient.from("ventas").select("*").order("id", { ascending: false }),
      supabaseClient.from("compras").select("*").order("id", { ascending: false }),
      supabaseClient.from("usuarios").select("*").order("id", { ascending: true })
    ]);

    if (resAlmacen.error) throw resAlmacen.error;

    state.almacen = (resAlmacen.data || []).map(row => {
      let codigo = row.codigo || "";
      let detalles = row.detalles || "";
      if (!codigo && detalles.startsWith("[COD:")) {
        const match = detalles.match(/^\[COD:\s*([^\]]+)\]\s*/);
        if (match) {
          codigo = match[1].trim();
          detalles = detalles.replace(match[0], "").trim();
        }
      }
      if (!codigo) {
        codigo = `COD${String(row.id).padStart(7, "0")}`;
      }
      return {
        id: row.id,
        codigo,
        descripcion: row.descripcion || "",
        compatibilidad: row.compatibilidad || "UNIVERSAL",
        stock: Number(row.stock) || 0,
        und: row.und || "UNIDAD",
        pCompra: Number(row.p_compra) || 0,
        pVenta: Number(row.p_venta) || 0,
        detalles,
        observacion: row.observacion || ""
      };
    });

    if (!resClientes.error && resClientes.data) {
      state.clientes = resClientes.data.map(row => ({
        id: row.id,
        codigo: row.cod || "",
        origen: row.origen || "GENERAL",
        nombre: row.telefono || row.cod || "",
        telefono: row.telefono || ""
      }));
    }

    if (!resVentas.error && resVentas.data) {
      state.ventas = resVentas.data.map(row => ({
        id: row.id,
        ticket: row.ticket || "",
        fecha: row.fecha || new Date().toISOString().slice(0, 10),
        cliente: row.cliente || "OTROS",
        clienteNombre: row.origen || "",
        origen: row.origen || "",
        descripcion: row.descripcion || "",
        cantidad: Number(row.cantidad) || 1,
        precioUnit: Number(row.precio_uni) || 0,
        total: Number(row.precio_total) || 0,
        pagado: Number(row.pagado) || 0,
        estado: row.estado || "Por Cancelar",
        observacion: row.observacion || "",
        items: []
      }));
    }

    if (!resCompras.error && resCompras.data) {
      state.compras = resCompras.data.map(row => ({
        id: row.id,
        repuestoId: row.repuesto_id,
        concepto: row.repuesto_nombre || "",
        fecha: row.fecha || new Date().toISOString().slice(0, 10),
        cantidad: Number(row.cantidad) || 1,
        costoUnit: Number(row.costo_uni) || 0,
        total: Number(row.total) || 0,
        descripcion: row.proveedor || ""
      }));
    }

    if (!resUsuarios.error && resUsuarios.data && resUsuarios.data.length > 0) {
      state.usuarios = resUsuarios.data.map(row => ({
        id: row.id,
        username: row.username,
        password: row.password,
        role: row.rol || "OPERADOR",
        permissions: {
          eliminar_ventas: Boolean(row.perm_delete_sales),
          modificar_precios: Boolean(row.perm_edit_prices),
          acceso_sql: Boolean(row.perm_sql),
          gestionar_usuarios: Boolean(row.perm_users)
        }
      }));
    }

    saveLocalBackup();
    updateSyncStatusBadge(true, "Supabase Conectado");
    renderLoginUserCards();
    renderAll();
    if (showFeedback) {
      showToast("Sincronizado en tiempo real con Supabase", "success");
    }
  } catch (err) {
    console.warn("Aviso al sincronizar con Supabase:", err);
    updateSyncStatusBadge(false, "Modo Local Activo");
    if (showFeedback) {
      showToast("Trabajando con caché local. Verifica conexión a internet.", "warning");
    }
  }
}

function loadLocalBackup() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      state.almacen = parsed.almacen || [];
      state.ventas = parsed.ventas || [];
      state.compras = parsed.compras || [];
      state.clientes = parsed.clientes || [];
      state.usuarios = (parsed.usuarios && parsed.usuarios.length > 0)
        ? parsed.usuarios
        : JSON.parse(JSON.stringify(INITIAL_USUARIOS));
    }
  } catch (e) {
    console.error("Error leyendo caché local:", e);
  }
}

function saveLocalBackup() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      almacen: state.almacen,
      ventas: state.ventas,
      compras: state.compras,
      clientes: state.clientes,
      usuarios: state.usuarios
    }));
    updateSidebarCounters();
  } catch (e) {
    console.error("Error guardando caché local:", e);
  }
}

// ============================================================================
// 5. AUTENTICACIÓN, TARJETAS DE ACCESO RÁPIDO E INACTIVIDAD CONFIGURABLE
// ============================================================================
function updateLoginLiveClock() {
  const now = new Date();
  const clockEl = document.getElementById("login-live-clock");
  const dateEl = document.getElementById("login-live-date");
  if (clockEl) {
    clockEl.textContent = now.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
  }
  if (dateEl) {
    dateEl.textContent = now.toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }
}

function renderLoginUserCards() {
  const wrap = document.getElementById("login-user-cards");
  if (!wrap) return;
  if (!adminConfig.privacy.showLoginCards) {
    wrap.classList.add("hidden");
    return;
  }
  wrap.classList.remove("hidden");

  wrap.innerHTML = state.usuarios.map(u => `
    <button
      type="button"
      onclick="selectLoginUserCard('${escHtml(u.username)}')"
      class="p-2.5 rounded-xl border border-gray-200 hover:border-amber-500 bg-gray-50/70 hover:bg-amber-50/40 flex items-center gap-2.5 text-left transition"
    >
      ${renderUserAvatarHtml(u.username)}
      <div class="min-w-0">
        <div class="font-bold text-gray-900 text-xs truncate font-sans">${escHtml(u.username)}</div>
        <div class="text-[10px] text-gray-500 truncate">${escHtml(u.role)}</div>
      </div>
    </button>
  `).join("");
}

function selectLoginUserCard(username) {
  const uInp = document.getElementById("login-username");
  const pInp = document.getElementById("login-password");
  if (uInp) uInp.value = username;
  if (pInp) {
    pInp.value = "";
    pInp.focus();
  }
}

function initLoginScreen() {
  updateLoginLiveClock();
  renderLoginUserCards();

  const rememberedUser = localStorage.getItem("anarosa_remembered_user");
  if (rememberedUser) {
    const uInp = document.getElementById("login-username");
    const remChk = document.getElementById("login-remember");
    if (uInp) uInp.value = rememberedUser;
    if (remChk) remChk.checked = true;
  }

  const savedLockout = Number(localStorage.getItem("anarosa_lockout_until") || 0);
  if (adminConfig.privacy.lockoutAfter3Tries && savedLockout > Date.now()) {
    loginLockoutUntil = savedLockout;
    failedLoginAttempts = 3;
    startLockoutCountdown();
  }
}

function togglePasswordVisibility(inputId, iconId) {
  const inp = document.getElementById(inputId);
  if (!inp) return;
  if (inp.type === "password") {
    inp.type = "text";
    setLucideIcon(iconId, "eye-off", "w-4 h-4");
  } else {
    inp.type = "password";
    setLucideIcon(iconId, "eye", "w-4 h-4");
  }
  refreshIcons();
}

function handleLoginSubmit(e) {
  e.preventDefault();
  if (adminConfig.privacy.lockoutAfter3Tries && Date.now() < loginLockoutUntil) return;

  const uInput = document.getElementById("login-username").value.trim();
  const pInput = document.getElementById("login-password").value;
  const remember = document.getElementById("login-remember").checked;

  const foundUser = state.usuarios.find(
    u => u.username.toLowerCase() === uInput.toLowerCase() && u.password === pInput
  );

  if (!foundUser) {
    failedLoginAttempts++;
    const ind = document.getElementById("login-attempts-indicator");
    if (ind) ind.textContent = `Intentos: ${failedLoginAttempts}/3`;
    const errBox = document.getElementById("login-error-msg");
    const errTxt = document.getElementById("login-error-text");

    if (adminConfig.privacy.lockoutAfter3Tries && failedLoginAttempts >= 3) {
      errBox.classList.add("hidden");
      loginLockoutUntil = Date.now() + 60 * 1000;
      localStorage.setItem("anarosa_lockout_until", String(loginLockoutUntil));
      startLockoutCountdown();
    } else {
      errBox.classList.remove("hidden");
      errTxt.textContent = adminConfig.privacy.lockoutAfter3Tries
        ? `Credenciales incorrectas. Te quedan ${Math.max(0, 3 - failedLoginAttempts)} intento(s) antes del bloqueo.`
        : "Usuario o contraseña incorrectos.";
    }
    return;
  }

  failedLoginAttempts = 0;
  localStorage.removeItem("anarosa_lockout_until");
  document.getElementById("login-error-msg").classList.add("hidden");
  document.getElementById("login-attempts-indicator").textContent = "Intentos: 0/3";

  if (remember) {
    localStorage.setItem("anarosa_remembered_user", foundUser.username);
  } else {
    localStorage.removeItem("anarosa_remembered_user");
  }

  loginAsUser(foundUser, false);
}

function startLockoutCountdown() {
  const banner = document.getElementById("login-lockout-banner");
  const timerEl = document.getElementById("login-lockout-timer");
  const uInp = document.getElementById("login-username");
  const pInp = document.getElementById("login-password");
  const btn = document.getElementById("login-submit-btn");

  banner.classList.remove("hidden");
  uInp.disabled = true;
  pInp.disabled = true;
  btn.disabled = true;

  if (loginLockoutInterval) clearInterval(loginLockoutInterval);

  const tick = () => {
    const diffSec = Math.ceil((loginLockoutUntil - Date.now()) / 1000);
    if (diffSec <= 0) {
      clearInterval(loginLockoutInterval);
      failedLoginAttempts = 0;
      localStorage.removeItem("anarosa_lockout_until");
      banner.classList.add("hidden");
      uInp.disabled = false;
      pInp.disabled = false;
      btn.disabled = false;
      document.getElementById("login-attempts-indicator").textContent = "Intentos: 0/3";
      showToast("Tiempo cumplido. Ya puedes volver a intentar.", "info");
    } else {
      const m = String(Math.floor(diffSec / 60)).padStart(2, "0");
      const s = String(diffSec % 60).padStart(2, "0");
      timerEl.textContent = `${m}:${s}`;
    }
  };
  tick();
  loginLockoutInterval = setInterval(tick, 1000);
}

function isUserAdmin(userObj) {
  if (!userObj) return false;
  const uname = String(userObj.username || "");
  return Boolean(
    uname.toUpperCase() === "WILLOSIRIS" ||
    uname.toLowerCase() === "admin" ||
    (userObj.permissions && (userObj.permissions.acceso_sql || userObj.permissions.gestionar_usuarios))
  );
}

function hasPermission(permKey) {
  if (!state.currentUser) return false;
  if (String(state.currentUser.username).toUpperCase() === "WILLOSIRIS") return true;
  return Boolean(state.currentUser.permissions && state.currentUser.permissions[permKey]);
}

function loginAsUser(userObj, isRestored = false) {
  state.currentUser = userObj;
  const isAdmin = isUserAdmin(userObj);
  state.supabaseGateUnlocked = isAdmin;
  state.tempPriceOverride = false;

  try {
    localStorage.setItem("anarosa_session_user", JSON.stringify({
      id: userObj.id,
      username: userObj.username,
      role: userObj.role,
      permissions: userObj.permissions
    }));
    if (!isRestored) {
      localStorage.setItem("anarosa_last_activity", String(Date.now()));
    }
  } catch (e) {}

  document.getElementById("login-screen").classList.add("hidden");
  document.getElementById("login-password").value = "";

  updateUserUI();
  startInactivityMonitor(isRestored);

  if (!isRestored) {
    syncFromSupabase(false);
    switchTab("inicio");
    showToast(`Bienvenido(a), ${userObj.username}`, "success");
  }
}

function updateUserUI() {
  if (!state.currentUser) return;
  document.getElementById("header-user-badge").textContent = state.currentUser.username;
  document.getElementById("header-role-badge").textContent = state.currentUser.role;

  const avEl = document.getElementById("header-user-avatar");
  if (avEl) {
    const url = getUserAvatarUrl(state.currentUser.username);
    avEl.innerHTML = url
      ? `<img src="${escHtml(url)}" alt="${escHtml(state.currentUser.username)}" />`
      : escHtml(getInitials(state.currentUser.username));
  }

  const isAdmin = isUserAdmin(state.currentUser);
  ["nav-categorias-gastos", "nav-administracion", "nav-supabase"].forEach(id => {
    const btn = document.getElementById(id);
    if (!btn) return;
    if (isAdmin) {
      btn.classList.remove("hidden");
      btn.classList.add("flex");
    } else {
      btn.classList.add("hidden");
      btn.classList.remove("flex");
    }
  });

  const unlocked = state.supabaseGateUnlocked || hasPermission("acceso_sql");
  setLucideIcon("nav-sql-lock-icon", unlocked ? "unlock" : "lock", unlocked ? "w-3.5 h-3.5 text-emerald-400" : "w-3.5 h-3.5 text-amber-400");

  refreshIcons();
}

function logoutToLoginScreen() {
  closeTouchNumpad();
  state.currentUser = null;
  isSessionLocked = false;
  try {
    localStorage.removeItem("anarosa_session_user");
    localStorage.removeItem("anarosa_last_activity");
  } catch (e) {}
  if (inactivityInterval) clearInterval(inactivityInterval);
  const lockEl = document.getElementById("inactivity-lock-screen");
  lockEl.classList.add("hidden");
  lockEl.classList.remove("flex");
  document.getElementById("login-screen").classList.remove("hidden");
  initLoginScreen();
}

function startInactivityMonitor(keepRemaining = false) {
  const limitSec = getInactivityLimitSeconds();
  const wrap = document.getElementById("inactivity-countdown-wrap");
  if (inactivityInterval) clearInterval(inactivityInterval);

  if (limitSec <= 0) {
    if (wrap) wrap.classList.add("hidden");
    return;
  }
  if (wrap) wrap.classList.remove("hidden");

  if (!keepRemaining || inactivityRemainingSeconds <= 0 || inactivityRemainingSeconds > limitSec) {
    inactivityRemainingSeconds = limitSec;
  }
  isSessionLocked = false;

  const updateDisp = () => {
    const m = String(Math.floor(inactivityRemainingSeconds / 60)).padStart(2, "0");
    const s = String(inactivityRemainingSeconds % 60).padStart(2, "0");
    const disp = document.getElementById("inactivity-countdown-display");
    if (disp) disp.textContent = `${m}:${s}`;
  };
  updateDisp();

  inactivityInterval = setInterval(() => {
    if (!state.currentUser || isSessionLocked) return;
    const currentLimit = getInactivityLimitSeconds();
    if (currentLimit <= 0) return;
    inactivityRemainingSeconds--;
    updateDisp();
    if (inactivityRemainingSeconds <= 0) {
      triggerInactivityLock();
    }
  }, 1000);
}

let lastActivityTouchMs = 0;
function resetInactivityTimer() {
  if (!state.currentUser || isSessionLocked) return;
  const now = Date.now();
  if (now - lastActivityTouchMs < 2000) return; // Evita escrituras innecesarias en mousemove
  lastActivityTouchMs = now;

  const limitSec = getInactivityLimitSeconds();
  if (limitSec <= 0) return;
  inactivityRemainingSeconds = limitSec;
  try {
    localStorage.setItem("anarosa_last_activity", String(now));
  } catch (e) {}
  const m = String(Math.floor(limitSec / 60)).padStart(2, "0");
  const s = String(limitSec % 60).padStart(2, "0");
  const disp = document.getElementById("inactivity-countdown-display");
  if (disp) disp.textContent = `${m}:${s}`;
}

["mousemove", "keydown", "click", "scroll", "touchstart"].forEach(evt => {
  window.addEventListener(evt, resetInactivityTimer, { passive: true });
});

function triggerInactivityLock() {
  if (!state.currentUser) return;
  closeTouchNumpad();
  isSessionLocked = true;
  document.getElementById("lock-screen-username").textContent = state.currentUser.username;
  document.getElementById("lock-screen-avatar-wrap").innerHTML = renderUserAvatarHtml(state.currentUser.username, true);
  document.getElementById("unlock-password").value = "";
  document.getElementById("unlock-error-msg").classList.add("hidden");
  const lockModal = document.getElementById("inactivity-lock-screen");
  lockModal.classList.remove("hidden");
  lockModal.classList.add("flex");
  refreshIcons();
}

function handleUnlockSession(e) {
  e.preventDefault();
  if (!state.currentUser) return;
  const pass = document.getElementById("unlock-password").value;
  const freshUser = state.usuarios.find(u => u.username.toLowerCase() === state.currentUser.username.toLowerCase()) || state.currentUser;
  if (pass === freshUser.password) {
    isSessionLocked = false;
    inactivityRemainingSeconds = getInactivityLimitSeconds() || 900;
    try {
      localStorage.setItem("anarosa_last_activity", String(Date.now()));
    } catch (e) {}
    const lockModal = document.getElementById("inactivity-lock-screen");
    lockModal.classList.add("hidden");
    lockModal.classList.remove("flex");
    showToast("Sesión desbloqueada", "success");
  } else {
    document.getElementById("unlock-error-msg").classList.remove("hidden");
  }
}

function restoreActiveSession() {
  const savedUserStr = localStorage.getItem("anarosa_session_user");
  if (!savedUserStr) return false;
  try {
    const savedUser = JSON.parse(savedUserStr);
    const lastActivity = Number(localStorage.getItem("anarosa_last_activity") || Date.now());
    const elapsedSeconds = Math.floor((Date.now() - lastActivity) / 1000);
    const savedTab = sessionStorage.getItem("anarosa_active_tab") || "inicio";
    const limitSec = getInactivityLimitSeconds();

    if (limitSec <= 0 || elapsedSeconds < limitSec) {
      inactivityRemainingSeconds = limitSec > 0 ? Math.max(1, limitSec - elapsedSeconds) : 0;
      loginAsUser(savedUser, true);
      switchTab(savedTab);
      return true;
    } else {
      inactivityRemainingSeconds = 0;
      loginAsUser(savedUser, true);
      switchTab(savedTab);
      triggerInactivityLock();
      return true;
    }
  } catch (e) {
    return false;
  }
}

function requestAdminAuthorization(reasonText, onAuthorizedCallback) {
  pendingAdminCallback = onAuthorizedCallback;
  document.getElementById("admin-auth-reason").textContent = reasonText;
  document.getElementById("admin-auth-pass").value = "";
  const m = document.getElementById("modal-admin-auth");
  m.classList.remove("hidden");
  m.classList.add("flex");
}

function closeAdminAuthModal() {
  pendingAdminCallback = null;
  const m = document.getElementById("modal-admin-auth");
  m.classList.add("hidden");
  m.classList.remove("flex");
}

function handleAdminAuthSubmit(e) {
  e.preventDefault();
  const u = document.getElementById("admin-auth-user").value.trim();
  const p = document.getElementById("admin-auth-pass").value;

  const adminUser = state.usuarios.find(
    usr => usr.username.toLowerCase() === u.toLowerCase() && usr.password === p &&
    (isUserAdmin(usr) || usr.permissions.eliminar_ventas || usr.permissions.modificar_precios)
  );

  if (!adminUser) {
    showToast("Credenciales de Administrador no válidas", "warning");
    return;
  }

  const cb = pendingAdminCallback;
  closeAdminAuthModal();
  if (typeof cb === "function") cb();
}

// ============================================================================
// 6. REGLA GLOBAL DE MAYÚSCULAS Y TECLADO NUMÉRICO TÁCTIL INTELIGENTE
// ============================================================================
function isKeepCaseInput(el) {
  if (!el || !el.tagName) return true;
  if (el.dataset && el.dataset.keepCase === "true") return true;
  const tag = el.tagName.toUpperCase();
  if (tag !== "INPUT" && tag !== "TEXTAREA") return true;
  const type = (el.type || "text").toLowerCase();
  const excludedTypes = ["password", "number", "date", "month", "time", "url", "email", "file", "range", "color", "checkbox", "radio", "hidden"];
  return excludedTypes.includes(type);
}

document.addEventListener("input", e => {
  const el = e.target;
  if (isKeepCaseInput(el)) return;
  const val = el.value;
  const upper = val.toUpperCase();
  if (val !== upper) {
    const start = el.selectionStart;
    const end = el.selectionEnd;
    el.value = upper;
    if (typeof start === "number" && typeof end === "number") {
      try { el.setSelectionRange(start, end); } catch (_) {}
    }
  }
}, true);

// Controlador del Teclado Numérico Táctil (Aparece en pantallas táctiles, oculto en PC)
let activeNumpadInput = null;
let activeNumpadMode = "decimal";
let numpadBuffer = "";
let nativeBypassSet = new WeakSet();

function isTouchScreenDevice() {
  return Boolean(
    (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) ||
    navigator.maxTouchPoints > 0
  );
}

function shouldOpenTouchNumpad() {
  const mode = adminConfig.workflow.numpadMode || "AUTO_TOUCH";
  if (mode === "NATIVE_ONLY") return false;
  if (mode === "ALWAYS") return true;
  return isTouchScreenDevice();
}

function openTouchNumpadForInput(inputOrId, modeOverride = null) {
  const inp = typeof inputOrId === "string" ? document.getElementById(inputOrId) : inputOrId;
  if (!inp || inp.disabled || inp.readOnly) return;

  activeNumpadInput = inp;
  activeNumpadMode = modeOverride || inp.dataset.numpad || "decimal";
  numpadBuffer = String(inp.value ?? "");

  if (!nativeBypassSet.has(inp) && isTouchScreenDevice()) {
    inp.setAttribute("inputmode", "none");
  }

  const lbl = inp.dataset.numpadLabel || inp.placeholder || "INGRESAR NÚMERO";
  document.getElementById("numpad-field-label").textContent = lbl.toUpperCase();
  document.getElementById("numpad-live-value").textContent = numpadBuffer || "0";

  const dotBtn = document.getElementById("numpad-dot-btn");
  if (dotBtn) dotBtn.disabled = activeNumpadMode === "integer";

  const sheet = document.getElementById("touch-numpad");
  sheet.classList.add("open");
  sheet.setAttribute("aria-hidden", "false");
}

function closeTouchNumpad() {
  const sheet = document.getElementById("touch-numpad");
  if (sheet) {
    sheet.classList.remove("open");
    sheet.setAttribute("aria-hidden", "true");
  }
  if (activeNumpadInput) {
    if (numpadBuffer.endsWith(".")) {
      activeNumpadInput.value = numpadBuffer.slice(0, -1);
    }
    activeNumpadInput.dispatchEvent(new Event("change", { bubbles: true }));
    activeNumpadInput = null;
  }
  numpadBuffer = "";
}

function switchNumpadToNativeKeyboard() {
  if (!activeNumpadInput) return;
  const inp = activeNumpadInput;
  nativeBypassSet.add(inp);
  inp.setAttribute("inputmode", activeNumpadMode === "integer" ? "numeric" : "decimal");
  closeTouchNumpad();
  setTimeout(() => inp.focus(), 40);
}

function pressNumpadKey(key) {
  if (!activeNumpadInput) return;
  let cur = numpadBuffer;
  if (cur === "0" && key !== "." && key !== "BACK" && key !== "CLEAR") {
    cur = "";
  }
  if (key === "CLEAR") {
    cur = "";
  } else if (key === "BACK") {
    cur = cur.slice(0, -1);
  } else if (key === ".") {
    if (activeNumpadMode === "integer") return;
    if (!cur.includes(".")) cur = (cur || "0") + ".";
  } else {
    cur += key;
  }

  numpadBuffer = cur;
  activeNumpadInput.value = cur.endsWith(".") ? cur.slice(0, -1) : cur;
  document.getElementById("numpad-live-value").textContent = cur || "0";
  activeNumpadInput.dispatchEvent(new Event("input", { bubbles: true }));
}

function pressNumpadQuickAdd(amount) {
  if (!activeNumpadInput) return;
  const cur = Number(numpadBuffer || activeNumpadInput.value) || 0;
  const next = activeNumpadMode === "integer" ? Math.round(cur + amount) : Number((cur + amount).toFixed(2));
  numpadBuffer = String(next);
  activeNumpadInput.value = numpadBuffer;
  document.getElementById("numpad-live-value").textContent = numpadBuffer;
  activeNumpadInput.dispatchEvent(new Event("input", { bubbles: true }));
}

document.addEventListener("focusin", e => {
  const inp = e.target;
  if (!inp || !inp.dataset || !inp.dataset.numpad) return;
  if (inp.readOnly || inp.disabled || nativeBypassSet.has(inp)) return;
  if (shouldOpenTouchNumpad()) {
    openTouchNumpadForInput(inp);
  } else {
    inp.setAttribute("inputmode", inp.dataset.numpad === "integer" ? "numeric" : "decimal");
  }
});

document.addEventListener("pointerdown", e => {
  const sheet = document.getElementById("touch-numpad");
  if (!sheet || !sheet.classList.contains("open")) return;
  if (sheet.contains(e.target)) return;
  if (e.target && e.target.closest && e.target.closest("[data-numpad]")) return;
  closeTouchNumpad();
});

// ============================================================================
// 7. UTILIDADES, TOASTS Y NAVEGACIÓN FLUIDA DE PESTAÑAS
// ============================================================================
function formatMoney(num) {
  const n = Number(num) || 0;
  return "S/ " + n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDatePE(isoStr) {
  if (!isoStr) return "-";
  const parts = String(isoStr).slice(0, 10).split("-");
  if (parts.length !== 3) return isoStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function getTodayLocalISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const el = document.createElement("div");
  const dotColor = type === "success" ? "bg-emerald-400" : type === "warning" ? "bg-amber-400" : "bg-sky-400";
  el.className = "bg-[#0c1424] text-white text-xs px-4 py-3 rounded-2xl shadow-lg border border-slate-700/80 flex items-center gap-2.5 view-enter pointer-events-auto max-w-sm";
  el.innerHTML = `
    <span class="w-2.5 h-2.5 rounded-full ${dotColor} flex-shrink-0"></span>
    <span class="font-medium">${escHtml(message)}</span>
  `;
  container.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transform = "translate3d(0, 8px, 0)";
    el.style.transition = "opacity 200ms ease, transform 200ms ease";
    setTimeout(() => el.remove(), 220);
  }, 3000);
}

function toggleFontStyle() {
  state.fontEditorial = !state.fontEditorial;
  document.body.classList.toggle("font-editorial", state.fontEditorial);
  const lbl = document.getElementById("font-toggle-label");
  if (lbl) lbl.textContent = state.fontEditorial ? "Fuente: Editorial" : "Fuente: Moderna";
}

function toggleMobileSidebar() {
  const sb = document.getElementById("sidebar");
  if (!sb) return;
  sb.classList.toggle("hidden");
  sb.classList.toggle("fixed");
  sb.classList.toggle("inset-0");
}

const ALL_TABS = [
  "inicio", "buscar", "registrar-venta", "historial-ventas",
  "almacen", "clientes", "billetera", "categorias-gastos",
  "administracion", "supabase"
];

function switchTab(tabName) {
  if (tabName === "usuarios") tabName = "administracion"; // Compatibilidad retroactiva
  if (!ALL_TABS.includes(tabName)) tabName = "inicio";

  const isAdmin = isUserAdmin(state.currentUser);
  const adminOnlyTabs = ["categorias-gastos", "administracion", "supabase"];

  if (adminOnlyTabs.includes(tabName) && !isAdmin) {
    showToast("Módulo reservado exclusivamente para el Administrador", "warning");
    return;
  }

  closeTouchNumpad();
  state.currentTab = tabName;
  try {
    sessionStorage.setItem("anarosa_active_tab", tabName);
  } catch (e) {}

  ALL_TABS.forEach(t => {
    const view = document.getElementById(`view-${t}`);
    const navBtn = document.getElementById(`nav-${t}`);
    if (!view || !navBtn) return;

    const isHiddenNav = adminOnlyTabs.includes(t) && !isAdmin;
    if (t === tabName) {
      view.classList.remove("hidden", "view-enter");
      void view.offsetWidth;
      view.classList.add("view-enter");
      navBtn.className = `w-full ${isHiddenNav ? "hidden" : "flex"} items-center gap-3 px-3.5 py-2.5 rounded-xl bg-amber-500 text-[#090d16] font-bold shadow-sm transition text-left`;
    } else {
      view.classList.add("hidden");
      navBtn.className = `w-full ${isHiddenNav ? "hidden" : "flex"} items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white transition text-left`;
    }
  });

  document.querySelectorAll(".mobile-nav-btn[data-mobnav]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.mobnav === tabName);
  });

  if (window.innerWidth < 768) {
    const sb = document.getElementById("sidebar");
    sb.classList.add("hidden");
    sb.classList.remove("fixed", "inset-0");
  }

  resetTabForms(tabName);
  renderActiveTab();
  window.scrollTo({ top: 0, behavior: "smooth" });
  observeScrollReveals();
}

function resetTabForms(tabName) {
  if (tabName === "registrar-venta") {
    clearPosForm(true);
  } else if (tabName === "almacen") {
    const compraFecha = document.getElementById("compra-fecha");
    if (compraFecha && !compraFecha.value) compraFecha.value = getTodayLocalISO();
    updateCompraTotalPreview();
  } else if (tabName === "historial-ventas") {
    const dayPicker = document.getElementById("report-day-picker");
    if (dayPicker && !dayPicker.value) dayPicker.value = getTodayLocalISO();
    const monthPicker = document.getElementById("report-month-picker");
    if (monthPicker && !monthPicker.value) monthPicker.value = getTodayLocalISO().slice(0, 7);
  } else if (tabName === "billetera") {
    const wDate = document.getElementById("wallet-date");
    if (wDate && !wDate.value) wDate.value = getTodayLocalISO();
  }
}

function updateSidebarCounters() {
  const totalItems = state.almacen.length;
  const totalUnits = state.almacen.reduce((acc, item) => acc + (Number(item.stock) || 0), 0);
  const pendingSalesCount = state.ventas.filter(v => v.estado === "Por Cancelar").length;
  const debtMap = getClientDebtMap();
  const clientsWithDebtCount = Object.values(debtMap).filter(d => d.saldo > 0 || d.pendingCount > 0).length;

  const setEl = (id, txt) => {
    const el = document.getElementById(id);
    if (el) el.textContent = txt;
  };
  setEl("sidebar-total-items", totalItems);
  setEl("sidebar-total-units", `${totalUnits} und.`);
  setEl("badge-por-cancelar", pendingSalesCount);
  setEl("badge-clientes-deuda", clientsWithDebtCount);
  setEl("badge-cart-count", state.posCart.reduce((s, i) => s + i.cantidad, 0));
}

function renderActiveTab() {
  updateSidebarCounters();
  const t = state.currentTab;
  if (t === "inicio") renderInicio();
  else if (t === "buscar") { populateMarcasFilter(); renderBuscarCatalog(); }
  else if (t === "registrar-venta") renderPosView();
  else if (t === "historial-ventas") { populateVentasFilterDropdowns(); renderVentasTable(); }
  else if (t === "almacen") renderAlmacenView();
  else if (t === "clientes") renderClientesView();
  else if (t === "billetera") renderWalletView();
  else if (t === "categorias-gastos") renderWalletCategoriesAdminView();
  else if (t === "administracion") renderAdministracionView();
  else if (t === "supabase") renderSupabaseView();
  refreshIcons();
}

function renderAll() {
  renderActiveTab();
}

// ============================================================================
// 8. MÓDULOS COMERCIALES ANAROSA (INICIO, BUSCAR, POS, VENTAS, ALMACÉN, CLIENTES)
// ============================================================================
function getClientDebtMap() {
  const map = {};
  state.ventas.forEach(v => {
    const total = Number(v.total) || 0;
    const pagado = Number(v.pagado) || 0;
    const saldo = Math.max(0, total - pagado);
    const key = (v.cliente || "OTROS").toUpperCase();
    if (!map[key]) {
      map[key] = { codigo: key, totalComprado: 0, totalPagado: 0, saldo: 0, pendingCount: 0 };
    }
    map[key].totalComprado += total;
    map[key].totalPagado += pagado;
    map[key].saldo += saldo;
    if (v.estado === "Por Cancelar") map[key].pendingCount += 1;
  });
  return map;
}

const PERIOD_LIST = ["ALL", "2026-08", "2026-09", "2026-10", "2026-11", "2026-12"];

function onDashboardPeriodChange(val) {
  state.dashboardPeriod = val;
  renderInicio();
}

function changeDashboardMonth(dir) {
  const idx = Math.max(0, PERIOD_LIST.indexOf(state.dashboardPeriod));
  const nextIdx = (idx + dir + PERIOD_LIST.length) % PERIOD_LIST.length;
  state.dashboardPeriod = PERIOD_LIST[nextIdx];
  document.getElementById("dashboard-period-select").value = state.dashboardPeriod;
  renderInicio();
}

function getProductCost(descripcion) {
  const found = state.almacen.find(a => a.descripcion.toUpperCase() === (descripcion || "").toUpperCase());
  return found ? (Number(found.pCompra) || 0) : 0;
}

function renderInicio() {
  const period = state.dashboardPeriod;
  const filteredVentas = period === "ALL" ? state.ventas : state.ventas.filter(v => (v.fecha || "").startsWith(period));
  const filteredCompras = period === "ALL" ? state.compras : state.compras.filter(c => (c.fecha || "").startsWith(period));

  const debtMap = getClientDebtMap();
  const pendingClients = Object.values(debtMap).filter(d => d.saldo > 0 || d.pendingCount > 0);
  const pendingContainer = document.getElementById("dashboard-pending-clients-links");

  if (pendingClients.length === 0) {
    pendingContainer.innerHTML = `<span class="text-emerald-700 font-semibold">Sin deudas pendientes registradas.</span>`;
  } else {
    pendingContainer.innerHTML = pendingClients.map(info => {
      const label = info.saldo > 0 ? `${info.codigo} (Debe: ${formatMoney(info.saldo)})` : `${info.codigo} (Por Cancelar)`;
      return `<button onclick="jumpToClientSales('${escHtml(info.codigo)}')" class="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100 font-semibold transition">${escHtml(label)}</button>`;
    }).join("");
  }

  const totalFacturado = filteredVentas.reduce((acc, v) => acc + (Number(v.total) || 0), 0);
  const totalCobrado = filteredVentas.reduce((acc, v) => acc + (Number(v.pagado) || 0), 0);
  const totalPendiente = Math.max(0, totalFacturado - totalCobrado);

  const costoRepuestosVendidos = filteredVentas.reduce((acc, v) => acc + getProductCost(v.descripcion) * (Number(v.cantidad) || 1), 0);
  const gastosExtra = filteredCompras.reduce((acc, c) => acc + (Number(c.total) || 0), 0);
  const costoTotalPeriodo = costoRepuestosVendidos + gastosExtra;
  const utilidadBruta = totalFacturado - costoRepuestosVendidos;

  const capitalStockActual = state.almacen.reduce((acc, a) => acc + (Number(a.stock) || 0) * (Number(a.pCompra) || 0), 0);
  const valorVentaStockActual = state.almacen.reduce((acc, a) => acc + (Number(a.stock) || 0) * (Number(a.pVenta) || 0), 0);

  document.getElementById("kpi-ventas-count").textContent = `${filteredVentas.length} reg.`;
  document.getElementById("kpi-ventas-total").textContent = formatMoney(totalFacturado);
  document.getElementById("kpi-ventas-cobrado").textContent = formatMoney(totalCobrado);
  document.getElementById("kpi-ventas-pendiente").textContent = formatMoney(totalPendiente);

  document.getElementById("kpi-compras-total").textContent = formatMoney(costoTotalPeriodo);
  document.getElementById("kpi-capital-stock").textContent = formatMoney(capitalStockActual);
  document.getElementById("kpi-gastos-extra").textContent = formatMoney(gastosExtra);

  document.getElementById("kpi-balance-neto").textContent = formatMoney(utilidadBruta);
  const margenPct = totalFacturado > 0 ? ((utilidadBruta / totalFacturado) * 100).toFixed(1) : "0.0";
  document.getElementById("kpi-margen-pct").textContent = `${Number(margenPct) >= 0 ? "+" : ""}${margenPct}% margen`;
  document.getElementById("kpi-valor-venta-stock").textContent = formatMoney(valorVentaStockActual);

  render12MonthsChart();
  renderBottomCharts(filteredVentas);
}

function jumpToClientSales(clienteCode) {
  switchTab("historial-ventas");
  populateVentasFilterDropdowns();
  document.getElementById("filter-ventas-cliente").value = clienteCode;
  document.getElementById("filter-ventas-estado").value = "Por Cancelar";
  renderVentasTable();
  showToast(`Filtrando cuentas de ${clienteCode}`, "info");
}

function render12MonthsChart() {
  const months = [
    { key: "2026-01", label: "Ene" }, { key: "2026-02", label: "Feb" }, { key: "2026-03", label: "Mar" },
    { key: "2026-04", label: "Abr" }, { key: "2026-05", label: "May" }, { key: "2026-06", label: "Jun" },
    { key: "2026-07", label: "Jul" }, { key: "2026-08", label: "Ago" }, { key: "2026-09", label: "Sep" },
    { key: "2026-10", label: "Oct" }, { key: "2026-11", label: "Nov" }, { key: "2026-12", label: "Dic" }
  ];

  const dataPerMonth = months.map(m => {
    const mVentas = state.ventas.filter(v => (v.fecha || "").startsWith(m.key));
    const mCompras = state.compras.filter(c => (c.fecha || "").startsWith(m.key));
    const ventasSum = mVentas.reduce((acc, v) => acc + (Number(v.total) || 0), 0);
    const cobradoSum = mVentas.reduce((acc, v) => acc + (Number(v.pagado) || 0), 0);
    const costoSum = mVentas.reduce((acc, v) => acc + getProductCost(v.descripcion) * (Number(v.cantidad) || 1), 0)
      + mCompras.reduce((acc, c) => acc + (Number(c.total) || 0), 0);
    return { ...m, ventasSum, cobradoSum, costoSum };
  });

  const maxVal = Math.max(500, ...dataPerMonth.map(d => Math.max(d.ventasSum, d.costoSum)));
  const yMax = Math.ceil(maxVal / 100) * 100;
  const container = document.getElementById("chart-12-months");
  const ySteps = [yMax, yMax * 0.75, yMax * 0.5, yMax * 0.25, 0];

  container.innerHTML = `
    <div class="absolute inset-x-10 top-4 bottom-6 flex flex-col justify-between pointer-events-none">
      ${ySteps.map(val => `
        <div class="w-full border-b border-gray-100 relative flex items-center">
          <span class="absolute -left-10 text-[10px] text-gray-400 w-9 text-right tabular">S/${Math.round(val)}</span>
        </div>
      `).join("")}
    </div>
    <div class="relative z-10 flex-1 grid grid-cols-12 gap-2 items-end h-full pt-2">
      ${dataPerMonth.map(d => {
        const hVentas = yMax > 0 ? Math.round((d.ventasSum / yMax) * 100) : 0;
        const hCosto = yMax > 0 ? Math.round((d.costoSum / yMax) * 100) : 0;
        const hCobrado = yMax > 0 ? Math.round((d.cobradoSum / yMax) * 100) : 0;
        return `
          <div class="flex flex-col items-center h-full justify-end group relative">
            <div class="opacity-0 group-hover:opacity-100 transition pointer-events-none absolute -top-11 bg-[#090d16] text-white text-[10px] rounded-lg px-2 py-1 whitespace-nowrap z-20 shadow">
              ${d.label}: Ventas ${formatMoney(d.ventasSum)} · Cobrado ${formatMoney(d.cobradoSum)}
            </div>
            <div class="w-full flex items-end justify-center gap-1 h-full">
              <div style="height: ${hCosto}%" class="w-2.5 bg-[#ef4444] rounded-t"></div>
              <div style="height: ${hVentas}%" class="w-3 bg-[#2563eb] rounded-t"></div>
              <div style="height: ${hCobrado}%" class="w-2.5 bg-[#10b981] rounded-t"></div>
            </div>
            <span class="text-[10px] text-gray-500 mt-2 font-medium">${d.label}</span>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function renderBottomCharts(filteredVentas) {
  const clientStats = {};
  filteredVentas.forEach(v => {
    if (!clientStats[v.cliente]) clientStats[v.cliente] = { total: 0, pendiente: 0 };
    const tot = Number(v.total) || 0;
    const pag = Number(v.pagado) || 0;
    clientStats[v.cliente].total += tot;
    clientStats[v.cliente].pendiente += Math.max(0, tot - pag);
  });

  const sortedClients = Object.entries(clientStats).sort((a, b) => b[1].total - a[1].total).slice(0, 8);
  const maxClientTotal = Math.max(100, ...sortedClients.map(c => c[1].total));
  const clientContainer = document.getElementById("chart-clientes-bars");

  if (sortedClients.length === 0) {
    clientContainer.innerHTML = `<p class="text-xs text-gray-500">Aún no hay ventas registradas en este periodo.</p>`;
  } else {
    clientContainer.innerHTML = sortedClients.map(([cli, st]) => {
      const pctTotal = Math.round((st.total / maxClientTotal) * 100);
      const pctDebt = Math.round((st.pendiente / maxClientTotal) * 100);
      const clientObj = state.clientes.find(c => c.codigo === cli);
      const origenTag = clientObj ? clientObj.origen : "OTROS";
      return `
        <div onclick="jumpToClientSales('${escHtml(cli)}')" class="cursor-pointer group">
          <div class="flex items-center justify-between text-xs mb-1">
            <span class="font-semibold text-gray-800 group-hover:underline">${escHtml(cli)} <span class="text-[10px] text-gray-400">(${escHtml(origenTag)})</span></span>
            <span class="text-gray-700 tabular">
              <strong>${formatMoney(st.total)}</strong>
              ${st.pendiente > 0 ? `<span class="text-amber-700 ml-1">(Debe ${formatMoney(st.pendiente)})</span>` : `<span class="text-emerald-700 ml-1">(Al día)</span>`}
            </span>
          </div>
          <div class="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden flex">
            <div style="width: ${Math.max(0, pctTotal - pctDebt)}%" class="bg-[#10b981] h-full"></div>
            <div style="width: ${pctDebt}%" class="bg-[#f59e0b] h-full"></div>
          </div>
        </div>
      `;
    }).join("");
  }

  const prodStats = {};
  filteredVentas.forEach(v => {
    prodStats[v.descripcion] = (prodStats[v.descripcion] || 0) + (Number(v.total) || 0);
  });
  const sortedProds = Object.entries(prodStats).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxProdVal = Math.max(100, ...sortedProds.map(p => p[1]));
  const prodContainer = document.getElementById("chart-repuestos-bars");

  if (sortedProds.length === 0) {
    prodContainer.innerHTML = `<p class="text-xs text-gray-500">Sin repuestos vendidos en este periodo.</p>`;
  } else {
    const barColors = ["bg-[#2563eb]", "bg-[#d97706]", "bg-[#059669]", "bg-[#0284c7]", "bg-[#4f46e5]"];
    prodContainer.innerHTML = sortedProds.map(([prodName, amount], idx) => {
      const pct = Math.max(4, Math.round((amount / maxProdVal) * 100));
      const color = barColors[idx % barColors.length];
      return `
        <div class="grid grid-cols-12 items-center gap-2 text-xs">
          <div class="col-span-5 text-right pr-2 text-[11px] text-gray-600 truncate" title="${escHtml(prodName)}">${escHtml(prodName)}</div>
          <div class="col-span-5 bg-gray-100 h-3 rounded-full overflow-hidden">
            <div style="width: ${pct}%" class="${color} h-full rounded-full"></div>
          </div>
          <div class="col-span-2 text-right font-bold text-gray-800 text-[11px] tabular">${formatMoney(amount)}</div>
        </div>
      `;
    }).join("");
  }
}

// BUSCAR CATÁLOGO (CON DEBOUNCE SIN LAG)
function scheduleRenderBuscarCatalog() {
  if (buscarDebounceTimer) clearTimeout(buscarDebounceTimer);
  buscarDebounceTimer = setTimeout(renderBuscarCatalog, 60);
}

function populateMarcasFilter() {
  const select = document.getElementById("buscar-marca");
  if (!select) return;
  const currentVal = select.value;
  const marcasSet = new Set(["UNIVERSAL", "VOLKSWAGEN", "RENAULT", "RENAULT MASTER", "MULTIMARCA"]);
  state.almacen.forEach(item => {
    if (item.compatibilidad && item.compatibilidad.trim()) {
      marcasSet.add(item.compatibilidad.trim().toUpperCase());
    }
  });
  const marcasArr = Array.from(marcasSet).sort();
  select.innerHTML = `<option value="ALL">TODAS LAS MARCAS</option>` + marcasArr.map(m => `<option value="${escHtml(m)}">${escHtml(m)}</option>`).join("");
  if (currentVal && (currentVal === "ALL" || marcasSet.has(currentVal))) select.value = currentVal;
}

function renderBuscarCatalog() {
  const q = (document.getElementById("buscar-query")?.value || "").toLowerCase().trim();
  const codigoFilter = (document.getElementById("buscar-codigo-filter")?.value || "").toUpperCase().trim();
  const marcaFilter = document.getElementById("buscar-marca")?.value || "ALL";
  const stockFilter = document.getElementById("buscar-stock-filter")?.value || "ALL";
  const lowLimit = Number(adminConfig.workflow.lowStockThreshold) || 3;

  const results = state.almacen.filter(item => {
    const itemCod = (item.codigo || `COD${String(item.id).padStart(7, "0")}`).toUpperCase();
    if (codigoFilter && !itemCod.includes(codigoFilter)) return false;
    if (marcaFilter !== "ALL" && !(item.compatibilidad || "").toUpperCase().includes(marcaFilter)) return false;
    if (stockFilter === "NORMAL" && item.stock <= lowLimit) return false;
    if (stockFilter === "LOW" && item.stock > lowLimit) return false;
    if (q) {
      const hay = `${item.id} ${itemCod} ${item.descripcion} ${item.compatibilidad} ${item.detalles || ""} ${item.observacion || ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const grid = document.getElementById("buscar-results-grid");
  if (results.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full app-surface p-10 text-center text-gray-500 text-xs space-y-3">
        <p>No se encontraron repuestos con el filtro actual.</p>
        <button onclick="switchTab('almacen'); openProductModal();" class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl btn-accent">
          + Registrar Repuesto en Almacén
        </button>
      </div>
    `;
    return;
  }

  const canManageCatalog = hasPermission("modificar_precios") || isUserAdmin(state.currentUser);

  grid.innerHTML = results.map(item => {
    const isLow = item.stock <= lowLimit;
    const stockBadge = isLow
      ? "bg-red-100 text-red-800 border-red-200"
      : item.stock <= lowLimit * 2
        ? "bg-amber-50 text-amber-800 border-amber-200"
        : "bg-emerald-50 text-emerald-800 border-emerald-200";
    const displayCode = item.codigo || `COD${String(item.id).padStart(7, "0")}`;

    return `
      <div class="app-surface card-lift p-5 flex flex-col justify-between">
        <div>
          <div class="flex items-start justify-between gap-2 mb-2">
            <span class="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-mono text-[10px] font-bold tracking-wider uppercase">
              ${escHtml(displayCode)} · ${escHtml(item.compatibilidad)}
            </span>
            <span class="px-2.5 py-0.5 rounded-full border text-xs font-bold tabular ${stockBadge}">
              Stock: ${item.stock} ${escHtml(item.und)}
            </span>
          </div>
          <h3 class="text-sm font-bold text-gray-900 leading-snug">${escHtml(item.descripcion)}</h3>
          <div class="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs">
            <div class="bg-gray-50 rounded-xl p-2.5 border border-gray-100">
              <span class="text-[10px] text-gray-500 block">Precio Venta</span>
              <span class="text-base font-bold text-gray-900 tabular">${formatMoney(item.pVenta)}</span>
            </div>
            <div class="bg-gray-50 rounded-xl p-2.5 border border-gray-100">
              <span class="text-[10px] text-gray-500 block">Compatibilidad</span>
              <span class="text-xs font-bold text-gray-800">${escHtml(item.compatibilidad)}</span>
            </div>
          </div>
          <div class="mt-3 space-y-1 text-xs text-gray-600">
            <div><strong class="text-gray-800">Detalles:</strong> ${escHtml(item.detalles || "SIN DETALLES")}</div>
            <div><strong class="text-gray-800">Obs:</strong> <span class="${isLow ? "text-red-600 font-medium" : "text-gray-600"}">${escHtml(item.observacion || "-")}</span></div>
          </div>
        </div>
        <div class="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
          ${canManageCatalog
            ? `<button onclick="confirmarEdicionProducto(${item.id})" class="px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs text-gray-700 font-medium">Editar Ficha</button>`
            : `<span class="text-[11px] text-gray-400">Consulta rápida</span>`}
          <button onclick="addProductToPosAndGo(${item.id})" class="px-3.5 py-1.5 rounded-xl btn-accent text-xs flex items-center gap-1.5">
            <i data-lucide="shopping-cart" class="w-3.5 h-3.5"></i>
            <span>Vender Ahora</span>
          </button>
        </div>
      </div>
    `;
  }).join("");
  refreshIcons();
}

function addProductToPosAndGo(prodId) {
  addProductToPosCart(prodId);
  switchTab("registrar-venta");
}

// PUNTO DE VENTA (POS)
function scheduleRenderPosPicker() {
  if (posPickerDebounceTimer) clearTimeout(posPickerDebounceTimer);
  posPickerDebounceTimer = setTimeout(renderPosProductPicker, 50);
}

function renderPosView() {
  const fechaInput = document.getElementById("pos-fecha");
  if (fechaInput && !fechaInput.value) fechaInput.value = getTodayLocalISO();
  renderPosProductPicker();
  renderPosCartTable();
}

function clearPosForm(keepCart = false) {
  if (!keepCart) state.posCart = [];
  state.posSelectedClient = null;

  const searchInput = document.getElementById("pos-client-search-input");
  const codInput = document.getElementById("pos-client-codigo");
  const oriInput = document.getElementById("pos-client-origen");
  const nomInput = document.getElementById("pos-client-nombre");
  const debtAlert = document.getElementById("pos-selected-client-debt-alert");
  const modeBadge = document.getElementById("pos-manual-mode-badge");

  if (searchInput) searchInput.value = "";
  [codInput, oriInput, nomInput].forEach(inp => {
    if (inp) {
      inp.value = "";
      inp.setAttribute("readonly", "true");
    }
  });
  if (debtAlert) debtAlert.classList.add("hidden");
  if (modeBadge) {
    modeBadge.textContent = "Pendiente de selección";
    modeBadge.className = "text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-500";
  }

  const fechaInput = document.getElementById("pos-fecha");
  if (fechaInput) fechaInput.value = getTodayLocalISO();
  const obsInput = document.getElementById("pos-observacion");
  if (obsInput) obsInput.value = "";

  const defaultMode = adminConfig.workflow.defaultPayMode || "CREDITO";
  const payModeSelect = document.getElementById("pos-payment-mode");
  if (payModeSelect) {
    payModeSelect.value = defaultMode;
    onPosPaymentModeChange(defaultMode);
  }
  const adelantoInput = document.getElementById("pos-adelanto-input");
  if (adelantoInput) adelantoInput.value = "0";
  const prodSearch = document.getElementById("pos-product-search");
  if (prodSearch) prodSearch.value = "";

  updateSidebarCounters();
  renderPosProductPicker();
  renderPosCartTable();
}

function renderPosProductPicker() {
  const q = (document.getElementById("pos-product-search")?.value || "").toLowerCase().trim();
  const listEl = document.getElementById("pos-product-list");
  if (!listEl) return;

  const strictStock = (adminConfig.workflow.stockMode || "STRICT") === "STRICT";
  const lowLimit = Number(adminConfig.workflow.lowStockThreshold) || 3;

  const matches = state.almacen.filter(a => {
    if (!q) return true;
    return `${a.codigo || ""} ${a.descripcion} ${a.compatibilidad} ${a.detalles || ""}`.toLowerCase().includes(q);
  });

  if (matches.length === 0) {
    listEl.innerHTML = `<div class="p-4 text-center text-xs text-gray-400">Sin repuestos coincidentes en almacén.</div>`;
    return;
  }

  listEl.innerHTML = matches.map(prod => {
    const inCart = state.posCart.find(c => c.productId === prod.id);
    const blocked = strictStock && prod.stock <= 0;
    return `
      <div class="p-2.5 px-3.5 hover:bg-gray-50 flex items-center justify-between gap-3 text-xs transition">
        <div class="min-w-0 flex-1">
          <div class="font-bold text-gray-900 truncate">${escHtml(prod.descripcion)}</div>
          <div class="text-[11px] text-gray-500 flex flex-wrap items-center gap-2 mt-0.5">
            <span class="px-1.5 py-0.5 bg-gray-100 rounded text-gray-700 font-mono text-[10px]">${escHtml(prod.compatibilidad)}</span>
            <span>Stock: <strong class="${prod.stock <= lowLimit ? "text-red-600" : "text-emerald-700"} tabular">${prod.stock} ${escHtml(prod.und)}</strong></span>
            ${inCart ? `<span class="text-blue-700 font-bold">(En lista: ${inCart.cantidad})</span>` : ""}
          </div>
        </div>
        <div class="flex items-center gap-3 flex-shrink-0">
          <div class="text-right tabular">
            <div class="font-bold text-gray-900">${formatMoney(prod.pVenta)}</div>
            <div class="text-[10px] text-gray-400">c/u</div>
          </div>
          <button
            type="button"
            onclick="addProductToPosCart(${prod.id})"
            ${blocked ? "disabled" : ""}
            class="px-3 py-1.5 rounded-xl ${blocked ? "bg-gray-200 text-gray-400" : "btn-brand"} text-xs flex items-center gap-1"
          >
            <i data-lucide="plus" class="w-3.5 h-3.5"></i>
            <span>Agregar</span>
          </button>
        </div>
      </div>
    `;
  }).join("");
  refreshIcons();
}

function addProductToPosCart(prodId) {
  const prod = state.almacen.find(a => a.id === Number(prodId));
  if (!prod) return;
  const strictStock = (adminConfig.workflow.stockMode || "STRICT") === "STRICT";

  if (strictStock && prod.stock <= 0) {
    showToast(`"${prod.descripcion}" no tiene stock disponible.`, "warning");
    return;
  }

  const existing = state.posCart.find(c => c.productId === prod.id);
  if (existing) {
    if (strictStock && existing.cantidad + 1 > prod.stock) {
      showToast(`Stock máximo disponible alcanzado (${prod.stock})`, "warning");
      return;
    }
    existing.cantidad += 1;
    existing.subtotal = existing.cantidad * existing.precioUnit;
  } else {
    state.posCart.push({
      productId: prod.id,
      descripcion: prod.descripcion,
      compatibilidad: prod.compatibilidad,
      stockMax: prod.stock,
      cantidad: 1,
      precioUnit: Number(prod.pVenta) || 0,
      subtotal: Number(prod.pVenta) || 0
    });
  }

  updateSidebarCounters();
  renderPosProductPicker();
  renderPosCartTable();
}

function updatePosCartQty(prodId, newQty) {
  const item = state.posCart.find(c => c.productId === Number(prodId));
  const prod = state.almacen.find(a => a.id === Number(prodId));
  if (!item || !prod) return;
  const strictStock = (adminConfig.workflow.stockMode || "STRICT") === "STRICT";

  let qty = parseInt(newQty, 10);
  if (isNaN(qty) || qty < 1) qty = 1;
  if (strictStock && qty > prod.stock && prod.stock > 0) {
    qty = prod.stock;
    showToast(`Solo hay ${prod.stock} unidades disponibles`, "warning");
  }
  item.cantidad = qty;
  item.subtotal = item.cantidad * item.precioUnit;
  updateSidebarCounters();
  renderPosProductPicker();
  renderPosCartTable();
}

function updatePosCartUnitPrice(prodId, newPrice) {
  if (!hasPermission("modificar_precios") && !state.tempPriceOverride) {
    requestAdminAuthorization("Modificar precios unitarios en mostrador requiere autorización de Administrador.", () => {
      state.tempPriceOverride = true;
      renderPosCartTable();
      showToast("Edición de precios desbloqueada en esta sesión", "success");
    });
    renderPosCartTable();
    return;
  }
  const item = state.posCart.find(c => c.productId === Number(prodId));
  if (!item) return;
  item.precioUnit = Math.max(0, Number(newPrice) || 0);
  item.subtotal = item.cantidad * item.precioUnit;
  recalcPosTotals();
  renderPosCartTable();
}

function removePosCartItem(prodId) {
  state.posCart = state.posCart.filter(c => c.productId !== Number(prodId));
  updateSidebarCounters();
  renderPosProductPicker();
  renderPosCartTable();
}

function renderPosCartTable() {
  const tbody = document.getElementById("pos-cart-tbody");
  const badge = document.getElementById("pos-cart-summary-badge");
  if (!tbody || !badge) return;
  badge.textContent = `${state.posCart.length} producto(s) seleccionados`;

  const canEditPrice = hasPermission("modificar_precios") || state.tempPriceOverride;

  if (state.posCart.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="py-10 text-center text-gray-400 text-xs">Carrito vacío. Selecciona repuestos arriba para comenzar.</td></tr>`;
    recalcPosTotals();
    return;
  }

  tbody.innerHTML = state.posCart.map(item => {
    const prod = state.almacen.find(a => a.id === item.productId);
    const currentStock = prod ? prod.stock : item.stockMax;
    return `
      <tr class="hover:bg-gray-50">
        <td class="py-3 px-3">
          <div class="font-bold text-gray-900">${escHtml(item.descripcion)}</div>
          <div class="text-[10px] text-gray-500">${escHtml(item.compatibilidad)}</div>
        </td>
        <td class="py-3 px-2 text-center">
          <span class="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold text-[11px] tabular">${currentStock}</span>
        </td>
        <td class="py-3 px-2 text-center">
          <div class="inline-flex items-center border border-gray-300 rounded-xl overflow-hidden bg-white">
            <button type="button" onclick="updatePosCartQty(${item.productId}, ${item.cantidad - 1})" class="px-2.5 py-1 hover:bg-gray-100 text-gray-700 font-bold">-</button>
            <input
              type="number"
              min="1"
              value="${item.cantidad}"
              inputmode="numeric"
              data-numpad="integer"
              data-numpad-label="Cantidad · ${escHtml(item.descripcion)}"
              onchange="updatePosCartQty(${item.productId}, this.value)"
              class="w-12 text-center text-xs font-bold py-1 focus:outline-none bg-transparent"
            />
            <button type="button" onclick="updatePosCartQty(${item.productId}, ${item.cantidad + 1})" class="px-2.5 py-1 hover:bg-gray-100 text-gray-700 font-bold">+</button>
          </div>
        </td>
        <td class="py-3 px-3 text-right">
          <input
            type="number"
            step="0.01"
            value="${item.precioUnit}"
            inputmode="decimal"
            data-numpad="decimal"
            data-numpad-label="Precio Unit. · ${escHtml(item.descripcion)}"
            ${canEditPrice ? "" : "readonly"}
            onchange="updatePosCartUnitPrice(${item.productId}, this.value)"
            class="input-clean w-20 text-right text-xs py-1 px-2"
          />
        </td>
        <td class="py-3 px-3 text-right font-bold text-gray-900 whitespace-nowrap tabular">${formatMoney(item.subtotal)}</td>
        <td class="py-3 px-2 text-center">
          <button type="button" onclick="removePosCartItem(${item.productId})" class="p-1 text-gray-400 hover:text-red-600 rounded">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </td>
      </tr>
    `;
  }).join("");

  recalcPosTotals();
  refreshIcons();
}

function openPosClientDropdown() {
  const q = document.getElementById("pos-client-search-input").value;
  renderPosClientDropdownList(q);
  document.getElementById("pos-client-dropdown").classList.remove("hidden");
}

function togglePosClientDropdown(e) {
  if (e) { e.preventDefault(); e.stopPropagation(); }
  const dd = document.getElementById("pos-client-dropdown");
  if (!dd) return;
  if (dd.classList.contains("hidden")) openPosClientDropdown();
  else dd.classList.add("hidden");
}

function onPosClientSearchInput(val) {
  renderPosClientDropdownList(val);
  document.getElementById("pos-client-dropdown").classList.remove("hidden");
}

function renderPosClientDropdownList(query = "") {
  const q = (query || "").toLowerCase().trim();
  const debtMap = getClientDebtMap();
  const dd = document.getElementById("pos-client-dropdown");

  const filteredClients = state.clientes.filter(c => {
    if (!q || q.includes("otros")) return true;
    return `${c.codigo} ${c.nombre || ""} ${c.origen}`.toLowerCase().includes(q);
  });

  const clientItemsHtml = filteredClients.map(c => {
    const debtInfo = debtMap[c.codigo.toUpperCase()];
    const hasDebt = debtInfo && debtInfo.saldo > 0;
    return `
      <button type="button" onclick="selectPosClient('${escHtml(c.codigo)}')" class="w-full text-left px-3.5 py-2.5 hover:bg-gray-50 flex items-center justify-between gap-2 text-xs">
        <div>
          <span class="font-bold text-gray-900">${escHtml(c.codigo)}</span>
          <span class="text-gray-600 ml-1.5">— ${escHtml(c.nombre || c.telefono || c.origen)}</span>
          <span class="ml-1.5 px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 text-[10px]">${escHtml(c.origen)}</span>
        </div>
        ${hasDebt
          ? `<span class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] whitespace-nowrap tabular">Debe ${formatMoney(debtInfo.saldo)}</span>`
          : `<span class="text-[10px] text-emerald-600">Al día</span>`}
      </button>
    `;
  }).join("");

  dd.innerHTML = clientItemsHtml + `
    <button type="button" onclick="selectPosClient('OTROS')" class="w-full text-left px-3.5 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between gap-2 text-xs font-bold text-gray-900 border-t border-gray-200">
      <div class="flex items-center gap-2">
        <i data-lucide="edit-3" class="w-4 h-4 text-amber-600"></i>
        <span>OTROS (LLENADO MANUAL)</span>
      </div>
      <span class="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px]">MANUAL</span>
    </button>
  `;
  refreshIcons();
}

function selectPosClient(codigo) {
  document.getElementById("pos-client-dropdown").classList.add("hidden");
  const searchInput = document.getElementById("pos-client-search-input");
  const codInput = document.getElementById("pos-client-codigo");
  const oriInput = document.getElementById("pos-client-origen");
  const nomInput = document.getElementById("pos-client-nombre");
  const modeBadge = document.getElementById("pos-manual-mode-badge");
  const debtAlert = document.getElementById("pos-selected-client-debt-alert");
  const debtText = document.getElementById("pos-selected-client-debt-text");

  if (codigo === "OTROS") {
    state.posSelectedClient = { codigo: "OTROS", isManual: true };
    searchInput.value = "OTROS (MANUAL)";
    codInput.removeAttribute("readonly");
    oriInput.removeAttribute("readonly");
    nomInput.removeAttribute("readonly");
    codInput.value = "";
    oriInput.value = "PARTICULAR";
    nomInput.value = "";
    modeBadge.textContent = "Modo Manual Activo";
    modeBadge.className = "text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold";
    debtAlert.classList.add("hidden");
  } else {
    const cli = state.clientes.find(c => c.codigo === codigo);
    if (!cli) return;
    state.posSelectedClient = { ...cli, isManual: false };
    searchInput.value = `${cli.codigo} — ${cli.nombre || cli.origen}`;
    codInput.setAttribute("readonly", "true");
    oriInput.setAttribute("readonly", "true");
    nomInput.setAttribute("readonly", "true");
    codInput.value = cli.codigo;
    oriInput.value = cli.origen;
    nomInput.value = cli.nombre || cli.telefono || cli.codigo;
    modeBadge.textContent = "Cliente Frecuente";
    modeBadge.className = "text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold";

    const debtMap = getClientDebtMap();
    const dInfo = debtMap[cli.codigo.toUpperCase()];
    if (dInfo && dInfo.saldo > 0) {
      debtAlert.classList.remove("hidden");
      debtText.innerHTML = `Atención: <strong>${escHtml(cli.codigo)}</strong> mantiene deuda acumulada de <strong>${formatMoney(dInfo.saldo)}</strong>.`;
    } else {
      debtAlert.classList.add("hidden");
    }
  }
}

document.addEventListener("click", e => {
  const dd = document.getElementById("pos-client-dropdown");
  const inp = document.getElementById("pos-client-search-input");
  const btn = document.getElementById("pos-client-dropdown-btn");
  if (dd && !dd.contains(e.target) && e.target !== inp && (!btn || !btn.contains(e.target))) {
    dd.classList.add("hidden");
  }
});

function onPosPaymentModeChange(mode) {
  const adelantoBox = document.getElementById("pos-adelanto-box");
  if (adelantoBox) {
    adelantoBox.classList.toggle("hidden", mode !== "ADELANTO");
  }
  recalcPosTotals();
}

function recalcPosTotals() {
  const totalUnits = state.posCart.reduce((acc, i) => acc + (Number(i.cantidad) || 0), 0);
  const totalAmount = state.posCart.reduce((acc, i) => acc + (Number(i.subtotal) || 0), 0);
  const payMode = document.getElementById("pos-payment-mode")?.value || "CREDITO";

  let paidAmount = 0;
  if (payMode === "CONTADO") paidAmount = totalAmount;
  else if (payMode === "ADELANTO") {
    paidAmount = Math.min(totalAmount, Math.max(0, Number(document.getElementById("pos-adelanto-input")?.value) || 0));
  }
  const balance = Math.max(0, totalAmount - paidAmount);

  const setTxt = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  setTxt("pos-summary-units", `${totalUnits} und.`);
  setTxt("pos-summary-total", formatMoney(totalAmount));
  setTxt("pos-summary-paid", formatMoney(paidAmount));
  setTxt("pos-summary-balance", formatMoney(balance));
}

async function submitPosSale() {
  if (state.posCart.length === 0) {
    showToast("Agrega al menos un repuesto al carrito antes de procesar", "warning");
    return;
  }

  const codigoCli = (document.getElementById("pos-client-codigo").value || "").trim().toUpperCase() || "OTROS";
  const origenCli = (document.getElementById("pos-client-origen").value || "").trim().toUpperCase() || "PARTICULAR";
  const nombreCli = (document.getElementById("pos-client-nombre").value || "").trim().toUpperCase();
  const fecha = document.getElementById("pos-fecha").value || getTodayLocalISO();
  const payMode = document.getElementById("pos-payment-mode").value;
  const observacion = document.getElementById("pos-observacion").value.trim(); // Respeta minúsculas/mayúsculas

  const totalUnits = state.posCart.reduce((acc, i) => acc + i.cantidad, 0);
  const totalAmount = state.posCart.reduce((acc, i) => acc + i.subtotal, 0);

  let pagado = 0;
  let estado = "Por Cancelar";
  if (payMode === "CONTADO") {
    pagado = totalAmount;
    estado = "Cancelado";
  } else if (payMode === "ADELANTO") {
    pagado = Math.min(totalAmount, Math.max(0, Number(document.getElementById("pos-adelanto-input").value) || 0));
    estado = pagado >= totalAmount && totalAmount > 0 ? "Cancelado" : "Por Cancelar";
  }

  const ticketCode = "TK-" + Date.now().toString().slice(-6);
  const cartSnapshot = state.posCart.map(i => ({ ...i }));
  const summaryDesc = cartSnapshot.length === 1
    ? cartSnapshot[0].descripcion
    : cartSnapshot.map(i => `${i.cantidad}X ${i.descripcion} (S/${i.subtotal.toFixed(2)})`).join(" + ");
  const unitPriceRef = cartSnapshot.length === 1 ? cartSnapshot[0].precioUnit : totalAmount;
  const origenWithNombre = nombreCli ? `${origenCli} - ${nombreCli}` : origenCli;

  let createdSaleId = Date.now();

  if (supabaseClient) {
    try {
      // COLUMNAS EXACTAS INTACTAS DE LA TABLA `ventas`
      const { data: insertedData, error: saleErr } = await supabaseClient.from("ventas").insert([{
        ticket: ticketCode,
        descripcion: summaryDesc,
        cantidad: totalUnits,
        precio_uni: unitPriceRef,
        precio_total: totalAmount,
        pagado: pagado,
        fecha: fecha,
        cliente: codigoCli,
        origen: origenWithNombre,
        estado: estado,
        observacion: observacion
      }]).select();
      if (saleErr) throw saleErr;
      if (insertedData && insertedData[0]) createdSaleId = insertedData[0].id;

      for (const cartItem of cartSnapshot) {
        const prod = state.almacen.find(a => a.id === cartItem.productId);
        if (prod) {
          const newStock = Math.max(0, (Number(prod.stock) || 0) - cartItem.cantidad);
          await supabaseClient.from("almacen").update({ stock: newStock }).eq("id", prod.id);
        }
      }
      await syncFromSupabase(false);
    } catch (err) {
      showToast("Error guardando en Supabase: " + (err.message || ""), "warning");
      return;
    }
  } else {
    const newId = state.ventas.reduce((max, v) => Math.max(max, v.id), 0) + 1;
    createdSaleId = newId;
    state.ventas.unshift({
      id: newId,
      ticket: ticketCode,
      fecha,
      cliente: codigoCli,
      clienteNombre: origenWithNombre,
      origen: origenWithNombre,
      descripcion: summaryDesc,
      cantidad: totalUnits,
      precioUnit: unitPriceRef,
      total: totalAmount,
      pagado,
      estado,
      observacion,
      items: cartSnapshot
    });
    cartSnapshot.forEach(cartItem => {
      const prod = state.almacen.find(a => a.id === cartItem.productId);
      if (prod) prod.stock = Math.max(0, (Number(prod.stock) || 0) - cartItem.cantidad);
    });
    saveLocalBackup();
  }

  lastCreatedSale = {
    id: createdSaleId,
    ticket: ticketCode,
    cliente: codigoCli,
    origen: origenWithNombre,
    total: totalAmount,
    pagado,
    saldo: Math.max(0, totalAmount - pagado),
    estado,
    descripcion: summaryDesc,
    fecha,
    cantidad: totalUnits,
    observacion,
    items: cartSnapshot
  };

  clearPosForm(false);
  renderActiveTab();

  // Método de Trabajo configurable post-venta
  const flow = adminConfig.workflow.postSaleFlow || "MODAL";
  if (flow === "DIRECT_PRINT" || adminConfig.printing.autoPrintOnSale) {
    printSaleTicketDirect(lastCreatedSale);
    showToast(`Venta ${ticketCode} registrada y enviada a impresión`, "success");
  } else if (flow === "FAST_TOAST") {
    showToast(`Venta ${ticketCode} registrada con éxito (${formatMoney(totalAmount)})`, "success");
  } else {
    mostrarModalVentaExitosa(lastCreatedSale);
  }
}

function mostrarModalVentaExitosa(sale) {
  document.getElementById("modal-success-ticket").textContent = sale.ticket || `#${sale.id}`;
  document.getElementById("modal-success-cliente").textContent = `${sale.cliente} (${sale.origen || "GENERAL"})`;
  document.getElementById("modal-success-total").textContent = formatMoney(sale.total);
  const estadoEl = document.getElementById("modal-success-estado");
  estadoEl.textContent = sale.estado;
  estadoEl.className = sale.estado === "Cancelado" ? "font-bold text-emerald-700" : "font-bold text-amber-700";

  const m = document.getElementById("modal-venta-exitosa");
  m.classList.remove("hidden");
  m.classList.add("flex");
  refreshIcons();
}

function onVentaExitosaOkClick() {
  const m1 = document.getElementById("modal-venta-exitosa");
  m1.classList.add("hidden");
  m1.classList.remove("flex");
  if (!lastCreatedSale) return;
  document.getElementById("modal-acciones-ticket-badge").textContent = lastCreatedSale.ticket || `#${lastCreatedSale.id}`;
  const m2 = document.getElementById("modal-acciones-venta");
  m2.classList.remove("hidden");
  m2.classList.add("flex");
  refreshIcons();
}

function accionPostVenta(tipo) {
  if (!lastCreatedSale) return;
  const saleId = lastCreatedSale.id;
  if (tipo === "pago") {
    finalizarAccionesVenta(true);
    openAbonoModal(saleId);
  } else if (tipo === "imprimir") {
    printSaleTicket(saleId);
  } else if (tipo === "pdf") {
    downloadSaleTicketPDF(saleId);
  } else if (tipo === "historial") {
    finalizarAccionesVenta(true);
    switchTab("historial-ventas");
    const sInp = document.getElementById("filter-ventas-search");
    if (sInp) {
      sInp.value = (lastCreatedSale.ticket || lastCreatedSale.cliente).toUpperCase();
      renderVentasTable();
    }
  }
}

function finalizarAccionesVenta(silent = false) {
  const m = document.getElementById("modal-acciones-venta");
  m.classList.add("hidden");
  m.classList.remove("flex");
  if (!silent) showToast("Listo para nueva venta", "info");
}

// HISTORIAL DE VENTAS
function scheduleRenderVentasTable() {
  if (ventasSearchDebounceTimer) clearTimeout(ventasSearchDebounceTimer);
  ventasSearchDebounceTimer = setTimeout(renderVentasTable, 60);
}

function populateVentasFilterDropdowns() {
  const cliSelect = document.getElementById("filter-ventas-cliente");
  if (!cliSelect) return;
  const currentCli = cliSelect.value || "all";
  const allClientCodes = Array.from(new Set([...state.clientes.map(c => c.codigo), ...state.ventas.map(v => v.cliente)])).filter(Boolean);
  cliSelect.innerHTML = `<option value="all">TODOS LOS CLIENTES</option>` + allClientCodes.map(c => `<option value="${escHtml(c)}">${escHtml(c)}</option>`).join("");
  if (allClientCodes.includes(currentCli) || currentCli === "all") cliSelect.value = currentCli;

  const prodSelect = document.getElementById("filter-ventas-producto");
  const currentProd = prodSelect.value || "all";
  prodSelect.innerHTML = `<option value="all">TODOS LOS REPUESTOS</option>` + state.almacen.map(a => `<option value="${escHtml(a.descripcion)}">${escHtml(a.descripcion)}</option>`).join("");
  prodSelect.value = currentProd;
}

function clearVentasFilters() {
  document.getElementById("filter-ventas-estado").value = "all";
  document.getElementById("filter-ventas-cliente").value = "all";
  document.getElementById("filter-ventas-producto").value = "all";
  document.getElementById("filter-ventas-search").value = "";
  renderVentasTable();
}

function getFilteredVentasForTable() {
  const fEstado = document.getElementById("filter-ventas-estado")?.value || "all";
  const fCliente = document.getElementById("filter-ventas-cliente")?.value || "all";
  const fProducto = document.getElementById("filter-ventas-producto")?.value || "all";
  const fSearch = (document.getElementById("filter-ventas-search")?.value || "").toLowerCase().trim();

  return state.ventas.filter(v => {
    if (fEstado !== "all" && v.estado !== fEstado) return false;
    if (fCliente !== "all" && v.cliente !== fCliente) return false;
    if (fProducto !== "all" && !(v.descripcion || "").includes(fProducto)) return false;
    if (fSearch) {
      const hay = `${v.id} ${v.ticket || ""} ${v.cliente} ${v.origen || ""} ${v.descripcion} ${v.observacion || ""} ${v.fecha}`.toLowerCase();
      if (!hay.includes(fSearch)) return false;
    }
    return true;
  }).sort((a, b) => (b.fecha || "").localeCompare(a.fecha || "") || b.id - a.id);
}

function renderVentasTable() {
  const filtered = getFilteredVentasForTable();
  const sumTotal = filtered.reduce((acc, v) => acc + (Number(v.total) || 0), 0);
  const sumPagado = filtered.reduce((acc, v) => acc + (Number(v.pagado) || 0), 0);
  const sumSaldo = Math.max(0, sumTotal - sumPagado);

  document.getElementById("ventas-filter-summary").innerHTML = `
    <div>Mostrando <strong>${filtered.length}</strong> registro(s)</div>
    <div class="flex flex-wrap items-center gap-4 tabular">
      <span>Facturado: <strong>${formatMoney(sumTotal)}</strong></span>
      <span>Cobrado: <strong class="text-emerald-700">${formatMoney(sumPagado)}</strong></span>
      <span>Saldo: <strong class="text-amber-800">${formatMoney(sumSaldo)}</strong></span>
    </div>
  `;

  const tbody = document.getElementById("ventas-table-body");
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" class="py-10 text-center text-gray-400">Sin ventas para mostrar con este filtro.</td></tr>`;
    return;
  }

  const canDelete = hasPermission("eliminar_ventas") || isUserAdmin(state.currentUser);
  const canPrint = canUserPrint(state.currentUser);

  tbody.innerHTML = filtered.map(v => {
    const total = Number(v.total) || 0;
    const pagado = Number(v.pagado) || 0;
    const saldo = Math.max(0, total - pagado);
    const isPending = v.estado === "Por Cancelar";
    const badgeClass = isPending
      ? "bg-amber-100 text-amber-900 border border-amber-300"
      : "bg-emerald-100 text-emerald-900 border border-emerald-300";

    return `
      <tr class="hover:bg-gray-50/80 transition">
        <td class="py-3 px-3 text-gray-500 font-mono text-[11px]">
          <strong class="text-gray-900 block">${escHtml(v.ticket || "#" + v.id)}</strong>
          <span>#${v.id}</span>
        </td>
        <td class="py-3 px-3 whitespace-nowrap">
          <div class="font-bold text-gray-900">${escHtml(v.cliente)}</div>
          <div class="text-[10px] text-gray-400">${escHtml(v.origen || "")}</div>
        </td>
        <td class="py-3 px-3">
          <div class="font-medium text-gray-900">${escHtml(v.descripcion)}</div>
          ${v.observacion ? `<div class="text-[10px] text-amber-700 mt-0.5">Obs: ${escHtml(v.observacion)}</div>` : ""}
        </td>
        <td class="py-3 px-3 text-gray-700 whitespace-nowrap tabular">${formatDatePE(v.fecha)}</td>
        <td class="py-3 px-3 text-center text-gray-700 font-semibold tabular">${v.cantidad}</td>
        <td class="py-3 px-3 text-right text-gray-900 font-semibold whitespace-nowrap tabular">${formatMoney(total)}</td>
        <td class="py-3 px-3 text-right text-emerald-700 whitespace-nowrap tabular">${formatMoney(pagado)}</td>
        <td class="py-3 px-3 text-right font-bold text-gray-900 whitespace-nowrap tabular">${formatMoney(saldo)}</td>
        <td class="py-3 px-3 whitespace-nowrap">
          <button onclick="openAbonoModal(${v.id})" class="px-2.5 py-0.5 rounded-full text-[11px] font-bold ${badgeClass}">
            ${escHtml(v.estado)}
          </button>
        </td>
        <td class="py-3 px-3 text-right whitespace-nowrap">
          <div class="inline-flex items-center gap-1">
            <button onclick="openAbonoModal(${v.id})" class="p-1.5 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100" title="Registrar pago o adelanto"><i data-lucide="coins" class="w-4 h-4"></i></button>
            ${canPrint ? `
              <button onclick="printSaleTicket(${v.id})" class="p-1.5 text-blue-600 hover:text-blue-800 rounded-lg hover:bg-blue-50" title="Vista previa e Impresión de Comprobante"><i data-lucide="printer" class="w-4 h-4"></i></button>
              <button onclick="downloadSaleTicketPDF(${v.id})" class="p-1.5 text-indigo-600 hover:text-indigo-800 rounded-lg hover:bg-indigo-50" title="Guardar comprobante en PDF"><i data-lucide="file-down" class="w-4 h-4"></i></button>
            ` : ""}
            ${canDelete ? `
              <button onclick="confirmarEdicionVenta(${v.id})" class="p-1.5 text-amber-600 hover:text-amber-800 rounded-lg hover:bg-amber-50" title="Editar venta (Admin)"><i data-lucide="edit" class="w-4 h-4"></i></button>
              <button onclick="attemptDeleteSale(${v.id})" class="p-1.5 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50" title="Eliminar venta (Admin 5s)"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            ` : ""}
          </div>
        </td>
      </tr>
    `;
  }).join("");
  refreshIcons();
}

function openAbonoModal(saleId) {
  const v = state.ventas.find(x => x.id === saleId);
  if (!v) return;
  document.getElementById("abono-venta-id").value = v.id;
  document.getElementById("abono-cliente-label").textContent = `${v.cliente} (${v.descripcion})`;
  document.getElementById("abono-total-label").textContent = formatMoney(v.total);
  document.getElementById("abono-pagado-input").value = v.pagado;
  document.getElementById("abono-obs-input").value = v.observacion || "";
  const m = document.getElementById("modal-abono-venta");
  m.classList.remove("hidden");
  m.classList.add("flex");
}

function closeAbonoModal() {
  const m = document.getElementById("modal-abono-venta");
  m.classList.add("hidden");
  m.classList.remove("flex");
}

async function handleAbonoSubmit(e) {
  e.preventDefault();
  const id = Number(document.getElementById("abono-venta-id").value);
  const v = state.ventas.find(x => x.id === id);
  if (!v) return;

  const pagado = Math.max(0, Number(document.getElementById("abono-pagado-input").value) || 0);
  const estado = pagado >= v.total && v.total > 0 ? "Cancelado" : "Por Cancelar";
  const observacion = document.getElementById("abono-obs-input").value.trim();

  if (supabaseClient) {
    const { error } = await supabaseClient.from("ventas").update({ pagado, estado, observacion }).eq("id", id);
    if (error) {
      showToast("Error guardando abono en Supabase", "warning");
      return;
    }
    await syncFromSupabase(false);
  } else {
    v.pagado = pagado;
    v.estado = estado;
    v.observacion = observacion;
    saveLocalBackup();
    renderActiveTab();
  }
  closeAbonoModal();
  showToast(`Pago actualizado. Estado: ${estado}`, "success");
}

function confirmarEdicionVenta(saleId) {
  const v = state.ventas.find(x => x.id === saleId);
  if (!v) return;
  showConfirmActionModal({
    type: "edit",
    title: "Editar Registro de Venta",
    message: `Vas a modificar la venta ${v.ticket || "#" + v.id} del cliente "${v.cliente}".`,
    detail: `Total: ${formatMoney(v.total)} | Pagado: ${formatMoney(v.pagado)}`,
    confirmText: "Abrir Edición",
    onConfirm: () => openEditSaleModal(saleId)
  });
}

function openEditSaleModal(saleId) {
  const v = state.ventas.find(x => x.id === saleId);
  if (!v) return;
  document.getElementById("edit-sale-id").value = v.id;
  document.getElementById("edit-sale-ticket").value = v.ticket || `#${v.id}`;
  document.getElementById("edit-sale-fecha").value = v.fecha || getTodayLocalISO();
  document.getElementById("edit-sale-cliente").value = v.cliente || "";
  document.getElementById("edit-sale-origen").value = v.origen || "";
  document.getElementById("edit-sale-descripcion").value = v.descripcion || "";
  document.getElementById("edit-sale-cantidad").value = v.cantidad || 1;
  document.getElementById("edit-sale-total").value = v.total || 0;
  document.getElementById("edit-sale-pagado").value = v.pagado || 0;
  document.getElementById("edit-sale-observacion").value = v.observacion || "";

  const m = document.getElementById("modal-editar-venta");
  m.classList.remove("hidden");
  m.classList.add("flex");
  refreshIcons();
}

function closeEditSaleModal() {
  const m = document.getElementById("modal-editar-venta");
  m.classList.add("hidden");
  m.classList.remove("flex");
}

async function handleEditSaleSubmit(e) {
  e.preventDefault();
  const id = Number(document.getElementById("edit-sale-id").value);
  const v = state.ventas.find(x => x.id === id);
  if (!v) return;

  const fecha = document.getElementById("edit-sale-fecha").value;
  const cliente = document.getElementById("edit-sale-cliente").value.trim().toUpperCase();
  const origen = document.getElementById("edit-sale-origen").value.trim().toUpperCase();
  const descripcion = document.getElementById("edit-sale-descripcion").value.trim().toUpperCase();
  const cantidad = Number(document.getElementById("edit-sale-cantidad").value) || 1;
  const total = Number(document.getElementById("edit-sale-total").value) || 0;
  const pagado = Number(document.getElementById("edit-sale-pagado").value) || 0;
  const observacion = document.getElementById("edit-sale-observacion").value.trim();
  const estado = pagado >= total && total > 0 ? "Cancelado" : "Por Cancelar";

  if (supabaseClient) {
    const { error } = await supabaseClient.from("ventas").update({
      fecha, cliente, origen, descripcion, cantidad, precio_total: total, pagado, estado, observacion
    }).eq("id", id);
    if (error) {
      showToast("Error guardando cambios: " + error.message, "warning");
      return;
    }
    await syncFromSupabase(false);
  } else {
    Object.assign(v, { fecha, cliente, origen, descripcion, cantidad, total, pagado, estado, observacion });
    saveLocalBackup();
    renderActiveTab();
  }
  closeEditSaleModal();
  showToast(`Venta #${id} actualizada`, "success");
}

function attemptDeleteSale(saleId) {
  const v = state.ventas.find(x => x.id === saleId);
  const ticketDesc = v ? `${v.ticket || "#" + v.id} · ${v.cliente}` : `#${saleId}`;
  showConfirmActionModal({
    type: "delete",
    title: "Eliminar Registro de Venta",
    message: `¿Eliminar permanentemente la venta ${ticketDesc}?`,
    detail: "Se removerá del Historial y de Supabase tras la cuenta regresiva.",
    confirmText: "Eliminar Venta",
    onConfirm: () => executeDeleteSale(saleId)
  });
}

async function executeDeleteSale(saleId) {
  if (supabaseClient) {
    const { error } = await supabaseClient.from("ventas").delete().eq("id", saleId);
    if (error) {
      showToast("Error al eliminar en Supabase", "warning");
      return;
    }
    await syncFromSupabase(false);
  } else {
    state.ventas = state.ventas.filter(v => v.id !== saleId);
    saveLocalBackup();
    renderActiveTab();
  }
  showToast(`Venta #${saleId} eliminada`, "info");
}

// ============================================================================
// 9. MOTOR DE IMPRESIÓN DUAL (ESTILO JUANCHOS: 80mm / 58mm INTERNO, CLIENTE Y A4)
// ============================================================================
function generateBarcodeSVG(codeText) {
  const clean = String(codeText || "5622285774043229").replace(/\D/g, "").padEnd(16, "7").slice(0, 16);
  let x = 6;
  const rects = [];
  for (let i = 0; i < clean.length; i++) {
    const d = parseInt(clean[i], 10) || 0;
    const w1 = (d % 3) + 1.3;
    const g1 = ((d + 1) % 2) + 1.2;
    const w2 = ((d * 2) % 3) + 1.2;
    rects.push(`<rect x="${x.toFixed(1)}" y="0" width="${w1.toFixed(1)}" height="38" fill="#000"/>`);
    x += w1 + g1;
    rects.push(`<rect x="${x.toFixed(1)}" y="0" width="${w2.toFixed(1)}" height="38" fill="#000"/>`);
    x += w2 + 1.5;
  }
  return `<div class="t80-barcode">
    <svg viewBox="0 0 ${Math.ceil(x + 6)} 40" preserveAspectRatio="none">${rects.join("")}</svg>
    <div class="t80-barcode-num">${escHtml(clean)}</div>
  </div>`;
}

function applyPrintPageRule(format = "80mm") {
  let st = document.getElementById("dynamic-print-page-style");
  if (!st) {
    st = document.createElement("style");
    st.id = "dynamic-print-page-style";
    document.head.appendChild(st);
  }
  if (format === "a4") {
    st.textContent = "@media print { @page { size: A4 portrait; margin: 10mm; } }";
  } else if (format === "58mm") {
    st.textContent = "@media print { @page { size: 58mm auto; margin: 0mm; } }";
  } else {
    st.textContent = "@media print { @page { size: 80mm auto; margin: 0mm; } }";
  }
}

function parseSaleLines(sale) {
  if (Array.isArray(sale.items) && sale.items.length > 0) {
    return sale.items.map(i => ({
      cant: Number(i.cantidad) || 1,
      nombre: i.descripcion,
      subtotal: Number(i.subtotal) || (Number(i.cantidad) * Number(i.precioUnit))
    }));
  }
  const raw = String(sale.descripcion || "");
  if (raw.includes(" + ")) {
    return raw.split(" + ").map(part => {
      const m = part.match(/^(\d+)[xX]\s+(.+?)\s*\(S\/([\d.]+)\)$/);
      if (m) return { cant: Number(m[1]), nombre: m[2], subtotal: Number(m[3]) };
      return { cant: 1, nombre: part, subtotal: Number(sale.total) || 0 };
    });
  }
  return [{ cant: Number(sale.cantidad) || 1, nombre: raw, subtotal: Number(sale.total) || 0 }];
}

function getLogoImgForPrint() {
  if (adminConfig.brand.logoDataUrl) {
    return `<img class="t80-logo" src="${escHtml(adminConfig.brand.logoDataUrl)}" alt="Logo" />`;
  }
  return `<img class="t80-logo" src="favicon.svg" alt="Logo" />`;
}

function generateThermalTicketHTML(sale, forceType = null) {
  const imp = adminConfig.printing;
  const activeType = forceType || (imp.usarTicketCliente ? "cliente" : "interno");
  const isInternal = activeType === "interno";
  const tpl = imp.templates[activeType] || createDefaultPrinterTemplate(activeType);
  const widthClass = imp.paperWidth === "58mm" ? "w-58mm" : "";

  const total = Number(sale.total) || 0;
  const pagado = Number(sale.pagado) || 0;
  const saldo = Math.max(0, total - pagado);
  const subtotalBase = total / 1.18;
  const igvVal = total - subtotalBase;
  const lines = parseSaleLines(sale);
  const ticketRef = sale.ticket || `#${String(sale.id || 1).padStart(5, "0")}`;
  const cashier = state.currentUser ? state.currentUser.username : "ANAROSA";
  const nowTime = new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });

  const dispatchListHtml = lines.map(l => `
    <div class="t80-dispatch-item">${l.cant} × ${escHtml(l.nombre)}</div>
  `).join("");

  const itemsDetailHtml = lines.map(l => `
    <div class="t80-row" style="align-items:flex-start;margin:3px 0;">
      <span style="flex:1;">${l.cant} x ${escHtml(l.nombre)}</span>
      <strong style="white-space:nowrap;">${formatMoney(l.subtotal)}</strong>
    </div>
  `).join("");

  return `
    <div class="ticket-80-paper ${widthClass}" style="--t80-font:${Number(tpl.fontSize) || 12}px;">
      <div class="t80-center">
        ${tpl.showLogo ? getLogoImgForPrint() : ""}
        <div class="t80-brand">${escHtml(tpl.brandTitle || adminConfig.brand.name)}</div>
        ${tpl.brandSub ? `<div class="t80-subbrand">${escHtml(tpl.brandSub)}</div>` : ""}
        <div class="t80-store-info">
          ${tpl.rucLine ? `<div>${escHtml(tpl.rucLine)}</div>` : ""}
          ${adminConfig.brand.ruc ? `<div>RUC: ${escHtml(adminConfig.brand.ruc)}</div>` : ""}
          ${tpl.address ? `<div>${escHtml(tpl.address)}</div>` : ""}
          ${tpl.city ? `<div>${escHtml(tpl.city)}</div>` : ""}
          ${tpl.phone ? `<div>TEL: ${escHtml(tpl.phone)}</div>` : ""}
        </div>
      </div>

      <hr class="t80-dash" />
      <div class="t80-center" style="font-weight:800;margin-bottom:4px;">${escHtml(tpl.docTitle)}</div>
      <div style="font-size:11px;line-height:1.4;">
        <div class="t80-row"><span>TICKET: <strong>${escHtml(ticketRef)}</strong></span><span>${escHtml(nowTime)}</span></div>
        <div class="t80-row"><span>FECHA: ${escHtml(formatDatePE(sale.fecha))}</span><span>ATENDIÓ: ${escHtml(cashier)}</span></div>
        <div>CLIENTE: <strong>${escHtml(sale.cliente || "OTROS")}</strong></div>
        ${sale.origen ? `<div>ORIGEN: ${escHtml(sale.origen)}</div>` : ""}
      </div>

      ${isInternal ? `
        <div class="t80-big-callout">${escHtml(sale.cliente || ticketRef)}</div>
        <div class="t80-dispatch-box">
          <div class="t80-dispatch-title">REPUESTOS A DESPACHAR DE ALMACÉN</div>
          ${dispatchListHtml}
        </div>
      ` : `<hr class="t80-dash" />`}

      <div>
        <div class="t80-row" style="font-weight:800;border-bottom:1px solid #000;padding-bottom:2px;margin-bottom:4px;">
          <span>CANT. / DESCRIPCIÓN</span>
          <span>IMPORTE</span>
        </div>
        ${itemsDetailHtml}
      </div>

      <hr class="t80-solid" />
      ${tpl.showIgv ? `
        <div class="t80-row"><span>OP. GRAVADA</span><span>${formatMoney(subtotalBase)}</span></div>
        <div class="t80-row"><span>IGV (18%)</span><span>${formatMoney(igvVal)}</span></div>
      ` : ""}
      <div class="t80-row t80-grand"><span>TOTAL VENTA:</span><span>${formatMoney(total)}</span></div>
      <div class="t80-row"><span>MONTO PAGADO:</span><span>${formatMoney(pagado)}</span></div>
      <div class="t80-row" style="font-weight:800;">
        <span>SALDO PENDIENTE:</span>
        <span>${formatMoney(saldo)}</span>
      </div>
      <div class="t80-row" style="font-size:11px;">
        <span>ESTADO:</span>
        <strong>${sale.estado === "Cancelado" ? "CANCELADO" : "POR CANCELAR"}</strong>
      </div>

      ${sale.observacion ? `<hr class="t80-dash" /><div style="font-size:11px;"><strong>Obs:</strong> ${escHtml(sale.observacion)}</div>` : ""}

      <hr class="t80-dash" />
      <div class="t80-center" style="font-size:10.5px;line-height:1.35;">
        ${tpl.footer ? `<div>${escHtml(tpl.footer)}</div>` : ""}
        ${tpl.promo ? `<div style="font-weight:800;margin-top:4px;">${escHtml(tpl.promo)}</div>` : ""}
      </div>
      ${tpl.showBarcode ? generateBarcodeSVG(String(sale.id || 1001) + String(Date.now()).slice(-8)) : ""}
    </div>
  `;
}

function printSaleTicketDirect(saleObj, forceType = null) {
  if (!canUserPrint(state.currentUser)) {
    showToast("Tu usuario no tiene autorización de impresión activa", "warning");
    return;
  }
  const paperW = adminConfig.printing.paperWidth === "58mm" ? "58mm" : "80mm";
  applyPrintPageRule(paperW);
  const cont = document.getElementById("impresion");
  cont.className = paperW === "58mm" ? "print-58mm" : "print-80mm";
  cont.innerHTML = generateThermalTicketHTML(saleObj, forceType);
  window.print();
}

function printSaleTicket(saleId) {
  if (!canUserPrint(state.currentUser)) {
    showToast("Tu usuario tiene desactivado el permiso de impresión", "warning");
    return;
  }
  const v = state.ventas.find(x => x.id === saleId) || (lastCreatedSale && lastCreatedSale.id === saleId ? lastCreatedSale : null);
  if (!v) return;

  const defaultType = adminConfig.printing.usarTicketCliente ? "cliente" : "interno";
  currentModalPrintContext = { mode: "sale", saleId: v.id, saleObj: v, ticketType: defaultType };

  document.getElementById("modal-print-title").textContent = `Comprobante ${v.ticket || "#" + v.id}`;
  document.getElementById("modal-print-subtitle").textContent = `Formato térmico ${adminConfig.printing.paperWidth} listo para imprimir o guardar PDF.`;

  const switcher = document.getElementById("modal-ticket-type-switcher");
  switcher.classList.remove("hidden");
  switcher.classList.add("inline-flex");
  switchModalTicketFormat(defaultType);

  const modal = document.getElementById("modal-print-report");
  modal.classList.remove("hidden");
  modal.classList.add("flex");
  refreshIcons();
}

function switchModalTicketFormat(fmt) {
  currentModalPrintContext.ticketType = fmt;
  document.querySelectorAll("#modal-ticket-type-switcher [data-mtfmt]").forEach(btn => {
    const active = btn.dataset.mtfmt === fmt;
    btn.className = active ? "px-2.5 py-1 rounded-lg font-bold btn-accent" : "px-2.5 py-1 rounded-lg font-semibold text-gray-600";
  });
  if (currentModalPrintContext.saleObj) {
    document.getElementById("print-report-area").innerHTML = generateThermalTicketHTML(currentModalPrintContext.saleObj, fmt);
  }
}

function downloadSaleTicketPDF(saleId) {
  printSaleTicket(saleId);
  showToast("Elige 'Guardar como PDF' en el destino de impresión", "info");
  setTimeout(() => executePrintFromModal(), 300);
}

function onReportTypeChange() {
  const type = document.getElementById("report-period-type").value;
  const monthPicker = document.getElementById("report-month-picker");
  const dayPicker = document.getElementById("report-day-picker");
  if (type === "DIA") {
    dayPicker.classList.remove("hidden");
    if (!dayPicker.value) dayPicker.value = getTodayLocalISO();
    monthPicker.classList.add("hidden");
  } else if (type === "MENSUAL") {
    dayPicker.classList.add("hidden");
    monthPicker.classList.remove("hidden");
    if (!monthPicker.value) monthPicker.value = getTodayLocalISO().slice(0, 7);
  } else {
    dayPicker.classList.add("hidden");
    monthPicker.classList.add("hidden");
  }
}

function generateA4ReportHTML(rows, titlePeriod) {
  const tpl = adminConfig.printing.templates.a4 || createDefaultPrinterTemplate("a4");
  const isBn = adminConfig.printing.a4ColorMode === "bn";
  const sumTotal = rows.reduce((s, r) => s + (Number(r.total) || 0), 0);
  const sumPagado = rows.reduce((s, r) => s + (Number(r.pagado) || 0), 0);
  const sumSaldo = Math.max(0, sumTotal - sumPagado);
  const logoSrc = adminConfig.brand.logoDataUrl || "favicon.svg";

  return `
    <div class="a4-sheet-preview ${isBn ? "bn" : ""}" style="--a4-font:${Number(tpl.fontSize) || 11}px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;border-bottom:2px solid #0f172a;padding-bottom:12px;margin-bottom:14px;">
        <div style="display:flex;align-items:center;gap:12px;">
          ${tpl.showLogo ? `<img src="${escHtml(logoSrc)}" alt="Logo" style="width:52px;height:52px;object-fit:contain;" />` : ""}
          <div>
            <div style="font-size:18px;font-weight:800;letter-spacing:0.06em;">${escHtml(tpl.brandTitle || adminConfig.brand.name)}</div>
            <div style="font-size:11px;font-weight:700;color:#475569;">${escHtml(tpl.brandSub)}</div>
            <div style="font-size:10px;color:#64748b;">${escHtml([tpl.rucLine, tpl.address, tpl.city, tpl.phone].filter(Boolean).join(" · "))}</div>
          </div>
        </div>
        <div style="text-align:right;font-size:11px;">
          <strong style="font-size:12px;">${escHtml(titlePeriod)}</strong><br/>
          <span>Emitido por: ${escHtml(state.currentUser ? state.currentUser.username : "ANAROSA")}</span><br/>
          <span>Fecha impresión: ${new Date().toLocaleDateString("es-PE")}</span>
        </div>
      </div>

      ${tpl.showIgv !== false ? `
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px;">
          <div style="padding:10px;border:1px solid #cbd5e1;border-radius:8px;background:#f8fafc;">
            <small style="display:block;font-size:9.5px;font-weight:700;color:#64748b;">REGISTROS</small>
            <strong style="font-size:15px;">${rows.length}</strong>
          </div>
          <div style="padding:10px;border:1px solid #cbd5e1;border-radius:8px;background:#f8fafc;">
            <small style="display:block;font-size:9.5px;font-weight:700;color:#64748b;">TOTAL FACTURADO</small>
            <strong style="font-size:15px;">${formatMoney(sumTotal)}</strong>
          </div>
          <div style="padding:10px;border:1px solid #cbd5e1;border-radius:8px;background:#f0fdf4;">
            <small style="display:block;font-size:9.5px;font-weight:700;color:#166534;">TOTAL COBRADO</small>
            <strong style="font-size:15px;color:#15803d;">${formatMoney(sumPagado)}</strong>
          </div>
          <div style="padding:10px;border:1px solid #cbd5e1;border-radius:8px;background:#fffbeb;">
            <small style="display:block;font-size:9.5px;font-weight:700;color:#92400e;">SALDO PENDIENTE</small>
            <strong style="font-size:15px;color:#b45309;">${formatMoney(sumSaldo)}</strong>
          </div>
        </div>
      ` : ""}

      <table style="width:100%;border-collapse:collapse;font-size:10.5px;">
        <thead>
          <tr style="background:#f1f5f9;border-bottom:1.5px solid #334155;">
            <th style="padding:6px;text-align:left;">TICKET</th>
            <th style="padding:6px;text-align:left;">FECHA</th>
            <th style="padding:6px;text-align:left;">CLIENTE</th>
            <th style="padding:6px;text-align:left;">DESCRIPCIÓN DE REPUESTOS</th>
            <th style="padding:6px;text-align:center;">UND</th>
            <th style="padding:6px;text-align:right;">TOTAL</th>
            <th style="padding:6px;text-align:right;">PAGADO</th>
            <th style="padding:6px;text-align:right;">SALDO</th>
          </tr>
        </thead>
        <tbody>
          ${rows.length === 0
            ? `<tr><td colspan="8" style="padding:20px;text-align:center;color:#64748b;">Sin ventas en este periodo.</td></tr>`
            : rows.map(r => {
                const s = Math.max(0, (Number(r.total) || 0) - (Number(r.pagado) || 0));
                return `<tr style="border-bottom:1px solid #e2e8f0;">
                  <td style="padding:5px 6px;font-family:monospace;">${escHtml(r.ticket || "#" + r.id)}</td>
                  <td style="padding:5px 6px;">${formatDatePE(r.fecha)}</td>
                  <td style="padding:5px 6px;font-weight:700;">${escHtml(r.cliente)}</td>
                  <td style="padding:5px 6px;">${escHtml(r.descripcion)}</td>
                  <td style="padding:5px 6px;text-align:center;">${r.cantidad}</td>
                  <td style="padding:5px 6px;text-align:right;">${formatMoney(r.total)}</td>
                  <td style="padding:5px 6px;text-align:right;">${formatMoney(r.pagado)}</td>
                  <td style="padding:5px 6px;text-align:right;font-weight:700;">${formatMoney(s)}</td>
                </tr>`;
              }).join("")}
        </tbody>
      </table>

      <div style="margin-top:14px;padding-top:10px;border-top:1px dashed #94a3b8;display:flex;justify-content:space-between;font-size:10px;color:#475569;">
        <span>${escHtml(tpl.footer || "")}</span>
        <strong>${escHtml(tpl.promo || "")}</strong>
      </div>
    </div>
  `;
}

function openPrintReportModal() {
  if (!canUserPrint(state.currentUser)) {
    showToast("Tu usuario tiene desactivado el permiso de impresión", "warning");
    return;
  }
  const type = document.getElementById("report-period-type").value;
  const monthVal = document.getElementById("report-month-picker")?.value || getTodayLocalISO().slice(0, 7);
  const dayVal = document.getElementById("report-day-picker")?.value || getTodayLocalISO();

  let rows = [];
  let titlePeriod = "";
  if (type === "DIA") {
    rows = state.ventas.filter(v => (v.fecha || "") === dayVal);
    titlePeriod = `REPORTE DEL DÍA (${formatDatePE(dayVal)})`;
  } else if (type === "MENSUAL") {
    rows = state.ventas.filter(v => (v.fecha || "").startsWith(monthVal));
    titlePeriod = `REPORTE MENSUAL (${monthVal})`;
  } else if (type === "ANUAL") {
    const year = monthVal.split("-")[0] || String(new Date().getFullYear());
    rows = state.ventas.filter(v => (v.fecha || "").startsWith(year));
    titlePeriod = `REPORTE ANUAL (${year})`;
  } else if (type === "SEMANAL") {
    const today = new Date(getTodayLocalISO() + "T00:00:00");
    const weekAgo = new Date(today.getTime() - 7 * 86400000);
    rows = state.ventas.filter(v => {
      const d = new Date((v.fecha || "2026-01-01") + "T00:00:00");
      return d >= weekAgo && d <= today;
    });
    titlePeriod = "REPORTE SEMANAL (ÚLTIMOS 7 DÍAS)";
  } else {
    rows = getFilteredVentasForTable();
    titlePeriod = "REPORTE DE VENTAS (FILTRO ACTUAL)";
  }

  const reportHtml = generateA4ReportHTML(rows, titlePeriod);
  currentModalPrintContext = { mode: "a4", reportHtml };

  document.getElementById("modal-print-title").textContent = "Vista Previa de Reporte Oficial A4";
  document.getElementById("modal-print-subtitle").textContent = "Optimizado para hoja A4 o Guardar como PDF.";
  const switcher = document.getElementById("modal-ticket-type-switcher");
  switcher.classList.add("hidden");
  switcher.classList.remove("inline-flex");

  document.getElementById("print-report-area").innerHTML = reportHtml;
  const modal = document.getElementById("modal-print-report");
  modal.classList.remove("hidden");
  modal.classList.add("flex");
  refreshIcons();
}

function executePrintFromModal() {
  const cont = document.getElementById("impresion");
  if (currentModalPrintContext.mode === "a4") {
    applyPrintPageRule("a4");
    cont.className = "print-a4" + (adminConfig.printing.a4ColorMode === "bn" ? " bn" : "");
    cont.innerHTML = currentModalPrintContext.reportHtml;
  } else if (currentModalPrintContext.saleObj) {
    const paperW = adminConfig.printing.paperWidth === "58mm" ? "58mm" : "80mm";
    applyPrintPageRule(paperW);
    cont.className = paperW === "58mm" ? "print-58mm" : "print-80mm";
    cont.innerHTML = generateThermalTicketHTML(currentModalPrintContext.saleObj, currentModalPrintContext.ticketType);
  }
  window.print();
}

function closePrintReportModal() {
  const modal = document.getElementById("modal-print-report");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

// ============================================================================
// 10. ALMACÉN, COMPRAS, CLIENTES Y MODALES DE SEGURIDAD (5S)
// ============================================================================
function showConfirmActionModal({ type = "delete", title, message, detail, confirmText, onConfirm }) {
  if (confirmCountdownInterval) {
    clearInterval(confirmCountdownInterval);
    confirmCountdownInterval = null;
  }
  pendingConfirmAction = onConfirm;

  const modal = document.getElementById("modal-confirmacion-accion");
  const iconBox = document.getElementById("confirm-icon-box");
  const titleEl = document.getElementById("confirm-modal-title");
  const msgEl = document.getElementById("confirm-modal-message");
  const detailEl = document.getElementById("confirm-modal-detail");
  const btn = document.getElementById("confirm-modal-action-btn");

  titleEl.textContent = title || "Confirmar Acción";
  msgEl.textContent = message || "¿Estás seguro de continuar?";
  if (detail) {
    detailEl.textContent = detail;
    detailEl.classList.remove("hidden");
  } else {
    detailEl.classList.add("hidden");
  }

  btn.onclick = null;

  if (type === "delete") {
    iconBox.className = "w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3.5";
    iconBox.innerHTML = `<i data-lucide="trash-2" class="w-7 h-7"></i>`;
    const baseText = confirmText || "Eliminar";
    btn.disabled = true;
    btn.className = "flex-1 px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 bg-red-300 text-white cursor-not-allowed opacity-60";
    let countdown = 5;
    btn.innerHTML = `<span>${escHtml(baseText)} (${countdown}s)</span>`;

    confirmCountdownInterval = setInterval(() => {
      countdown--;
      if (countdown > 0) {
        btn.innerHTML = `<span>${escHtml(baseText)} (${countdown}s)</span>`;
      } else {
        clearInterval(confirmCountdownInterval);
        confirmCountdownInterval = null;
        btn.disabled = false;
        btn.className = "flex-1 px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white shadow-md";
        btn.innerHTML = `<i data-lucide="trash-2" class="w-4 h-4"></i><span>${escHtml(baseText)}</span>`;
        refreshIcons();
      }
    }, 1000);

    btn.onclick = () => {
      if (countdown > 0) return;
      const cb = pendingConfirmAction;
      closeConfirmActionModal();
      if (typeof cb === "function") cb();
    };
  } else {
    iconBox.className = "w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3.5";
    iconBox.innerHTML = `<i data-lucide="alert-triangle" class="w-7 h-7"></i>`;
    const baseText = confirmText || "Continuar";
    btn.disabled = false;
    btn.className = "flex-1 px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 btn-accent shadow-md";
    btn.innerHTML = `<i data-lucide="edit-3" class="w-4 h-4"></i><span>${escHtml(baseText)}</span>`;
    btn.onclick = () => {
      const cb = pendingConfirmAction;
      closeConfirmActionModal();
      if (typeof cb === "function") cb();
    };
  }

  modal.classList.remove("hidden");
  modal.classList.add("flex");
  refreshIcons();
}

function closeConfirmActionModal() {
  if (confirmCountdownInterval) {
    clearInterval(confirmCountdownInterval);
    confirmCountdownInterval = null;
  }
  pendingConfirmAction = null;
  const modal = document.getElementById("modal-confirmacion-accion");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

function openDuplicateProductModal(existingProd) {
  duplicatePendingProduct = existingProd;
  const code = existingProd.codigo || `COD${String(existingProd.id).padStart(7, "0")}`;
  document.getElementById("duplicate-prod-info").innerHTML = `
    <div class="font-bold text-gray-900 text-sm">${escHtml(existingProd.descripcion)}</div>
    <div class="text-[11px] text-gray-600">Código: <strong class="font-mono">${escHtml(code)}</strong> · Marca: <strong>${escHtml(existingProd.compatibilidad)}</strong></div>
    <div class="text-[11px] text-gray-600">Stock: <strong class="text-emerald-700">${existingProd.stock} ${escHtml(existingProd.und)}</strong> · P. Venta: <strong>${formatMoney(existingProd.pVenta)}</strong></div>
  `;
  const m = document.getElementById("modal-duplicado-producto");
  m.classList.remove("hidden");
  m.classList.add("flex");
  refreshIcons();
}

function closeDuplicateProductModal() {
  duplicatePendingProduct = null;
  const m = document.getElementById("modal-duplicado-producto");
  m.classList.add("hidden");
  m.classList.remove("flex");
}

function onDuplicateEditExistingProduct() {
  if (!duplicatePendingProduct) return;
  const prodId = duplicatePendingProduct.id;
  closeDuplicateProductModal();
  closeProductModal();
  confirmarEdicionProducto(prodId);
}

function openDuplicateClientModal(existingCli) {
  duplicatePendingClient = existingCli;
  const debtMap = getClientDebtMap();
  const dInfo = debtMap[existingCli.codigo.toUpperCase()] || { saldo: 0, pendingCount: 0 };
  document.getElementById("duplicate-client-info").innerHTML = `
    <div class="font-bold text-gray-900 text-sm">${escHtml(existingCli.codigo)} <span class="text-xs font-normal text-gray-500">(${escHtml(existingCli.origen)})</span></div>
    <div class="text-[11px] text-gray-600">Nombre: <strong>${escHtml(existingCli.nombre || "-")}</strong></div>
    <div class="text-[11px] text-gray-600">Deuda actual: <strong>${formatMoney(dInfo.saldo)}</strong></div>
  `;
  const m = document.getElementById("modal-duplicado-cliente");
  m.classList.remove("hidden");
  m.classList.add("flex");
  refreshIcons();
}

function closeDuplicateClientModal() {
  duplicatePendingClient = null;
  const m = document.getElementById("modal-duplicado-cliente");
  m.classList.add("hidden");
  m.classList.remove("flex");
}

function onDuplicateJumpToClient() {
  if (!duplicatePendingClient) return;
  const cod = duplicatePendingClient.codigo;
  closeDuplicateClientModal();
  jumpToClientSales(cod);
}

function renderAlmacenView() {
  const compraSel = document.getElementById("compra-producto-id");
  const prevVal = compraSel.value;
  compraSel.innerHTML = `<option value="">SELECCIONA REPUESTO O GASTO...</option>` +
    `<optgroup label="INGRESAR STOCK A REPUESTO">` +
    state.almacen.map(a => `<option value="PROD_${a.id}">${escHtml(a.descripcion)} (STOCK: ${a.stock})</option>`).join("") +
    `</optgroup>` +
    `<optgroup label="GASTOS OPERATIVOS DEL NEGOCIO">` +
    `<option value="GASTO_FLETE / ENCOMIENDA">GASTO: FLETE / ENCOMIENDA</option>` +
    `<option value="GASTO_MOVILIDAD / COMBUSTIBLE">GASTO: MOVILIDAD / COMBUSTIBLE</option>` +
    `<option value="GASTO_MATERIALES / EMBALAJE">GASTO: MATERIALES / EMBALAJE</option>` +
    `</optgroup>`;
  if (prevVal) compraSel.value = prevVal;

  const compraFecha = document.getElementById("compra-fecha");
  if (compraFecha && !compraFecha.value) compraFecha.value = getTodayLocalISO();

  const lowLimit = Number(adminConfig.workflow.lowStockThreshold) || 3;
  const lowStockCount = state.almacen.filter(a => Number(a.stock) <= lowLimit).length;
  document.getElementById("almacen-low-stock-count").textContent = lowStockCount;

  const canEditPrices = hasPermission("modificar_precios") || state.tempPriceOverride;
  const permBadge = document.getElementById("almacen-price-perm-badge");
  permBadge.className = canEditPrices
    ? "px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold"
    : "px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200 text-[11px] font-medium";
  permBadge.textContent = canEditPrices ? "Precios: Habilitados" : "Precios: Protegidos";

  const tbody = document.getElementById("almacen-table-body");
  const canManageAlmacen = hasPermission("modificar_precios") || isUserAdmin(state.currentUser);

  if (state.almacen.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="py-10 text-center text-gray-400 text-xs">Almacén sin repuestos registrados todavía.</td></tr>`;
  } else {
    tbody.innerHTML = state.almacen.map((item, idx) => {
      const pCompra = Number(item.pCompra) || 0;
      const pVenta = Number(item.pVenta) || 0;
      const ganancia = pVenta - pCompra;
      const isLow = Number(item.stock) <= lowLimit;
      const displayCode = item.codigo || `COD${String(item.id).padStart(7, "0")}`;

      return `
        <tr class="hover:bg-gray-50 transition">
          <td class="py-3 px-4 text-gray-400 font-mono text-xs">${idx + 1}</td>
          <td class="py-3 px-4">
            <div class="font-bold text-gray-900">${escHtml(item.descripcion)}</div>
            <div class="text-[10px] text-gray-400 font-mono">CÓDIGO: <strong class="text-gray-700">${escHtml(displayCode)}</strong></div>
          </td>
          <td class="py-3 px-4"><span class="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-[11px] font-semibold">${escHtml(item.compatibilidad)}</span></td>
          <td class="py-3 px-4 text-center">
            <span class="px-2.5 py-0.5 rounded-full font-bold tabular ${isLow ? "bg-red-100 text-red-800" : "bg-emerald-50 text-emerald-800"}">${item.stock} ${escHtml(item.und)}</span>
          </td>
          <td class="py-3 px-4 text-right text-gray-700 sensitive-amount tabular">${formatMoney(pCompra)}</td>
          <td class="py-3 px-4 text-right font-bold text-gray-900 tabular">${formatMoney(pVenta)}</td>
          <td class="py-3 px-4 text-right text-emerald-700 font-semibold sensitive-amount tabular">+${formatMoney(ganancia)}</td>
          <td class="py-3 px-4 text-gray-500 text-[11px]">
            <div class="text-gray-700">${escHtml(item.detalles || "")}</div>
            <div class="${isLow ? "text-red-600 font-medium" : "text-gray-400"}">${escHtml(item.observacion || "")}</div>
          </td>
          <td class="py-3 px-4 text-right whitespace-nowrap">
            ${canManageAlmacen ? `
              <div class="inline-flex items-center gap-1.5">
                <button onclick="confirmarEdicionProducto(${item.id})" class="px-2.5 py-1 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-700 text-[11px] font-semibold">Editar</button>
                <button onclick="attemptDeleteProduct(${item.id})" class="px-2.5 py-1 rounded-lg border border-red-200 bg-red-50/50 hover:bg-red-100 text-red-700 text-[11px] font-semibold">Eliminar</button>
              </div>
            ` : `<span class="text-[11px] text-gray-400 italic">Lectura</span>`}
          </td>
        </tr>
      `;
    }).join("");
  }

  const histContainer = document.getElementById("compras-history-container");
  if (state.compras.length === 0) {
    histContainer.innerHTML = `<p class="text-xs text-gray-500">Sin compras de mercadería registradas.</p>`;
  } else {
    histContainer.innerHTML = `
      <div class="overflow-x-auto border-t border-gray-100">
        <table class="w-full text-left text-xs">
          <thead>
            <tr class="border-b border-gray-200 text-gray-600">
              <th class="py-2.5 px-3">Concepto / Repuesto</th>
              <th class="py-2.5 px-3">Fecha</th>
              <th class="py-2.5 px-3 text-center">Cant.</th>
              <th class="py-2.5 px-3 text-right">Costo Unit.</th>
              <th class="py-2.5 px-3 text-right">Total</th>
              <th class="py-2.5 px-3">Proveedor / Observación</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            ${state.compras.map(c => `
              <tr>
                <td class="py-2.5 px-3 font-semibold text-gray-900">${escHtml(c.concepto)}</td>
                <td class="py-2.5 px-3 text-gray-600 tabular">${formatDatePE(c.fecha)}</td>
                <td class="py-2.5 px-3 text-center text-gray-600 tabular">${c.cantidad}</td>
                <td class="py-2.5 px-3 text-right text-gray-600 tabular">${formatMoney(c.costoUnit)}</td>
                <td class="py-2.5 px-3 text-right font-bold text-gray-900 tabular">${formatMoney(c.total)}</td>
                <td class="py-2.5 px-3 text-gray-500">${escHtml(c.descripcion || "-")}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }
  refreshIcons();
}

function onCompraProductSelect(val) {
  if (val && val.startsWith("PROD_")) {
    const id = Number(val.replace("PROD_", ""));
    const prod = state.almacen.find(a => a.id === id);
    if (prod) document.getElementById("compra-costo-unit").value = prod.pCompra || "";
  }
  updateCompraTotalPreview();
}

function updateCompraTotalPreview() {
  const cant = Number(document.getElementById("compra-cantidad")?.value) || 1;
  const costo = Number(document.getElementById("compra-costo-unit")?.value) || 0;
  const el = document.getElementById("compra-total-preview");
  if (el) el.innerHTML = `Total egreso: <strong>${formatMoney(cant * costo)}</strong>`;
}

async function handlePurchaseSubmit(e) {
  e.preventDefault();
  const selVal = document.getElementById("compra-producto-id").value;
  if (!selVal) return;

  const fecha = document.getElementById("compra-fecha").value || getTodayLocalISO();
  const cantidad = Number(document.getElementById("compra-cantidad").value) || 1;
  const costoUnit = Number(document.getElementById("compra-costo-unit").value) || 0;
  const total = cantidad * costoUnit;
  const proveedor = document.getElementById("compra-descripcion").value.trim();

  let repuestoId = null;
  let repuestoNombre = "";

  if (selVal.startsWith("PROD_")) {
    repuestoId = Number(selVal.replace("PROD_", ""));
    const prod = state.almacen.find(a => a.id === repuestoId);
    if (prod) {
      repuestoNombre = `COMPRA STOCK: ${prod.descripcion}`;
      const nuevoStock = (Number(prod.stock) || 0) + cantidad;
      const updateData = { stock: nuevoStock };
      if (costoUnit > 0 && (hasPermission("modificar_precios") || state.tempPriceOverride)) {
        updateData.p_compra = costoUnit;
      }
      if (supabaseClient) {
        await supabaseClient.from("almacen").update(updateData).eq("id", repuestoId);
      } else {
        prod.stock = nuevoStock;
        if (updateData.p_compra) prod.pCompra = costoUnit;
      }
    }
  } else {
    repuestoNombre = selVal.replace("GASTO_", "");
  }

  if (supabaseClient) {
    const { error } = await supabaseClient.from("compras").insert([{
      repuesto_id: repuestoId,
      repuesto_nombre: repuestoNombre,
      cantidad,
      costo_uni: costoUnit,
      total,
      fecha,
      proveedor
    }]);
    if (error) {
      showToast("Error registrando compra: " + error.message, "warning");
      return;
    }
    await syncFromSupabase(false);
  } else {
    const newId = state.compras.reduce((max, c) => Math.max(max, c.id), 0) + 1;
    state.compras.unshift({ id: newId, repuestoId, concepto: repuestoNombre, fecha, cantidad, costoUnit, total, descripcion: proveedor });
    saveLocalBackup();
    renderActiveTab();
  }

  document.getElementById("compra-descripcion").value = "";
  showToast(`Registrado: ${repuestoNombre}`, "success");
}

function getNextAvailableProductCode() {
  const used = new Set();
  state.almacen.forEach(item => {
    const m = (item.codigo || "").toUpperCase().match(/^COD(\d+)$/);
    if (m) used.add(parseInt(m[1], 10));
  });
  let c = 1;
  while (used.has(c)) c++;
  return `COD${String(c).padStart(7, "0")}`;
}

function openProductModal(editId = null) {
  const modal = document.getElementById("modal-producto");
  const canEditPrices = !editId || hasPermission("modificar_precios") || state.tempPriceOverride;
  const pCompraInput = document.getElementById("prod-pcompra");
  const pVentaInput = document.getElementById("prod-pventa");
  const lockWarn = document.getElementById("prod-price-lock-warning");
  const codigoInput = document.getElementById("prod-codigo");

  if (canEditPrices) {
    pCompraInput.removeAttribute("readonly");
    pVentaInput.removeAttribute("readonly");
    lockWarn.classList.add("hidden");
  } else {
    pCompraInput.setAttribute("readonly", "true");
    pVentaInput.setAttribute("readonly", "true");
    lockWarn.classList.remove("hidden");
  }

  if (editId) {
    const p = state.almacen.find(a => a.id === editId);
    if (!p) return;
    document.getElementById("modal-producto-title").textContent = `Editar Repuesto #${p.id}`;
    document.getElementById("prod-edit-id").value = p.id;
    codigoInput.value = p.codigo || `COD${String(p.id).padStart(7, "0")}`;
    document.getElementById("prod-descripcion").value = p.descripcion;
    document.getElementById("prod-compatibilidad").value = p.compatibilidad || "UNIVERSAL";
    document.getElementById("prod-und").value = (p.und || "UNIDAD").toUpperCase();
    document.getElementById("prod-stock").value = p.stock;
    pCompraInput.value = p.pCompra;
    pVentaInput.value = p.pVenta;
    document.getElementById("prod-detalles").value = p.detalles || "";
    document.getElementById("prod-observacion").value = p.observacion || "";
  } else {
    document.getElementById("modal-producto-title").textContent = "Nuevo Repuesto en Almacén";
    document.getElementById("prod-edit-id").value = "";
    codigoInput.value = getNextAvailableProductCode();
    document.getElementById("prod-descripcion").value = "";
    document.getElementById("prod-compatibilidad").value = "UNIVERSAL";
    document.getElementById("prod-und").value = "UNIDAD";
    document.getElementById("prod-stock").value = 1;
    pCompraInput.value = 0;
    pVentaInput.value = 0;
    document.getElementById("prod-detalles").value = "";
    document.getElementById("prod-observacion").value = "";
  }

  modal.classList.remove("hidden");
  modal.classList.add("flex");
  refreshIcons();
}

function promptAdminOverrideForPrices() {
  requestAdminAuthorization("Autorizar edición de precios en Almacén.", () => {
    state.tempPriceOverride = true;
    document.getElementById("prod-pcompra").removeAttribute("readonly");
    document.getElementById("prod-pventa").removeAttribute("readonly");
    document.getElementById("prod-price-lock-warning").classList.add("hidden");
    renderAlmacenView();
    showToast("Precios desbloqueados", "success");
  });
}

function closeProductModal() {
  const modal = document.getElementById("modal-producto");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

function confirmarEdicionProducto(productId) {
  const p = state.almacen.find(a => a.id === productId);
  if (!p) return;
  showConfirmActionModal({
    type: "edit",
    title: "Editar Repuesto en Almacén",
    message: `Vas a editar "${p.descripcion}".`,
    detail: `Stock: ${p.stock} ${p.und} · P. Venta: ${formatMoney(p.pVenta)}`,
    confirmText: "Editar Ficha",
    onConfirm: () => openProductModal(productId)
  });
}

function attemptDeleteProduct(productId) {
  const p = state.almacen.find(a => a.id === productId);
  if (!p) return;
  showConfirmActionModal({
    type: "delete",
    title: "Eliminar Repuesto de Almacén",
    message: `¿Eliminar permanentemente "${p.descripcion}"?`,
    detail: `Stock actual: ${p.stock} ${p.und}. Se borrará de Supabase.`,
    confirmText: "Eliminar Repuesto",
    onConfirm: () => executeDeleteProduct(productId)
  });
}

async function executeDeleteProduct(productId) {
  if (supabaseClient) {
    const { error } = await supabaseClient.from("almacen").delete().eq("id", productId);
    if (error) {
      showToast("Error eliminando repuesto: " + error.message, "warning");
      return;
    }
    await syncFromSupabase(false);
  } else {
    state.almacen = state.almacen.filter(a => a.id !== productId);
    saveLocalBackup();
    renderActiveTab();
  }
  showToast("Repuesto eliminado", "info");
}

async function handleProductSubmit(e) {
  e.preventDefault();
  const editId = document.getElementById("prod-edit-id").value;
  const codigo = (document.getElementById("prod-codigo").value || "").trim().toUpperCase() || getNextAvailableProductCode();
  const descripcion = document.getElementById("prod-descripcion").value.trim().toUpperCase();
  const compatibilidad = document.getElementById("prod-compatibilidad").value.trim().toUpperCase() || "UNIVERSAL";
  const und = document.getElementById("prod-und").value.trim().toUpperCase() || "UNIDAD";
  const stock = Number(document.getElementById("prod-stock").value) || 0;
  const pCompra = Number(document.getElementById("prod-pcompra").value) || 0;
  const pVenta = Number(document.getElementById("prod-pventa").value) || 0;
  const detalles = document.getElementById("prod-detalles").value.trim().toUpperCase();
  const observacion = document.getElementById("prod-observacion").value.trim();

  if (!editId) {
    const dup = state.almacen.find(a =>
      a.descripcion.trim().toUpperCase() === descripcion ||
      (a.codigo || `COD${String(a.id).padStart(7, "0")}`).toUpperCase() === codigo
    );
    if (dup) {
      openDuplicateProductModal(dup);
      return;
    }
  }

  // Conserva intacto el esquema actual de `almacen` guardando el código en `detalles`
  const detallesConCodigo = `[COD: ${codigo}] ${detalles}`.trim();
  const payload = {
    descripcion,
    compatibilidad,
    und,
    stock,
    p_compra: pCompra,
    p_venta: pVenta,
    detalles: detallesConCodigo,
    observacion
  };

  if (supabaseClient) {
    if (editId) {
      const { error } = await supabaseClient.from("almacen").update(payload).eq("id", Number(editId));
      if (error) { showToast("Error actualizando: " + error.message, "warning"); return; }
      showToast(`Repuesto "${descripcion}" actualizado`, "success");
    } else {
      const { error } = await supabaseClient.from("almacen").insert([payload]);
      if (error) { showToast("Error guardando: " + error.message, "warning"); return; }
      showToast(`Repuesto "${descripcion}" guardado`, "success");
    }
    await syncFromSupabase(false);
  } else {
    if (editId) {
      const idx = state.almacen.findIndex(a => a.id === Number(editId));
      if (idx !== -1) state.almacen[idx] = { ...state.almacen[idx], codigo, descripcion, compatibilidad, und, stock, pCompra, pVenta, detalles, observacion };
    } else {
      const newId = state.almacen.reduce((max, a) => Math.max(max, a.id), 0) + 1;
      state.almacen.push({ id: newId, codigo, descripcion, compatibilidad, und, stock, pCompra, pVenta, detalles, observacion });
    }
    saveLocalBackup();
    renderActiveTab();
  }
  closeProductModal();
}

// CLIENTES FRECUENTES
function renderClientesView() {
  const debtMap = getClientDebtMap();
  const clientsWithDebt = Object.values(debtMap).filter(d => d.saldo > 0 || d.pendingCount > 0);
  const totalDebtAll = clientsWithDebt.reduce((s, d) => s + d.saldo, 0);

  const banner = document.getElementById("clientes-header-debt-banner");
  if (clientsWithDebt.length === 0) {
    banner.innerHTML = `
      <div class="flex items-center gap-3 text-emerald-800 text-xs">
        <i data-lucide="check-circle" class="w-5 h-5 text-emerald-600"></i>
        <div><strong class="block text-sm">Sin clientes con deuda pendiente</strong><span>Todas las cuentas registradas están al día.</span></div>
      </div>
    `;
  } else {
    banner.innerHTML = `
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-amber-200/80">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center flex-shrink-0"><i data-lucide="bell-ring" class="w-5 h-5"></i></div>
          <div>
            <h2 class="text-sm font-bold text-gray-900">CLIENTES CON DEUDA PENDIENTE ("POR CANCELAR")</h2>
            <p class="text-xs text-amber-900">Hay <strong>${clientsWithDebt.length} cliente(s)</strong> con saldo pendiente.</p>
          </div>
        </div>
        <div class="text-right tabular">
          <span class="text-[11px] text-amber-800 block">Deuda Acumulada:</span>
          <span class="text-lg font-bold text-red-700">${formatMoney(totalDebtAll)}</span>
        </div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mt-3.5">
        ${clientsWithDebt.map(d => {
          const cliObj = state.clientes.find(c => c.codigo.toUpperCase() === d.codigo);
          const nombre = cliObj ? (cliObj.nombre || cliObj.telefono) : "CLIENTE REGISTRADO";
          const origen = cliObj ? cliObj.origen : "OTROS";
          return `
            <div onclick="jumpToClientSales('${escHtml(d.codigo)}')" class="bg-white border border-amber-200 hover:border-amber-400 rounded-xl p-3 flex items-center justify-between cursor-pointer transition">
              <div class="min-w-0 pr-2">
                <div class="font-bold text-gray-900 text-xs">${escHtml(d.codigo)} <span class="text-[10px] font-normal text-gray-500">(${escHtml(origen)})</span></div>
                <div class="text-[11px] text-gray-600 truncate">${escHtml(nombre)}</div>
              </div>
              <div class="text-right tabular">
                <div class="text-xs font-bold text-red-600">${formatMoney(d.saldo)}</div>
                <div class="text-[10px] text-amber-700">${d.pendingCount} pend.</div>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  document.getElementById("clientes-count-label").textContent = `${state.clientes.length} clientes frecuentes`;
  const isAdmin = isUserAdmin(state.currentUser) || hasPermission("eliminar_ventas");
  const tbody = document.getElementById("clientes-directory-tbody");

  if (state.clientes.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="py-10 text-center text-gray-400 text-xs">Sin clientes frecuentes registrados aún.</td></tr>`;
  } else {
    tbody.innerHTML = state.clientes.map(c => {
      const dInfo = debtMap[c.codigo.toUpperCase()] || { totalComprado: 0, saldo: 0, pendingCount: 0 };
      const hasDebt = dInfo.saldo > 0 || dInfo.pendingCount > 0;
      return `
        <tr class="hover:bg-gray-50 transition">
          <td class="py-3 px-4 font-bold text-gray-900">${escHtml(c.codigo)}</td>
          <td class="py-3 px-4 text-gray-800">${escHtml(c.nombre || c.telefono || "-")}</td>
          <td class="py-3 px-4"><span class="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-[10px] font-bold">${escHtml(c.origen)}</span></td>
          <td class="py-3 px-4 text-gray-500">${escHtml(c.telefono || "-")}</td>
          <td class="py-3 px-4 text-right font-semibold text-gray-800 tabular">${formatMoney(dInfo.totalComprado)}</td>
          <td class="py-3 px-4 text-right tabular">
            ${hasDebt
              ? `<span class="px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 font-bold text-[11px]">${formatMoney(dInfo.saldo)}</span>`
              : `<span class="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px]">Al día</span>`}
          </td>
          <td class="py-3 px-4 text-right whitespace-nowrap">
            <button onclick="jumpToClientSales('${escHtml(c.codigo)}')" class="text-xs text-blue-600 hover:underline mr-2 font-semibold">Historial</button>
            ${isAdmin ? `<button onclick="attemptDeleteClient(${c.id})" class="text-xs text-red-500 hover:underline">Eliminar</button>` : ""}
          </td>
        </tr>
      `;
    }).join("");
  }
  refreshIcons();
}

async function handleAddClient(e) {
  e.preventDefault();
  const codigo = document.getElementById("new-client-codigo").value.trim().toUpperCase();
  const origen = document.getElementById("new-client-origen").value.trim().toUpperCase();
  const nombre = document.getElementById("new-client-nombre").value.trim().toUpperCase();
  const telefono = document.getElementById("new-client-telefono").value.trim().toUpperCase();
  if (!codigo) return;

  const dup = state.clientes.find(c => c.codigo.toUpperCase() === codigo);
  if (dup) {
    openDuplicateClientModal(dup);
    return;
  }

  const infoContacto = telefono ? `${nombre} (${telefono})` : nombre;
  if (supabaseClient) {
    const { error } = await supabaseClient.from("clientes").insert([{ cod: codigo, origen, telefono: infoContacto }]);
    if (error) { showToast("Error guardando cliente: " + error.message, "warning"); return; }
    await syncFromSupabase(false);
  } else {
    const newId = state.clientes.reduce((max, c) => Math.max(max, c.id), 0) + 1;
    state.clientes.push({ id: newId, codigo, origen, nombre: infoContacto, telefono: infoContacto });
    saveLocalBackup();
    renderActiveTab();
  }

  ["new-client-codigo", "new-client-origen", "new-client-nombre", "new-client-telefono"].forEach(id => {
    document.getElementById(id).value = "";
  });
  showToast(`Cliente ${codigo} guardado`, "success");
}

function attemptDeleteClient(id) {
  const c = state.clientes.find(x => x.id === id);
  if (!c) return;
  showConfirmActionModal({
    type: "delete",
    title: "Eliminar Cliente Frecuente",
    message: `¿Eliminar al cliente "${c.codigo}"?`,
    detail: "Los registros históricos de ventas se conservarán intactos.",
    confirmText: "Eliminar Cliente",
    onConfirm: async () => {
      if (supabaseClient) {
        await supabaseClient.from("clientes").delete().eq("id", id);
        await syncFromSupabase(false);
      } else {
        state.clientes = state.clientes.filter(x => x.id !== id);
        saveLocalBackup();
        renderActiveTab();
      }
      showToast("Cliente eliminado", "info");
    }
  });
}

// ============================================================================
// 11. MI BILLETERA PERSONAL DIARIA (PRIVADA POR USUARIO) + CATEGORÍAS ADMIN
// ============================================================================
function getCurrentUserWalletStorageKey() {
  if (!state.currentUser || !state.currentUser.username) return null;
  return WALLET_PREFIX_KEY + String(state.currentUser.username).trim().toLowerCase();
}

function loadMyWalletEntries() {
  const key = getCurrentUserWalletStorageKey();
  if (!key) return [];
  try {
    const raw = localStorage.getItem(key);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    return [];
  }
}

function saveMyWalletEntries(entries) {
  const key = getCurrentUserWalletStorageKey();
  if (!key) return;
  try {
    localStorage.setItem(key, JSON.stringify(entries));
  } catch (e) {}
}

function setWalletFormType(type) {
  const isGasto = type !== "INGRESO";
  document.getElementById("wallet-entry-type").value = isGasto ? "GASTO" : "INGRESO";

  const btnGasto = document.getElementById("wallet-type-gasto-btn");
  const btnIng = document.getElementById("wallet-type-ingreso-btn");
  if (isGasto) {
    btnGasto.className = "py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 bg-rose-600 text-white shadow";
    btnIng.className = "py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 text-gray-600";
  } else {
    btnIng.className = "py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 bg-emerald-600 text-white shadow";
    btnGasto.className = "py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 text-gray-600";
  }

  renderWalletCategorySelectorChips();
}

function addQuickWalletAmount(delta) {
  const inp = document.getElementById("wallet-amount");
  const cur = Number(inp.value) || 0;
  inp.value = (cur + delta).toFixed(2);
}

function selectWalletCategoryChip(catId) {
  document.getElementById("wallet-selected-cat").value = catId;
  const cat = adminConfig.walletCategories.find(c => c.id === catId);
  const lbl = document.getElementById("wallet-selected-cat-label");
  if (lbl) lbl.textContent = cat ? cat.name : "Selecciona una";
  renderWalletCategorySelectorChips();
}

function renderWalletCategorySelectorChips() {
  const grid = document.getElementById("wallet-category-grid");
  if (!grid) return;
  const currentType = document.getElementById("wallet-entry-type")?.value || "GASTO";
  let selectedId = document.getElementById("wallet-selected-cat")?.value || "";

  const available = adminConfig.walletCategories.filter(c => c.type === currentType || c.type === "AMBOS");
  if (!available.some(c => c.id === selectedId) && available[0]) {
    selectedId = available[0].id;
    document.getElementById("wallet-selected-cat").value = selectedId;
    const lbl = document.getElementById("wallet-selected-cat-label");
    if (lbl) lbl.textContent = available[0].name;
  }

  grid.innerHTML = available.map(c => {
    const isAct = c.id === selectedId;
    return `
      <button
        type="button"
        onclick="selectWalletCategoryChip('${escHtml(c.id)}')"
        style="--cat-color: ${escHtml(c.color)}"
        class="wallet-cat-chip ${isAct ? "active" : ""}"
      >
        <span class="wallet-cat-icon"><i data-lucide="${escHtml(c.icon || "tag")}" class="w-4 h-4"></i></span>
        <span class="leading-tight line-clamp-2">${escHtml(c.name)}</span>
      </button>
    `;
  }).join("");
  refreshIcons();
}

function setWalletPeriodFilter(period) {
  state.walletPeriod = period;
  document.querySelectorAll("#wallet-period-pills [data-wp]").forEach(btn => {
    const act = btn.dataset.wp === period;
    btn.className = act
      ? "px-3 py-1.5 rounded-xl text-xs font-bold btn-accent"
      : "px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-100 text-gray-700";
  });
  renderWalletView();
}

function resetWalletForm() {
  document.getElementById("wallet-edit-id").value = "";
  document.getElementById("wallet-amount").value = "";
  document.getElementById("wallet-note").value = "";
  document.getElementById("wallet-date").value = getTodayLocalISO();
  document.getElementById("wallet-method").value = "EFECTIVO";
  document.getElementById("wallet-form-heading").textContent = "ANOTAR MOVIMIENTO EN MI BILLETERA";
  document.getElementById("wallet-cancel-edit-btn").classList.add("hidden");
  setWalletFormType("GASTO");
}

function handleWalletSubmit(e) {
  e.preventDefault();
  if (!state.currentUser) return;

  const editId = document.getElementById("wallet-edit-id").value;
  const type = document.getElementById("wallet-entry-type").value || "GASTO";
  const amount = Math.max(0, Number(document.getElementById("wallet-amount").value) || 0);
  const catId = document.getElementById("wallet-selected-cat").value;
  const method = document.getElementById("wallet-method").value;
  const date = document.getElementById("wallet-date").value || getTodayLocalISO();
  const note = document.getElementById("wallet-note").value.trim();

  if (amount <= 0) {
    showToast("Ingresa un monto válido mayor a S/ 0.00", "warning");
    return;
  }
  const catObj = adminConfig.walletCategories.find(c => c.id === catId) || adminConfig.walletCategories[0];

  const entries = loadMyWalletEntries();
  if (editId) {
    const idx = entries.findIndex(x => String(x.id) === String(editId));
    if (idx !== -1) {
      entries[idx] = {
        ...entries[idx],
        type,
        amount,
        catId: catObj.id,
        catName: catObj.name,
        catColor: catObj.color,
        catIcon: catObj.icon,
        method,
        date,
        note
      };
    }
    showToast("Apunte actualizado en tu billetera", "success");
  } else {
    entries.unshift({
      id: Date.now(),
      type,
      amount,
      catId: catObj.id,
      catName: catObj.name,
      catColor: catObj.color,
      catIcon: catObj.icon,
      method,
      date,
      note,
      createdAt: new Date().toISOString()
    });
    showToast(type === "INGRESO" ? `+ ${formatMoney(amount)} sumado a tu billetera` : `Gasto de ${formatMoney(amount)} anotado`, "success");
  }

  saveMyWalletEntries(entries);
  resetWalletForm();
  renderWalletView();
}

function editMyWalletEntry(entryId) {
  const entries = loadMyWalletEntries();
  const item = entries.find(x => String(x.id) === String(entryId));
  if (!item) return;

  setWalletFormType(item.type);
  document.getElementById("wallet-edit-id").value = item.id;
  document.getElementById("wallet-amount").value = item.amount;
  document.getElementById("wallet-selected-cat").value = item.catId;
  document.getElementById("wallet-method").value = item.method || "EFECTIVO";
  document.getElementById("wallet-date").value = item.date || getTodayLocalISO();
  document.getElementById("wallet-note").value = item.note || "";
  document.getElementById("wallet-form-heading").textContent = "EDITANDO APUNTE PERSONAL";
  document.getElementById("wallet-cancel-edit-btn").classList.remove("hidden");
  renderWalletCategorySelectorChips();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteMyWalletEntry(entryId) {
  const entries = loadMyWalletEntries().filter(x => String(x.id) !== String(entryId));
  saveMyWalletEntries(entries);
  renderWalletView();
  showToast("Apunte eliminado de tu billetera", "info");
}

function renderWalletView() {
  if (!state.currentUser) return;

  document.getElementById("wallet-owner-pill").textContent = `BILLETERA PRIVADA DE ${state.currentUser.username.toUpperCase()} · SOLO TÚ LA VES`;
  const wDate = document.getElementById("wallet-date");
  if (wDate && !wDate.value) wDate.value = getTodayLocalISO();

  renderWalletCategorySelectorChips();

  // Poblar filtro de categorías
  const catSelect = document.getElementById("wallet-filter-cat");
  const prevCat = catSelect.value || "ALL";
  catSelect.innerHTML = `<option value="ALL">TODAS LAS CATEGORÍAS</option>` +
    adminConfig.walletCategories.map(c => `<option value="${escHtml(c.id)}">${escHtml(c.name)}</option>`).join("");
  if (prevCat === "ALL" || adminConfig.walletCategories.some(c => c.id === prevCat)) catSelect.value = prevCat;

  const allEntries = loadMyWalletEntries();
  const totalHistoricalIncome = allEntries.filter(x => x.type === "INGRESO").reduce((s, x) => s + (Number(x.amount) || 0), 0);
  const totalHistoricalExpense = allEntries.filter(x => x.type === "GASTO").reduce((s, x) => s + (Number(x.amount) || 0), 0);
  const currentWalletBalance = totalHistoricalIncome - totalHistoricalExpense;

  const todayIso = getTodayLocalISO();
  const monthPrefix = todayIso.slice(0, 7);
  const weekAgoDate = new Date(new Date(todayIso + "T00:00:00").getTime() - 7 * 86400000);

  const periodFiltered = allEntries.filter(x => {
    const d = x.date || todayIso;
    if (state.walletPeriod === "HOY") return d === todayIso;
    if (state.walletPeriod === "MES") return d.startsWith(monthPrefix);
    if (state.walletPeriod === "SEMANA") {
      const dt = new Date(d + "T00:00:00");
      return dt >= weekAgoDate;
    }
    return true;
  });

  const periodInc = periodFiltered.filter(x => x.type === "INGRESO").reduce((s, x) => s + (Number(x.amount) || 0), 0);
  const periodExp = periodFiltered.filter(x => x.type === "GASTO").reduce((s, x) => s + (Number(x.amount) || 0), 0);

  document.getElementById("wallet-balance-hero").textContent = formatMoney(currentWalletBalance);
  document.getElementById("wallet-income-period").textContent = `+ ${formatMoney(periodInc)}`;
  document.getElementById("wallet-expense-period").textContent = `- ${formatMoney(periodExp)}`;

  // Desglose por categoría de gasto en el periodo
  const expensesOnly = periodFiltered.filter(x => x.type === "GASTO");
  const sumExp = expensesOnly.reduce((s, x) => s + (Number(x.amount) || 0), 0);
  document.getElementById("wallet-breakdown-total-lbl").textContent = `Total gastado: ${formatMoney(sumExp)}`;

  const byCat = {};
  expensesOnly.forEach(x => {
    const cat = adminConfig.walletCategories.find(c => c.id === x.catId);
    const key = x.catId || x.catName || "otros";
    if (!byCat[key]) {
      byCat[key] = {
        name: cat ? cat.name : (x.catName || "OTROS"),
        color: cat ? cat.color : (x.catColor || "#f59e0b"),
        icon: cat ? cat.icon : (x.catIcon || "tag"),
        total: 0
      };
    }
    byCat[key].total += Number(x.amount) || 0;
  });

  const sortedCats = Object.values(byCat).sort((a, b) => b.total - a.total);
  const stackedBar = document.getElementById("wallet-stacked-bar");
  const breakdownBox = document.getElementById("wallet-category-breakdown");

  if (sortedCats.length === 0) {
    stackedBar.innerHTML = `<div class="w-full h-full bg-gray-200 dark:bg-slate-700"></div>`;
    breakdownBox.innerHTML = `<p class="col-span-full text-xs text-gray-500">Aún no registraste gastos personales en este periodo.</p>`;
  } else {
    stackedBar.innerHTML = sortedCats.map(c => {
      const pct = Math.max(2, (c.total / sumExp) * 100);
      return `<div style="width:${pct.toFixed(1)}%;background:${escHtml(c.color)}" title="${escHtml(c.name)}: ${formatMoney(c.total)}"></div>`;
    }).join("");

    breakdownBox.innerHTML = sortedCats.map(c => {
      const pct = ((c.total / sumExp) * 100).toFixed(1);
      return `
        <div class="p-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between gap-2">
          <div class="flex items-center gap-2.5 min-w-0">
            <span class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style="background:${escHtml(c.color)}22;color:${escHtml(c.color)}">
              <i data-lucide="${escHtml(c.icon)}" class="w-4 h-4"></i>
            </span>
            <div class="min-w-0">
              <div class="font-bold text-gray-900 truncate text-[11px]">${escHtml(c.name)}</div>
              <div class="text-[10px] text-gray-500 tabular">${pct}% de tus gastos</div>
            </div>
          </div>
          <strong class="text-gray-900 font-bold tabular whitespace-nowrap">${formatMoney(c.total)}</strong>
        </div>
      `;
    }).join("");
  }

  // Lista historial día a día
  const catFilterVal = catSelect.value || "ALL";
  const finalHistory = periodFiltered
    .filter(x => catFilterVal === "ALL" || x.catId === catFilterVal)
    .sort((a, b) => (b.date || "").localeCompare(a.date || "") || b.id - a.id);

  document.getElementById("wallet-history-count").textContent = `${finalHistory.length} mov.`;
  const listEl = document.getElementById("wallet-history-list");

  if (finalHistory.length === 0) {
    listEl.innerHTML = `<div class="p-8 text-center text-xs text-gray-400">No tienes movimientos personales en este filtro. Usa el panel para anotar tus gastos o ingresos del día.</div>`;
  } else {
    listEl.innerHTML = finalHistory.map(item => {
      const isInc = item.type === "INGRESO";
      const cat = adminConfig.walletCategories.find(c => c.id === item.catId);
      const color = cat ? cat.color : (item.catColor || (isInc ? "#10b981" : "#f59e0b"));
      const icon = cat ? cat.icon : (item.catIcon || (isInc ? "trending-up" : "shopping-bag"));
      const catName = cat ? cat.name : (item.catName || "GENERAL");

      return `
        <div class="p-3.5 rounded-2xl bg-gray-50/80 border border-gray-200 flex items-center justify-between gap-3">
          <div class="flex items-center gap-3 min-w-0">
            <span class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background:${escHtml(color)}22;color:${escHtml(color)}">
              <i data-lucide="${escHtml(icon)}" class="w-5 h-5"></i>
            </span>
            <div class="min-w-0">
              <div class="font-bold text-gray-900 text-xs truncate">${escHtml(item.note || catName)}</div>
              <div class="text-[11px] text-gray-500 flex flex-wrap items-center gap-1.5 mt-0.5">
                <span class="font-semibold" style="color:${escHtml(color)}">${escHtml(catName)}</span>
                <span>· ${escHtml(item.method || "EFECTIVO")}</span>
                <span>· ${formatDatePE(item.date)}</span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0">
            <span class="font-display font-bold text-sm tabular ${isInc ? "text-emerald-600" : "text-rose-600"}">
              ${isInc ? "+" : "-"} ${formatMoney(item.amount)}
            </span>
            <button type="button" onclick="editMyWalletEntry('${item.id}')" class="p-1.5 text-gray-400 hover:text-amber-600 rounded-lg" title="Editar"><i data-lucide="edit-2" class="w-3.5 h-3.5"></i></button>
            <button type="button" onclick="deleteMyWalletEntry('${item.id}')" class="p-1.5 text-gray-400 hover:text-red-600 rounded-lg" title="Eliminar"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
          </div>
        </div>
      `;
    }).join("");
  }
  refreshIcons();
}

function exportMyWalletCSV() {
  if (!state.currentUser) return;
  const entries = loadMyWalletEntries();
  let csv = "Fecha,Tipo,Categoria,Medio,Monto,Concepto\n";
  entries.forEach(x => {
    csv += `${x.date},${x.type},"${x.catName || ""}","${x.method || ""}",${x.amount},"${String(x.note || "").replace(/"/g, '""')}"\n`;
  });
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Mi_Billetera_${state.currentUser.username}_${getTodayLocalISO()}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  showToast("CSV de tu billetera personal descargado", "success");
}

// ADMINISTRACIÓN DE CATEGORÍAS DE GASTOS (SOLO VISTA DEL ADMINISTRADOR)
function renderWalletCategoriesAdminView() {
  if (!isUserAdmin(state.currentUser)) return;

  const selectedIcon = document.getElementById("cat-icon-input").value || "utensils";
  const iconGrid = document.getElementById("cat-icon-picker-grid");
  iconGrid.innerHTML = CATEGORY_ICONS.map(ico => {
    const act = ico === selectedIcon;
    return `
      <button
        type="button"
        onclick="selectAdminCategoryIcon('${ico}')"
        class="h-9 rounded-xl border flex items-center justify-center ${act ? "btn-accent border-transparent" : "border-gray-200 bg-gray-50 text-gray-600"}"
        title="${ico}"
      >
        <i data-lucide="${ico}" class="w-4 h-4"></i>
      </button>
    `;
  }).join("");

  const listEl = document.getElementById("admin-categories-list");
  listEl.innerHTML = adminConfig.walletCategories.map(cat => `
    <div class="p-3.5 rounded-2xl border border-gray-200 bg-gray-50/70 flex items-center justify-between gap-3">
      <div class="flex items-center gap-3 min-w-0">
        <span class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background:${escHtml(cat.color)}22;color:${escHtml(cat.color)}">
          <i data-lucide="${escHtml(cat.icon || "tag")}" class="w-5 h-5"></i>
        </span>
        <div class="min-w-0">
          <div class="font-bold text-gray-900 text-xs truncate">${escHtml(cat.name)}</div>
          <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600">${escHtml(cat.type)}</span>
        </div>
      </div>
      <div class="flex items-center gap-1 flex-shrink-0">
        <button type="button" onclick="loadWalletCategoryIntoForm('${escHtml(cat.id)}')" class="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Editar"><i data-lucide="edit" class="w-4 h-4"></i></button>
        <button type="button" onclick="deleteWalletCategory('${escHtml(cat.id)}')" class="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Eliminar"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
      </div>
    </div>
  `).join("");
  refreshIcons();
}

function selectAdminCategoryIcon(iconName) {
  document.getElementById("cat-icon-input").value = iconName;
  renderWalletCategoriesAdminView();
}

function loadWalletCategoryIntoForm(catId) {
  const cat = adminConfig.walletCategories.find(c => c.id === catId);
  if (!cat) return;
  document.getElementById("cat-form-title").textContent = `EDITANDO: ${cat.name}`;
  document.getElementById("cat-edit-id").value = cat.id;
  document.getElementById("cat-name-input").value = cat.name;
  document.getElementById("cat-type-input").value = cat.type;
  document.getElementById("cat-color-input").value = cat.color || "#f59e0b";
  document.getElementById("cat-icon-input").value = cat.icon || "utensils";
  renderWalletCategoriesAdminView();
}

function resetWalletCategoryForm() {
  document.getElementById("cat-form-title").textContent = "CREAR NUEVA CATEGORÍA";
  document.getElementById("cat-edit-id").value = "";
  document.getElementById("cat-name-input").value = "";
  document.getElementById("cat-type-input").value = "GASTO";
  document.getElementById("cat-color-input").value = "#f59e0b";
  document.getElementById("cat-icon-input").value = "utensils";
  renderWalletCategoriesAdminView();
}

function handleSaveWalletCategory(e) {
  e.preventDefault();
  const editId = document.getElementById("cat-edit-id").value;
  const name = document.getElementById("cat-name-input").value.trim().toUpperCase();
  const type = document.getElementById("cat-type-input").value;
  const color = document.getElementById("cat-color-input").value || "#f59e0b";
  const icon = document.getElementById("cat-icon-input").value || "utensils";
  if (!name) return;

  if (editId) {
    const idx = adminConfig.walletCategories.findIndex(c => c.id === editId);
    if (idx !== -1) adminConfig.walletCategories[idx] = { id: editId, name, type, color, icon };
    showToast(`Categoría "${name}" actualizada`, "success");
  } else {
    adminConfig.walletCategories.push({
      id: "cat_" + Date.now().toString(36),
      name,
      type,
      color,
      icon
    });
    showToast(`Categoría "${name}" agregada`, "success");
  }

  saveAdminConfig();
  resetWalletCategoryForm();
}

function deleteWalletCategory(catId) {
  if (adminConfig.walletCategories.length <= 2) {
    showToast("Debes mantener al menos 2 categorías activas", "warning");
    return;
  }
  adminConfig.walletCategories = adminConfig.walletCategories.filter(c => c.id !== catId);
  saveAdminConfig();
  renderWalletCategoriesAdminView();
  showToast("Categoría eliminada", "info");
}

function restoreDefaultWalletCategories() {
  adminConfig.walletCategories = JSON.parse(JSON.stringify(DEFAULT_WALLET_CATEGORIES));
  saveAdminConfig();
  renderWalletCategoriesAdminView();
  showToast("Categorías predeterminadas restauradas", "success");
}

// ============================================================================
// 12. PANEL DE ADMINISTRACIÓN (USUARIOS/ICONOS, IMPRESIÓN, MARCA, PRIVACIDAD)
// ============================================================================
function switchAdminSubtab(subId) {
  state.adminSubtab = subId;
  document.querySelectorAll("#admin-subtabs-nav [data-admtab]").forEach(btn => {
    const act = btn.dataset.admtab === subId;
    btn.className = act
      ? "px-3.5 py-2 rounded-xl font-bold btn-accent flex items-center gap-1.5"
      : "px-3.5 py-2 rounded-xl font-semibold text-gray-600 hover:bg-gray-100 flex items-center gap-1.5";
  });
  document.querySelectorAll("#view-administracion .adm-subtab").forEach(panel => {
    panel.classList.toggle("hidden", panel.id !== subId);
  });
  renderAdministracionView();
}

function renderAdministracionView() {
  if (!isUserAdmin(state.currentUser)) return;
  renderUsuariosAdminTable();
  populateAdminPrinterForm();
  populateAdminBrandForm();
  populateAdminPrivacyForm();
  refreshIcons();
}

// 12.1 USUARIOS E ICONOS
function updateUserFormAvatarPreview() {
  const prev = document.getElementById("user-form-avatar-preview");
  if (!prev) return;
  const uName = document.getElementById("user-form-username")?.value || "U";
  if (state.tempUserFormAvatar) {
    prev.innerHTML = `<img src="${escHtml(state.tempUserFormAvatar)}" alt="Avatar" />`;
  } else {
    prev.innerHTML = escHtml(getInitials(uName));
  }
}

async function pickUserFormAvatar() {
  const picked = await openImageCropperModal({
    title: "Icono / Foto del Usuario (1:1)",
    subtitle: "Elige un icono rápido o sube y recorta una foto cuadrada.",
    initialUrl: state.tempUserFormAvatar
  });
  if (picked) {
    state.tempUserFormAvatar = picked;
    updateUserFormAvatarPreview();
  }
}

function clearUserFormAvatar() {
  state.tempUserFormAvatar = "";
  updateUserFormAvatarPreview();
}

async function changeUserAvatarDirect(username) {
  const currentUrl = getUserAvatarUrl(username);
  const picked = await openImageCropperModal({
    title: `Cambiar Icono de ${username}`,
    subtitle: "Elige un icono o recorta una imagen en formato cuadrado 1:1.",
    initialUrl: currentUrl
  });
  if (picked !== null) {
    if (picked) adminConfig.userAvatars[username.trim().toLowerCase()] = picked;
    saveAdminConfig();
    updateUserUI();
    renderLoginUserCards();
    renderUsuariosAdminTable();
    showToast(`Icono actualizado para ${username}`, "success");
  }
}

async function openSelfAvatarPicker() {
  if (!state.currentUser) return;
  if (!adminConfig.privacy.allowSelfAvatar && !isUserAdmin(state.currentUser)) {
    showToast("El administrador restringió el cambio de icono personal", "warning");
    return;
  }
  await changeUserAvatarDirect(state.currentUser.username);
}

function toggleRevealTablePassword(userId) {
  state.revealedUserPasswords[userId] = !state.revealedUserPasswords[userId];
  renderUsuariosAdminTable();
}

function toggleUserPrintAuth(username) {
  if (username.toUpperCase() === "WILLOSIRIS") return;
  const key = username.trim().toLowerCase();
  const current = key in adminConfig.userPrintPerm ? Boolean(adminConfig.userPrintPerm[key]) : true;
  adminConfig.userPrintPerm[key] = !current;
  saveAdminConfig();
  renderUsuariosAdminTable();
  showToast(`Impresión ${!current ? "habilitada" : "desactivada"} para ${username}`, "info");
}

function renderUsuariosAdminTable() {
  const tbody = document.getElementById("usuarios-table-body");
  if (!tbody) return;
  const maskPass = Boolean(adminConfig.privacy.maskPasswords);

  tbody.innerHTML = state.usuarios.map(u => {
    const canPrint = canUserPrint(u);
    const showClear = !maskPass || Boolean(state.revealedUserPasswords[u.id]);
    const isRoot = u.username.toUpperCase() === "WILLOSIRIS";

    return `
      <tr class="hover:bg-gray-50 transition">
        <td class="py-3 px-4">
          <div class="flex items-center gap-2.5">
            <button type="button" onclick="changeUserAvatarDirect('${escHtml(u.username)}')" title="Cambiar icono de este usuario">
              ${renderUserAvatarHtml(u.username)}
            </button>
            <div>
              <div class="font-bold text-gray-900 font-sans">${escHtml(u.username)}</div>
              <div class="text-[10px] text-gray-500">${escHtml(u.role)}</div>
            </div>
          </div>
        </td>
        <td class="py-3 px-3 font-mono text-xs">
          <div class="inline-flex items-center gap-1.5">
            <span>${showClear ? escHtml(u.password) : "••••••"}</span>
            ${maskPass ? `<button type="button" onclick="toggleRevealTablePassword(${u.id})" class="text-gray-400 hover:text-gray-700"><i data-lucide="${showClear ? "eye-off" : "eye"}" class="w-3.5 h-3.5"></i></button>` : ""}
          </div>
        </td>
        <td class="py-3 px-3">
          <button type="button" onclick="toggleUserPrintAuth('${escHtml(u.username)}')" class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${canPrint ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}">
            ${canPrint ? "ACTIVA" : "BLOQUEADA"}
          </button>
        </td>
        <td class="py-3 px-2 text-center">
          <input type="checkbox" ${u.permissions.eliminar_ventas ? "checked" : ""} ${isRoot ? "disabled" : ""} onchange="toggleUserPerm(${u.id}, 'eliminar_ventas', this.checked)" class="rounded" />
        </td>
        <td class="py-3 px-2 text-center">
          <input type="checkbox" ${u.permissions.modificar_precios ? "checked" : ""} ${isRoot ? "disabled" : ""} onchange="toggleUserPerm(${u.id}, 'modificar_precios', this.checked)" class="rounded" />
        </td>
        <td class="py-3 px-2 text-center">
          <input type="checkbox" ${u.permissions.acceso_sql ? "checked" : ""} ${isRoot ? "disabled" : ""} onchange="toggleUserPerm(${u.id}, 'acceso_sql', this.checked)" class="rounded" />
        </td>
        <td class="py-3 px-2 text-center">
          <input type="checkbox" ${u.permissions.gestionar_usuarios ? "checked" : ""} ${isRoot ? "disabled" : ""} onchange="toggleUserPerm(${u.id}, 'gestionar_usuarios', this.checked)" class="rounded" />
        </td>
        <td class="py-3 px-4 text-right whitespace-nowrap">
          <button onclick="confirmarEdicionUsuario(${u.id})" class="text-xs text-blue-600 hover:underline mr-2 font-semibold">Editar</button>
          ${!isRoot ? `<button onclick="attemptDeleteUser(${u.id})" class="text-xs text-red-600 hover:underline">Eliminar</button>` : ""}
        </td>
      </tr>
    `;
  }).join("");
  refreshIcons();
}

function confirmarEdicionUsuario(userId) {
  const usr = state.usuarios.find(u => u.id === userId);
  if (!usr) return;
  showConfirmActionModal({
    type: "edit",
    title: "Editar Usuario",
    message: `Cargar datos de "${usr.username}" para edición.`,
    confirmText: "Cargar Usuario",
    onConfirm: () => loadUserIntoForm(userId)
  });
}

function loadUserIntoForm(userId) {
  const usr = state.usuarios.find(u => u.id === userId);
  if (!usr) return;
  document.getElementById("user-form-title").textContent = `EDITANDO: ${usr.username}`;
  document.getElementById("edit-user-id").value = usr.id;
  document.getElementById("user-form-username").value = usr.username;
  document.getElementById("user-form-password").value = usr.password;
  document.getElementById("user-form-role").value = usr.role;
  document.getElementById("perm-imprimir").checked = canUserPrint(usr);
  document.getElementById("perm-eliminar-ventas").checked = Boolean(usr.permissions.eliminar_ventas);
  document.getElementById("perm-modificar-precios").checked = Boolean(usr.permissions.modificar_precios);
  document.getElementById("perm-acceso-sql").checked = Boolean(usr.permissions.acceso_sql);
  document.getElementById("perm-gestionar-usuarios").checked = Boolean(usr.permissions.gestionar_usuarios);
  state.tempUserFormAvatar = getUserAvatarUrl(usr.username);
  updateUserFormAvatarPreview();
}

function resetUserForm() {
  document.getElementById("user-form-title").textContent = "AGREGAR NUEVO USUARIO";
  document.getElementById("edit-user-id").value = "";
  document.getElementById("user-form-username").value = "";
  document.getElementById("user-form-password").value = "";
  document.getElementById("user-form-role").value = "";
  document.getElementById("perm-imprimir").checked = true;
  document.getElementById("perm-eliminar-ventas").checked = false;
  document.getElementById("perm-modificar-precios").checked = false;
  document.getElementById("perm-acceso-sql").checked = false;
  document.getElementById("perm-gestionar-usuarios").checked = false;
  state.tempUserFormAvatar = "";
  updateUserFormAvatarPreview();
}

async function handleSaveUser(e) {
  e.preventDefault();
  const editId = document.getElementById("edit-user-id").value;
  const username = document.getElementById("user-form-username").value.trim();
  const password = document.getElementById("user-form-password").value.trim();
  const role = document.getElementById("user-form-role").value.trim().toUpperCase();
  const printAllowed = document.getElementById("perm-imprimir").checked;
  const permissions = {
    eliminar_ventas: document.getElementById("perm-eliminar-ventas").checked,
    modificar_precios: document.getElementById("perm-modificar-precios").checked,
    acceso_sql: document.getElementById("perm-acceso-sql").checked,
    gestionar_usuarios: document.getElementById("perm-gestionar-usuarios").checked
  };

  // Guardar icono y permiso de impresión localmente sin alterar columnas de `usuarios` en Supabase
  const uKey = username.toLowerCase();
  if (state.tempUserFormAvatar) adminConfig.userAvatars[uKey] = state.tempUserFormAvatar;
  else delete adminConfig.userAvatars[uKey];
  adminConfig.userPrintPerm[uKey] = printAllowed;
  saveAdminConfig();

  // Payload 100% compatible con la tabla `usuarios` existente
  const dbPayload = {
    username,
    password,
    rol: role,
    perm_delete_sales: permissions.eliminar_ventas,
    perm_edit_prices: permissions.modificar_precios,
    perm_sql: permissions.acceso_sql,
    perm_users: permissions.gestionar_usuarios
  };

  if (supabaseClient) {
    if (editId) {
      await supabaseClient.from("usuarios").update(dbPayload).eq("id", Number(editId));
      showToast(`Usuario ${username} actualizado`, "success");
    } else {
      await supabaseClient.from("usuarios").insert([dbPayload]);
      showToast(`Usuario ${username} creado`, "success");
    }
    await syncFromSupabase(false);
  } else {
    if (editId) {
      const idx = state.usuarios.findIndex(u => u.id === Number(editId));
      if (idx !== -1) state.usuarios[idx] = { ...state.usuarios[idx], username, password, role, permissions };
    } else {
      const newId = state.usuarios.reduce((max, u) => Math.max(max, u.id), 0) + 1;
      state.usuarios.push({ id: newId, username, password, role, permissions });
    }
    saveLocalBackup();
  }

  resetUserForm();
  updateUserUI();
  renderUsuariosAdminTable();
}

async function toggleUserPerm(userId, permKey, val) {
  const usr = state.usuarios.find(u => u.id === userId);
  if (!usr || usr.username.toUpperCase() === "WILLOSIRIS") return;
  usr.permissions[permKey] = Boolean(val);

  if (supabaseClient) {
    await supabaseClient.from("usuarios").update({
      perm_delete_sales: usr.permissions.eliminar_ventas,
      perm_edit_prices: usr.permissions.modificar_precios,
      perm_sql: usr.permissions.acceso_sql,
      perm_users: usr.permissions.gestionar_usuarios
    }).eq("id", userId);
    await syncFromSupabase(false);
  } else {
    saveLocalBackup();
  }
  showToast(`Permisos actualizados para ${usr.username}`, "success");
}

function attemptDeleteUser(userId) {
  const usr = state.usuarios.find(u => u.id === userId);
  if (!usr || usr.username.toUpperCase() === "WILLOSIRIS") return;
  showConfirmActionModal({
    type: "delete",
    title: "Eliminar Usuario",
    message: `¿Eliminar permanentemente a "${usr.username}"?`,
    detail: "Perderá acceso inmediato al sistema.",
    confirmText: "Eliminar Usuario",
    onConfirm: async () => {
      if (supabaseClient) {
        await supabaseClient.from("usuarios").delete().eq("id", userId);
        await syncFromSupabase(false);
      } else {
        state.usuarios = state.usuarios.filter(u => u.id !== userId);
        saveLocalBackup();
      }
      renderUsuariosAdminTable();
      showToast(`Usuario ${usr.username} eliminado`, "info");
    }
  });
}

// 12.2 CONFIGURACIÓN Y VISTA PREVIA DE IMPRESIÓN EN VIVO
function switchPrinterTemplateTab(tplKey) {
  readPrinterFormIntoConfig();
  state.editingPrinterTpl = tplKey;
  document.querySelectorAll("#tpl-editor-tabs [data-tpltab]").forEach(btn => {
    const act = btn.dataset.tpltab === tplKey;
    btn.className = act ? "px-2.5 py-1.5 rounded-lg text-[11px] font-bold btn-accent" : "px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-gray-600";
  });
  populateAdminPrinterForm();
}

function populateAdminPrinterForm() {
  const imp = adminConfig.printing;
  const tplKey = state.editingPrinterTpl || "cliente";
  const tpl = imp.templates[tplKey] || createDefaultPrinterTemplate(tplKey);

  document.getElementById("sw-usar-ticket-cliente").checked = Boolean(imp.usarTicketCliente);
  document.getElementById("sw-auto-print-sale").checked = Boolean(imp.autoPrintOnSale);
  document.getElementById("cfg-paper-width").value = imp.paperWidth || "80mm";
  document.getElementById("cfg-a4-color").value = imp.a4ColorMode || "color";
  document.getElementById("lbl-ticket-mode-active").textContent = imp.usarTicketCliente
    ? "Modo activo: Ticket Comprobante para Cliente"
    : "Modo activo: Ticket de Control Interno y Despacho";

  document.getElementById("tkt-brand-title").value = tpl.brandTitle || "";
  document.getElementById("tkt-brand-sub").value = tpl.brandSub || "";
  document.getElementById("tkt-ruc-line").value = tpl.rucLine || "";
  document.getElementById("tkt-address").value = tpl.address || "";
  document.getElementById("tkt-city").value = tpl.city || "";
  document.getElementById("tkt-phone").value = tpl.phone || "";
  document.getElementById("tkt-doc-title").value = tpl.docTitle || "";
  document.getElementById("tkt-font-size").value = tpl.fontSize || 12;
  document.getElementById("tkt-footer").value = tpl.footer || "";
  document.getElementById("tkt-promo").value = tpl.promo || "";
  document.getElementById("sw-tkt-logo").checked = tpl.showLogo !== false;
  document.getElementById("sw-tkt-igv").checked = Boolean(tpl.showIgv);
  document.getElementById("sw-tkt-barcode").checked = tpl.showBarcode !== false;

  renderPrinterLivePreview();
}

function readPrinterFormIntoConfig() {
  const imp = adminConfig.printing;
  const tplKey = state.editingPrinterTpl || "cliente";
  imp.usarTicketCliente = document.getElementById("sw-usar-ticket-cliente").checked;
  imp.autoPrintOnSale = document.getElementById("sw-auto-print-sale").checked;
  imp.paperWidth = document.getElementById("cfg-paper-width").value || "80mm";
  imp.a4ColorMode = document.getElementById("cfg-a4-color").value || "color";

  imp.templates[tplKey] = {
    brandTitle: document.getElementById("tkt-brand-title").value.trim().toUpperCase(),
    brandSub: document.getElementById("tkt-brand-sub").value.trim().toUpperCase(),
    rucLine: document.getElementById("tkt-ruc-line").value.trim().toUpperCase(),
    address: document.getElementById("tkt-address").value.trim().toUpperCase(),
    city: document.getElementById("tkt-city").value.trim().toUpperCase(),
    phone: document.getElementById("tkt-phone").value.trim().toUpperCase(),
    docTitle: document.getElementById("tkt-doc-title").value.trim().toUpperCase(),
    fontSize: Math.max(10, Math.min(16, Number(document.getElementById("tkt-font-size").value) || 12)),
    footer: document.getElementById("tkt-footer").value.trim().toUpperCase(),
    promo: document.getElementById("tkt-promo").value.trim().toUpperCase(),
    showLogo: document.getElementById("sw-tkt-logo").checked,
    showIgv: document.getElementById("sw-tkt-igv").checked,
    showBarcode: document.getElementById("sw-tkt-barcode").checked
  };
}

function onPrinterConfigLiveChange() {
  readPrinterFormIntoConfig();
  document.getElementById("lbl-ticket-mode-active").textContent = adminConfig.printing.usarTicketCliente
    ? "Modo activo: Ticket Comprobante para Cliente"
    : "Modo activo: Ticket de Control Interno y Despacho";
  renderPrinterLivePreview();
}

function renderPrinterLivePreview() {
  const box = document.getElementById("printer-live-preview-box");
  const badge = document.getElementById("live-preview-badge");
  if (!box) return;
  const tplKey = state.editingPrinterTpl || "cliente";

  if (badge) {
    badge.textContent = tplKey === "a4" ? "HOJA A4" : tplKey === "interno" ? "CONTROL INTERNO" : "TICKET CLIENTE";
  }

  const demoSale = {
    id: 108,
    ticket: "TK-000108",
    fecha: getTodayLocalISO(),
    cliente: "#27 FLOTA SUR",
    origen: "JULIACA",
    descripcion: "2X FILTRO DE PETROLEO (S/90.00) + 1X PASTILLA DE FRENO (S/65.00)",
    cantidad: 3,
    total: 155,
    pagado: 100,
    estado: "Por Cancelar",
    observacion: "Entrega inmediata en mostrador",
    items: [
      { cantidad: 2, descripcion: "FILTRO DE PETRÓLEO VOLKSWAGEN", subtotal: 90 },
      { cantidad: 1, descripcion: "JUEGO PASTILLAS DE FRENO", subtotal: 65 }
    ]
  };

  if (tplKey === "a4") {
    box.innerHTML = generateA4ReportHTML([demoSale], "VISTA PREVIA DE REPORTE A4");
  } else {
    box.innerHTML = generateThermalTicketHTML(demoSale, tplKey);
  }
}

function savePrinterTemplateConfig(e) {
  e.preventDefault();
  readPrinterFormIntoConfig();
  saveAdminConfig();
  showToast("Configuración y diseño de comprobantes guardados", "success");
}

function testPrintCurrentTemplate() {
  readPrinterFormIntoConfig();
  saveAdminConfig();
  const tplKey = state.editingPrinterTpl || "cliente";
  const demoSale = {
    id: 108,
    ticket: "TK-000108",
    fecha: getTodayLocalISO(),
    cliente: "#27 FLOTA SUR",
    origen: "JULIACA",
    cantidad: 3,
    total: 155,
    pagado: 155,
    estado: "Cancelado",
    items: [
      { cantidad: 2, descripcion: "FILTRO DE PETRÓLEO VOLKSWAGEN", subtotal: 90 },
      { cantidad: 1, descripcion: "JUEGO PASTILLAS DE FRENO", subtotal: 65 }
    ]
  };
  if (tplKey === "a4") {
    applyPrintPageRule("a4");
    const cont = document.getElementById("impresion");
    cont.className = "print-a4";
    cont.innerHTML = generateA4ReportHTML([demoSale], "PRUEBA DE IMPRESIÓN A4");
    window.print();
  } else {
    printSaleTicketDirect(demoSale, tplKey);
  }
}

// 12.3 IDENTIDAD, ICONO DE PESTAÑA (FAVICON) Y LOGO
function populateAdminBrandForm() {
  document.getElementById("cfg-brand-name").value = adminConfig.brand.name || "ANAROSA";
  document.getElementById("cfg-brand-sub").value = adminConfig.brand.subtitle || "REPUESTOS Y ACCESORIOS";
  document.getElementById("cfg-brand-ruc").value = adminConfig.brand.ruc || "";
  applyBrandIdentityToDOM();
}

function saveBrandIdentityForm(e) {
  e.preventDefault();
  adminConfig.brand.name = document.getElementById("cfg-brand-name").value.trim().toUpperCase() || "ANAROSA";
  adminConfig.brand.subtitle = document.getElementById("cfg-brand-sub").value.trim().toUpperCase() || "REPUESTOS Y ACCESORIOS";
  adminConfig.brand.ruc = document.getElementById("cfg-brand-ruc").value.trim();
  saveAdminConfig();
  applyBrandIdentityToDOM();
  showToast("Identidad comercial actualizada", "success");
}

async function changeBrandLogo() {
  const picked = await openImageCropperModal({
    title: "Cambiar Logo Principal (1:1)",
    subtitle: "Sube tu logo (PNG transparente o JPG) o selecciona un emblema.",
    initialUrl: adminConfig.brand.logoDataUrl
  });
  if (picked) {
    adminConfig.brand.logoDataUrl = picked;
    saveAdminConfig();
    applyBrandIdentityToDOM();
    renderPrinterLivePreview();
    showToast("Logo principal actualizado", "success");
  }
}

async function changePageFavicon() {
  const picked = await openImageCropperModal({
    title: "Cambiar Icono de la Pestaña (Favicon)",
    subtitle: "Selecciona o recorta el icono que aparecerá en la pestaña del navegador.",
    initialUrl: adminConfig.brand.faviconDataUrl
  });
  if (picked) {
    adminConfig.brand.faviconDataUrl = picked;
    saveAdminConfig();
    applyBrandIdentityToDOM();
    showToast("Icono de la pestaña (Favicon) actualizado", "success");
  }
}

function restoreDefaultBranding() {
  adminConfig.brand.logoDataUrl = "";
  adminConfig.brand.faviconDataUrl = "favicon.svg";
  adminConfig.brand.name = "ANAROSA";
  adminConfig.brand.subtitle = "REPUESTOS Y ACCESORIOS";
  saveAdminConfig();
  populateAdminBrandForm();
  showToast("Logo e icono originales restaurados", "info");
}

// 12.4 PRIVACIDAD Y MÉTODO DE TRABAJO
function populateAdminPrivacyForm() {
  const p = adminConfig.privacy;
  const w = adminConfig.workflow;
  document.getElementById("cfg-inactivity-minutes").value = String(p.inactivityMinutes ?? 15);
  document.getElementById("cfg-mask-passwords").checked = Boolean(p.maskPasswords);
  document.getElementById("cfg-lockout-3-tries").checked = Boolean(p.lockoutAfter3Tries);
  document.getElementById("cfg-privacy-blur-default").checked = Boolean(p.privacyBlurDefault);
  document.getElementById("cfg-show-login-cards").checked = Boolean(p.showLoginCards);
  document.getElementById("cfg-allow-self-avatar").checked = Boolean(p.allowSelfAvatar);

  document.getElementById("cfg-post-sale-flow").value = w.postSaleFlow || "MODAL";
  document.getElementById("cfg-default-pay-mode").value = w.defaultPayMode || "CREDITO";
  document.getElementById("cfg-low-stock-threshold").value = String(w.lowStockThreshold || 3);
  document.getElementById("cfg-stock-mode").value = w.stockMode || "STRICT";
  document.getElementById("cfg-numpad-mode").value = w.numpadMode || "AUTO_TOUCH";
}

function savePrivacyAndWorkflowSettings() {
  adminConfig.privacy = {
    inactivityMinutes: Number(document.getElementById("cfg-inactivity-minutes").value ?? 15),
    maskPasswords: document.getElementById("cfg-mask-passwords").checked,
    lockoutAfter3Tries: document.getElementById("cfg-lockout-3-tries").checked,
    privacyBlurDefault: document.getElementById("cfg-privacy-blur-default").checked,
    showLoginCards: document.getElementById("cfg-show-login-cards").checked,
    allowSelfAvatar: document.getElementById("cfg-allow-self-avatar").checked
  };
  adminConfig.workflow = {
    postSaleFlow: document.getElementById("cfg-post-sale-flow").value,
    defaultPayMode: document.getElementById("cfg-default-pay-mode").value,
    lowStockThreshold: Math.max(1, Number(document.getElementById("cfg-low-stock-threshold").value) || 3),
    stockMode: document.getElementById("cfg-stock-mode").value,
    numpadMode: document.getElementById("cfg-numpad-mode").value
  };
  saveAdminConfig();
  startInactivityMonitor(false);
  renderLoginUserCards();
  renderUsuariosAdminTable();
  showToast("Privacidad y método de trabajo actualizados", "success");
}

function exportSafeLocalBackupJSON() {
  const payload = {
    exportedAt: new Date().toISOString(),
    adminConfig,
    data: {
      almacen: state.almacen,
      clientes: state.clientes,
      ventas: state.ventas,
      compras: state.compras
    }
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Respaldo_ANAROSA_${getTodayLocalISO()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  showToast("Respaldo JSON descargado con éxito", "success");
}

// ============================================================================
// 13. RECORTADOR INTERACTIVO 1:1 (ESTILO JUANCHOS · PNG TRANSPARENTE)
// ============================================================================
let cropperResolver = null;
let cropperImgObj = null;
let cropperBaseScale = 1;
let cropperZoom = 1;
let cropperOffX = 0;
let cropperOffY = 0;
let cropperDragging = false;
let cropperStartX = 0;
let cropperStartY = 0;

function openImageCropperModal({ title, subtitle, initialUrl = "" }) {
  return new Promise(resolve => {
    cropperResolver = resolve;
    document.getElementById("cropper-modal-title").textContent = title || "Seleccionar Icono o Imagen 1:1";
    document.getElementById("cropper-modal-sub").textContent = subtitle || "Elige un icono rápido o recorta tu imagen.";

    const presetGrid = document.getElementById("cropper-preset-icons");
    presetGrid.innerHTML = PRESET_AVATARS.map((p, idx) => `
      <button type="button" onclick="selectPresetCropperIcon(${idx})" class="p-1.5 rounded-xl border border-gray-200 hover:border-amber-500 flex flex-col items-center gap-1 bg-gray-50">
        <img src="${escHtml(p.url)}" alt="${p.label}" class="w-10 h-10 rounded-lg" />
        <span class="text-[9px] font-bold text-gray-600">${p.label}</span>
      </button>
    `).join("");

    cropperImgObj = null;
    cropperZoom = 1;
    cropperOffX = 0;
    cropperOffY = 0;
    document.getElementById("cropper-zoom-range").value = "1";
    const canvas = document.getElementById("cropper-canvas");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (initialUrl) loadCropperImageSrc(initialUrl);

    const modal = document.getElementById("modal-image-cropper");
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    refreshIcons();
  });
}

function selectPresetCropperIcon(idx) {
  const p = PRESET_AVATARS[idx];
  if (!p) return;
  closeImageCropper(p.url);
}

function loadCropperImageSrc(src) {
  const img = new Image();
  img.onload = () => {
    const canvas = document.getElementById("cropper-canvas");
    cropperImgObj = img;
    cropperBaseScale = Math.max(canvas.width / img.width, canvas.height / img.height);
    cropperZoom = 1;
    cropperOffX = 0;
    cropperOffY = 0;
    document.getElementById("cropper-zoom-range").value = "1";
    drawCropperCanvas();
  };
  img.src = src;
}

function onCropperFileSelected(e) {
  const file = e.target.files && e.target.files[0];
  e.target.value = "";
  if (!file || !file.type.startsWith("image/")) return;
  const reader = new FileReader();
  reader.onload = ev => loadCropperImageSrc(String(ev.target?.result || ""));
  reader.readAsDataURL(file);
}

function onCropperZoomChange(val) {
  cropperZoom = parseFloat(val) || 1;
  drawCropperCanvas();
}

function drawCropperCanvas() {
  const canvas = document.getElementById("cropper-canvas");
  if (!canvas || !cropperImgObj) return;
  const ctx = canvas.getContext("2d");
  const size = canvas.width;
  const w = cropperImgObj.width * cropperBaseScale * cropperZoom;
  const h = cropperImgObj.height * cropperBaseScale * cropperZoom;
  const maxX = Math.max(0, (w - size) / 2);
  const maxY = Math.max(0, (h - size) / 2);
  cropperOffX = Math.min(maxX, Math.max(-maxX, cropperOffX));
  cropperOffY = Math.min(maxY, Math.max(-maxY, cropperOffY));

  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(cropperImgObj, (size - w) / 2 + cropperOffX, (size - h) / 2 + cropperOffY, w, h);
}

function initCropperDragEvents() {
  const canvas = document.getElementById("cropper-canvas");
  if (!canvas) return;
  canvas.addEventListener("pointerdown", e => {
    if (!cropperImgObj) return;
    cropperDragging = true;
    cropperStartX = e.clientX - cropperOffX;
    cropperStartY = e.clientY - cropperOffY;
    try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
  });
  canvas.addEventListener("pointermove", e => {
    if (!cropperDragging || !cropperImgObj) return;
    cropperOffX = e.clientX - cropperStartX;
    cropperOffY = e.clientY - cropperStartY;
    drawCropperCanvas();
  });
  canvas.addEventListener("pointerup", () => { cropperDragging = false; });
}

function confirmImageCropper() {
  if (!cropperImgObj) {
    showToast("Elige un icono rápido arriba o selecciona una imagen", "warning");
    return;
  }
  drawCropperCanvas();
  const canvas = document.getElementById("cropper-canvas");
  closeImageCropper(canvas.toDataURL("image/png"));
}

function closeImageCropper(resultVal) {
  const modal = document.getElementById("modal-image-cropper");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
  if (cropperResolver) {
    const fn = cropperResolver;
    cropperResolver = null;
    fn(resultVal);
  }
}

// ============================================================================
// 14. SUPABASE SQL Y EXPORTACIÓN CSV COMERCIAL
// ============================================================================
function renderSupabaseView() {
  const gate = document.getElementById("supabase-lock-gate");
  const content = document.getElementById("supabase-unlocked-content");
  if (state.supabaseGateUnlocked || hasPermission("acceso_sql")) {
    gate.classList.add("hidden");
    content.classList.remove("hidden");
    generateSQLScript();
  } else {
    gate.classList.remove("hidden");
    content.classList.add("hidden");
  }
  updateUserUI();
}

function handleUnlockSupabaseGate(e) {
  e.preventDefault();
  const u = document.getElementById("sql-gate-user").value.trim();
  const p = document.getElementById("sql-gate-pass").value;
  const validAdmin = state.usuarios.find(
    usr => usr.username.toLowerCase() === u.toLowerCase() && usr.password === p &&
    (usr.permissions.acceso_sql || isUserAdmin(usr))
  );
  if (!validAdmin) {
    showToast("Credenciales sin autorización SQL", "warning");
    return;
  }
  state.supabaseGateUnlocked = true;
  document.getElementById("sql-gate-pass").value = "";
  renderSupabaseView();
  showToast("Panel Supabase SQL desbloqueado", "success");
}

function generateSQLScript() {
  const sql = `-- ESQUEMA OFICIAL ANAROSA (NO DESTRUCTIVO - RESPETA TUS DATOS EXISTENTES)
CREATE TABLE IF NOT EXISTS almacen (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  descripcion TEXT NOT NULL,
  compatibilidad TEXT DEFAULT 'GENERAL',
  stock INT NOT NULL DEFAULT 0,
  und TEXT DEFAULT 'Unidad',
  p_compra NUMERIC(10,2) DEFAULT 0,
  p_venta NUMERIC(10,2) DEFAULT 0,
  detalles TEXT DEFAULT '',
  observacion TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clientes (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  origen TEXT NOT NULL,
  cod TEXT NOT NULL UNIQUE,
  telefono TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ventas (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  ticket TEXT,
  descripcion TEXT NOT NULL,
  cantidad NUMERIC(10,2) NOT NULL DEFAULT 1,
  precio_uni NUMERIC(10,2) NOT NULL DEFAULT 0,
  precio_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  pagado NUMERIC(10,2) NOT NULL DEFAULT 0,
  fecha DATE DEFAULT CURRENT_DATE,
  cliente TEXT NOT NULL,
  origen TEXT DEFAULT '',
  estado TEXT NOT NULL DEFAULT 'Por Cancelar',
  observacion TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS compras (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  repuesto_id BIGINT REFERENCES almacen(id) ON DELETE SET NULL,
  repuesto_nombre TEXT NOT NULL,
  cantidad INT NOT NULL DEFAULT 1,
  costo_uni NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  fecha DATE DEFAULT CURRENT_DATE,
  proveedor TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS usuarios (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  rol TEXT NOT NULL,
  perm_delete_sales BOOLEAN DEFAULT FALSE,
  perm_edit_prices BOOLEAN DEFAULT FALSE,
  perm_sql BOOLEAN DEFAULT FALSE,
  perm_users BOOLEAN DEFAULT FALSE
);`;
  const area = document.getElementById("supabase-sql-code");
  if (area) area.value = sql;
}

function copySupabaseSQL() {
  const textarea = document.getElementById("supabase-sql-code");
  navigator.clipboard?.writeText(textarea.value).catch(() => {
    textarea.select();
    document.execCommand("copy");
  });
  const fb = document.getElementById("copy-sql-feedback");
  fb.classList.remove("hidden");
  setTimeout(() => fb.classList.add("hidden"), 2500);
  showToast("Script SQL copiado", "success");
}

async function saveSupabaseCredentials(e) {
  e.preventDefault();
  const url = document.getElementById("sb-url-input").value.trim();
  const key = document.getElementById("sb-key-input").value.trim();
  if (!url || !key) {
    showToast("Completa Project URL y Publishable Key", "warning");
    return;
  }
  localStorage.setItem("anarosa_sb_url", url);
  localStorage.setItem("anarosa_sb_key", key);
  initSupabaseClient();
  await syncFromSupabase(true);
}

function exportAllToCSV() {
  let csv = "Nro,Ticket,Fecha,Cliente,Origen,Repuesto,Cantidad,Precio Unitario,Total,Pagado,Saldo,Estado,Observacion\n";
  state.ventas.forEach(v => {
    const saldo = Math.max(0, (Number(v.total) || 0) - (Number(v.pagado) || 0));
    csv += `${v.id},"${v.ticket || ""}",${v.fecha},"${v.cliente}","${v.origen || ""}","${v.descripcion}",${v.cantidad},${v.precioUnit},${v.total},${v.pagado},${saldo},"${v.estado}","${(v.observacion || "").replace(/"/g, '""')}"\n`;
  });
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Reporte_ANAROSA_Repuestos_${getTodayLocalISO()}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  showToast("CSV comercial descargado", "success");
}

// ============================================================================
// 15. MOTOR DE SCROLL ESTILO ARTCRAFT (REGLA DE PRECISIÓN + ODÓMETRO + REVEAL)
// ============================================================================
let revealObserver = null;
let scrollRafPending = false;
let rulerDigitCols = [];

function initArtcraftScrollEngine() {
  // 1. Construir marcas de precisión en la regla lateral
  const ticksWrap = document.getElementById("artcraft-ruler-ticks");
  if (ticksWrap) {
    let ticksHtml = "";
    for (let i = 0; i <= 24; i++) {
      ticksHtml += `<span class="${i % 6 === 0 ? "major" : ""}"></span>`;
    }
    ticksWrap.innerHTML = ticksHtml;
  }

  // 2. Construir odómetro de 3 dígitos rodantes (000 - 100)
  const digitsWrap = document.getElementById("ruler-digits-wrap");
  if (digitsWrap) {
    digitsWrap.innerHTML = [0, 1, 2].map(() => `
      <span class="ruler-digit-col">
        ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<span>${n}</span>`).join("")}
      </span>
    `).join("");
    rulerDigitCols = Array.from(digitsWrap.querySelectorAll(".ruler-digit-col"));
  }

  // 3. Scrub interactivo en la regla lateral (PC)
  const ruler = document.getElementById("artcraft-ruler");
  if (ruler) {
    let scrubbing = false;
    const scrubToClientY = clientY => {
      const rect = ruler.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientY - rect.top) / Math.max(1, rect.height)));
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      window.scrollTo({ top: ratio * maxScroll, behavior: "auto" });
    };
    ruler.addEventListener("pointerdown", e => {
      scrubbing = true;
      try { ruler.setPointerCapture(e.pointerId); } catch (_) {}
      scrubToClientY(e.clientY);
    });
    ruler.addEventListener("pointermove", e => {
      if (scrubbing) scrubToClientY(e.clientY);
    });
    ruler.addEventListener("pointerup", () => { scrubbing = false; });
  }

  // 4. Listener pasivo con requestAnimationFrame (cero bloqueo de main thread)
  const onScrollOrResize = () => {
    if (scrollRafPending) return;
    scrollRafPending = true;
    requestAnimationFrame(() => {
      scrollRafPending = false;
      updateArtcraftScrollTelemetry();
    });
  };

  window.addEventListener("scroll", onScrollOrResize, { passive: true });
  window.addEventListener("resize", onScrollOrResize, { passive: true });
  updateArtcraftScrollTelemetry();
  observeScrollReveals();
}

function updateArtcraftScrollTelemetry() {
  const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const current = Math.max(0, window.scrollY || window.pageYOffset || 0);
  const progress = maxScroll > 4 ? Math.min(1, current / maxScroll) : 0;

  const topBar = document.getElementById("scroll-progress-bar");
  if (topBar) {
    topBar.style.transform = `scaleX(${progress.toFixed(4)})`;
  }

  const ruler = document.getElementById("artcraft-ruler");
  const marker = document.getElementById("artcraft-ruler-marker");
  if (ruler && marker) {
    const trackH = Math.max(0, ruler.clientHeight - 18);
    const yPx = progress * trackH;
    marker.style.transform = `translate3d(0, ${yPx.toFixed(1)}px, 0)`;
  }

  const pct = Math.round(progress * 100);
  const digitsStr = String(pct).padStart(3, "0");
  if (rulerDigitCols.length === 3) {
    for (let i = 0; i < 3; i++) {
      const d = Number(digitsStr[i]) || 0;
      rulerDigitCols[i].style.transform = `translate3d(0, -${d * 1.05}em, 0)`;
    }
  }
}

function observeScrollReveals() {
  if (revealObserver) revealObserver.disconnect();

  // Asignar retardos decrecientes no uniformes en grupos ([data-reveal-group])
  const activeSection = document.getElementById(`view-${state.currentTab}`);
  if (!activeSection) return;

  activeSection.querySelectorAll("[data-reveal-group]").forEach(group => {
    const delays = [0, 45, 85, 115, 140];
    group.querySelectorAll("[data-reveal]").forEach((item, idx) => {
      item.style.setProperty("--reveal-delay", `${delays[Math.min(idx, delays.length - 1)]}ms`);
    });
  });

  if (!("IntersectionObserver" in window)) {
    activeSection.querySelectorAll("[data-reveal]").forEach(el => el.classList.add("is-revealed"));
    return;
  }

  revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-revealed");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { rootMargin: "0px 0px -24px 0px", threshold: 0.05 });

  activeSection.querySelectorAll("[data-reveal]").forEach(el => {
    el.classList.remove("is-revealed");
    revealObserver.observe(el);
  });

  requestAnimationFrame(updateArtcraftScrollTelemetry);
}

// ============================================================================
// 16. ARRANQUE DEL SISTEMA
// ============================================================================
window.addEventListener("DOMContentLoaded", async () => {
  applyThemeAndAccent();
  applyBrandIdentityToDOM();
  initCropperDragEvents();
  initArtcraftScrollEngine();

  setInterval(updateLoginLiveClock, 15000);

  loadLocalBackup();
  initSupabaseClient();
  initLoginScreen();

  const restored = restoreActiveSession();
  renderActiveTab();

  await syncFromSupabase(false);

  if (restored && state.currentUser) {
    const fresh = state.usuarios.find(u => u.username.toLowerCase() === state.currentUser.username.toLowerCase());
    if (fresh) {
      state.currentUser = fresh;
      try {
        localStorage.setItem("anarosa_session_user", JSON.stringify({
          id: fresh.id,
          username: fresh.username,
          role: fresh.role,
          permissions: fresh.permissions
        }));
      } catch (e) {}
    }
    updateUserUI();
  }
  renderActiveTab();
  observeScrollReveals();
});
