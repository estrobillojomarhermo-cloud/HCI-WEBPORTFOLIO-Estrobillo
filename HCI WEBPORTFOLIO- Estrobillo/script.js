// --- STATE ---
var MAX_AMMO = 3;
var ammo = MAX_AMMO;
var isADS = false;
var isReloading = false;
var mouseX = -100;
var mouseY = -100;

// Track which targets are hit per section
var sections = ['skills', 'experience', 'goals', 'contact'];
var hits = {};
sections.forEach(function(s) { hits[s] = [false, false, false]; });

// --- RENDER TARGETS ---
function createTargetSVG(size) {
  return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 64 64">' +
    '<circle cx="32" cy="32" r="30" fill="#1e293b" stroke="rgba(56,189,248,0.3)" stroke-width="1"/>' +
    '<circle cx="32" cy="32" r="22" fill="none" stroke="#ef4444" stroke-width="2.5"/>' +
    '<circle cx="32" cy="32" r="14" fill="none" stroke="#38bdf8" stroke-width="2"/>' +
    '<circle cx="32" cy="32" r="6" fill="#ef4444"/>' +
    '<line x1="32" y1="2" x2="32" y2="10" stroke="rgba(56,189,248,0.5)" stroke-width="1"/>' +
    '<line x1="32" y1="54" x2="32" y2="62" stroke="rgba(56,189,248,0.5)" stroke-width="1"/>' +
    '<line x1="2" y1="32" x2="10" y2="32" stroke="rgba(56,189,248,0.5)" stroke-width="1"/>' +
    '<line x1="54" y1="32" x2="62" y2="32" stroke="rgba(56,189,248,0.5)" stroke-width="1"/>' +
    '</svg>';
}

function createHitSVG(size) {
  return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 64 64">' +
    '<circle cx="32" cy="32" r="28" fill="rgba(239,68,68,0.3)" stroke="#ef4444" stroke-width="2"/>' +
    '<line x1="16" y1="16" x2="48" y2="48" stroke="#ef4444" stroke-width="3"/>' +
    '<line x1="48" y1="16" x2="16" y2="48" stroke="#ef4444" stroke-width="3"/>' +
    '</svg>';
}

// Initialize targets
var allTargets = document.querySelectorAll('.target-wrapper');
for (var i = 0; i < allTargets.length; i++) {
  allTargets[i].innerHTML = createTargetSVG(72);
}

// --- CROSSHAIR ---
var crosshair = document.getElementById('crosshair');
var adsOverlay = document.getElementById('ads-overlay');

function renderCrosshair() {
  crosshair.style.left = mouseX + 'px';
  crosshair.style.top = mouseY + 'px';
  if (isADS) {
    crosshair.innerHTML = '<svg width="60" height="60" viewBox="0 0 60 60" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5))">' +
      '<circle cx="30" cy="30" r="28" fill="none" stroke="#38bdf8" stroke-width="1.5" opacity="0.8"/>' +
      '<circle cx="30" cy="30" r="18" fill="none" stroke="#38bdf8" stroke-width="0.5" opacity="0.4"/>' +
      '<line x1="30" y1="0" x2="30" y2="22" stroke="#38bdf8" stroke-width="1" opacity="0.6"/>' +
      '<line x1="30" y1="38" x2="30" y2="60" stroke="#38bdf8" stroke-width="1" opacity="0.6"/>' +
      '<line x1="0" y1="30" x2="22" y2="30" stroke="#38bdf8" stroke-width="1" opacity="0.6"/>' +
      '<line x1="38" y1="30" x2="60" y2="30" stroke="#38bdf8" stroke-width="1" opacity="0.6"/>' +
      '<circle cx="30" cy="30" r="2" fill="#ef4444" opacity="0.9"/>' +
      '</svg>';
  } else {
    crosshair.innerHTML = '<svg width="32" height="32" viewBox="0 0 32 32">' +
      '<line x1="16" y1="4" x2="16" y2="12" stroke="#38bdf8" stroke-width="2"/>' +
      '<line x1="16" y1="20" x2="16" y2="28" stroke="#38bdf8" stroke-width="2"/>' +
      '<line x1="4" y1="16" x2="12" y2="16" stroke="#38bdf8" stroke-width="2"/>' +
      '<line x1="20" y1="16" x2="28" y2="16" stroke="#38bdf8" stroke-width="2"/>' +
      '<circle cx="16" cy="16" r="1.5" fill="#ef4444"/>' +
      '</svg>';
  }
}

// --- ADS OVERLAY ---
function updateADS() {
  if (isADS) {
    adsOverlay.classList.add('active');
    adsOverlay.style.background = 'radial-gradient(circle 150px at ' + mouseX + 'px ' + mouseY + 'px, transparent 140px, rgba(0,0,0,0.85) 150px)';
  } else {
    adsOverlay.classList.remove('active');
  }
}

// --- HUD ---
function renderHUD() {
  var barsEl = document.getElementById('ammo-bars');
  var html = '';
  for (var i = 0; i < MAX_AMMO; i++) {
    html += '<div class="ammo-bar ' + (i < ammo ? 'full' : 'empty') + '"></div>';
  }
  html += '<span class="ammo-count">' + ammo + '<span>/' + MAX_AMMO + '</span></span>';
  barsEl.innerHTML = html;
  document.getElementById('reload-text').style.display = isReloading ? 'inline' : 'none';
}

// --- SHOOT ---
function shoot(x, y) {
  if (ammo <= 0 || isReloading) return;
  ammo--;
  renderHUD();

  // Muzzle flash
  var flash = document.createElement('div');
  flash.className = 'muzzle-flash';
  flash.style.left = x + 'px';
  flash.style.top = y + 'px';
  document.body.appendChild(flash);
  setTimeout(function() { flash.remove(); }, 200);

  // Hit detection
  var targets = document.querySelectorAll('.target-wrapper');
  for (var i = 0; i < targets.length; i++) {
    var el = targets[i];
    var section = el.getAttribute('data-section');
    var idx = parseInt(el.getAttribute('data-idx'));
    if (hits[section][idx]) continue;
    var rect = el.getBoundingClientRect();
    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
      hits[section][idx] = true;
      el.classList.add('hit');
      el.innerHTML = createHitSVG(72);
      checkSection(section);
    }
  }
}

function checkSection(section) {
  var count = hits[section].filter(Boolean).length;
  var countEl = document.getElementById(section + '-count');
  if (countEl) countEl.textContent = count;
  if (count === 3) {
    var targetsArea = document.getElementById(section + '-targets');
    var sectionEl = targetsArea.closest('section');
    var gateStatus = sectionEl.querySelector('.gate-status');
    setTimeout(function() {
      targetsArea.style.display = 'none';
      if (gateStatus) gateStatus.style.display = 'none';
      var firstHeader = sectionEl.querySelector('.section-header');
      if (firstHeader) firstHeader.style.display = 'none';
      document.getElementById(section + '-content').classList.add('revealed');
    }, 500);
  }
}

function reload() {
  if (isReloading || ammo === MAX_AMMO) return;
  isReloading = true;
  renderHUD();
  setTimeout(function() {
    ammo = MAX_AMMO;
    isReloading = false;
    renderHUD();
  }, 1200);
}

// --- EVENT LISTENERS ---
window.addEventListener('mousemove', function(e) {
  mouseX = e.clientX;
  mouseY = e.clientY;
  renderCrosshair();
  updateADS();
});

window.addEventListener('mousedown', function(e) {
  if (e.button === 0) shoot(e.clientX, e.clientY);
  if (e.button === 2) { isADS = true; renderCrosshair(); updateADS(); }
});

window.addEventListener('mouseup', function(e) {
  if (e.button === 2) { isADS = false; renderCrosshair(); updateADS(); }
});

window.addEventListener('contextmenu', function(e) { e.preventDefault(); });

window.addEventListener('keydown', function(e) {
  if (e.key === 'r' || e.key === 'R') reload();
});

// Navbar scroll
window.addEventListener('scroll', function() {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 50);
});

// Init
renderCrosshair();
renderHUD();
