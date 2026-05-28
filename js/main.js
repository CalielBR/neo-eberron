// d:\FOUDRY-ARQUIVOS\eberron-wiki\js\main.js

// Preload do áudio para melhor performance
const pageTurnSound = new Audio('audio/page-turn.mp3');
pageTurnSound.volume = 0.4;

function playPageSound() {
    // Reinicia o áudio caso o usuário clique rápido demais
    pageTurnSound.currentTime = 0;
    pageTurnSound.play().catch(err => {
        console.log("O áudio não pôde ser reproduzido: " + err.message);
    });
}

// Flag to prevent overlapping transitions
let isTransitioning = false;

// Citações personalizadas para cada capítulo
const pageQuotes = {
  home: {
    label: "Crônicas do Pós-Guerra · Khorvaire",
    text: "Quando somos crianças, queremos ser os heróis.<br>Quando somos adultos, entendemos os vilões.",
    cite: "— O Narrador"
  },
  gallery: {
    label: "Arquivo de Visões da Casa Cannith",
    text: "A arte não apenas imita a vida em Eberron;<br>ela a forja em metal, magia e sangue.",
    cite: "— O Cronista"
  },
  mapa: {
    label: "Cartografia Imperial de Galifar"
  },
  locs: {
    label: "Guia de Viagem das Cinco Nações",
    text: "Caminhar por Khorvaire é ler as cicatrizes<br>de um mundo que se recusa a silenciar.",
    cite: "— O Viajante"
  },
  contact: {
    label: "Protocolos de Mensagem da Casa Kawaii",
    text: "O cristal de comunicação vibra, mas a mensagem<br>depende da alma de quem a envia.",
    cite: "— O Escrivão"
  }
};

// Tempo de segurança para destravar a navegação caso a animação falhe
const TRANSITION_DURATION = 850; 
const SWAP_DELAY = 360;
let transitionTimeout = null;

// Function to show a specific page with the flip transition
function showPage(pageId, tabEl) {
  if (isTransitioning) return false;

  const targetPage = document.getElementById('page-' + pageId);
  if (!targetPage) {
    console.warn(`Target page with ID 'page-${pageId}' not found.`);
    return false;
  }

  const currentPage = document.querySelector('.page-section.active');

  // If the target page is already active, or if it's the same as current, do nothing
  if (currentPage === targetPage) {
    return false;
  }

  playPageSound();
  isTransitioning = true;

  const pageInner = document.querySelector('.page-inner');
  if (!pageInner) return false;

  // Ensure the 'flipping' animation can restart
  clearTimeout(transitionTimeout);
  pageInner.classList.remove('flipping');
  // Force a reflow/repaint to ensure the class removal is processed before re-adding
  void pageInner.offsetWidth;

  // Start the flip animation on the entire .page-inner container
  pageInner.classList.add('flipping');

  // Fallback and Cleanup: Garante que o site não "trave"
  transitionTimeout = setTimeout(() => {
    pageInner.classList.remove('flipping');
    isTransitioning = false;
    
    if (pageId === 'mapa' && typeof updateMapPosition === 'function') {
      updateMapPosition(translateX, translateY);
    }
  }, TRANSITION_DURATION); 

  // Coordinate the content swap at the midpoint of the flip animation
  setTimeout(() => {
    // Remedia qualquer duplicação garantindo que APENAS a target receba active
    const allSections = document.querySelectorAll('.page-section');
    allSections.forEach(s => s.classList.remove('active'));
    
    targetPage.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Atualiza a citação do rodapé conforme a página (exceto mapa)
    const quoteText = document.querySelector('.footer-quote-text');
    const quoteCite = document.querySelector('.footer-quote-cite');
    if (quoteText && quoteCite && pageQuotes[pageId]) {
      quoteText.innerHTML = pageQuotes[pageId].text;
      quoteCite.textContent = pageQuotes[pageId].cite;
    }

    // Atualiza o rótulo da campanha no cabeçalho
    const campaignLabel = document.querySelector('.site-campaign-label');
    if (campaignLabel && pageQuotes[pageId]?.label) {
      campaignLabel.textContent = pageQuotes[pageId].label;
    }

    // Resetar o mapa se estivermos saindo dele ou entrando nele
    if ((currentPage && currentPage.id === 'page-mapa') || pageId === 'mapa') {
      resetMap();
    }
  }, SWAP_DELAY);

  // Update active tab styling
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  if (tabEl) {
    tabEl.classList.add('active');
  }

  // Update URL hash without reloading the page
  try {
    history.pushState(null, '', '#' + pageId);
  } catch (e) {
    // Fallback for older browsers or specific environments
    window.location.hash = pageId;
  }

  return false; // Prevent default link behavior for anchor tags
}

// Function to handle initial page load and hash changes
function handleHash() {
  const hash = window.location.hash.replace('#', '');
  // List of valid page IDs from your HTML
  const validPages = ['home', 'gallery', 'mapa', 'locs', 'contact'];

  if (hash && validPages.includes(hash)) {
    const tab = document.querySelector(`.nav-tab[data-page="${hash}"]`);
    // Pass the tab element to showPage to update its active state
    showPage(hash, tab);
  } else {
    // If no valid hash, default to the 'home' page
    const defaultPageId = 'home';
    const defaultTab = document.querySelector(`.nav-tab[data-page="${defaultPageId}"]`);
    showPage(defaultPageId, defaultTab);
  }
}

// Map interaction logic
let mapCanvas, mapViewport, mapImg;
let currentScale = 1;
let translateX = 0, translateY = 0;
let isDragging = false;
let startX, startY;

// Map data for popups (from index.html)
const mapLocations = {
  sharn: { type: 'Cidade-Estado', name: 'Sharn', desc: 'A Cidade das Torres. Construída sobre uma confluência de magia Siberiana, suas torres alcançam as nuvens. Capital econômica e centro de intrigas. Um mundo dentro de um mundo.' },
  wroat: { type: 'Capital', name: 'Wroat', desc: 'Sede do Parlamento de Breland e da Coroa Wynarn. Centro político mais liberal das Cinco Nações, com uma constituição que garante direitos até aos Forjados.' },
  desolacao: { type: 'Zona de Exclusão', name: 'Grande Desolação', desc: 'O que sobrou de Cyre após o Dia da Morte. Névoa cinza-prata que se move com intenção própria. Monstros fundidos com magia corrompida vagam seus limites. Ninguém sabe a causa.' },
  korth: { type: 'Capital', name: 'Korth', desc: 'Sede do Rei Kaius III. Uma cidade de pedra cinza e disciplina militar. As legiões mortas-vivas de Karrnath estão oficialmente desativadas — oficialmente. As catacumbas são vastas.' },
  fairhaven: { type: 'Capital', name: 'Fairhaven', desc: 'Capital de Aundair, conhecida por suas academias arcanas e sua nobreza refinada. Um centro de cultura e magia.' },
  flamekeep: { type: 'Capital', name: 'Flamekeep', desc: 'Capital de Thrane, sede da Igreja da Chama Prateada. Uma cidade sagrada governada por uma teocracia.' },
  arcanix: { type: 'Academia', name: 'Arcanix', desc: 'As torres flutuantes de Arcanix são o maior centro de pesquisa arcana de Khorvaire. Academias que literalmente flutuam sobre o Lago Galifar, onde a magia mais avançada é estudada e frequentemente mal utilizada.' },
  atur: { type: 'Cidade dos Mortos', name: 'Atur', desc: 'A Cidade da Noite Eterna. Atur raramente vê o sol. É aqui que as legiões mortas-vivas de Karrnath são armazenadas e manutencionadas pelos necromantes da Coroa.' },
  zarashak: { type: 'Porto das Pântanas', name: 'Zarash\'ak', desc: 'Construída sobre palafitas nos Pântanos de Sombra, Zarash\'ak é a maior concentração de orcs e meio-orcs da Casa Tharashk. Centro da indústria de extração de Khyber dragonshards.' },
  greenheart: { type: 'Capital Espiritual', name: 'Greenheart', desc: 'O coração das Eldeen Reaches, onde o Profeta Verde governa. Uma cidade que cresceu de forma orgânica dentro de uma floresta ancestral. Druidas e feras convivem com colonos.' },
  stormreach: { type: 'Porto Franco', name: 'Stormreach', desc: 'Única cidade estabelecida no continente selvagem de Xen\'drik. Porto de piratas, aventureiros e arqueólogos. Construída sobre as ruínas de uma cidade de gigantes.' },
  thronehold: { type: 'Local Histórico', name: 'Thronehold', desc: 'Antiga capital do Império Galifar e local da assinatura do Tratado de Thronehold, que encerrou a Última Guerra. Um símbolo de paz frágil.' },
};

function applyMapTransform() {
  mapCanvas.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentScale})`;
}

function centerMapOnLocation(locationId) {
  const marker = document.querySelector(`.map-marker[data-loc="${locationId}"]`);
  if (!marker || !mapViewport) return;

  // Define um nível de zoom ideal para observar os detalhes da localidade
  currentScale = 2; 

  // O offsetLeft e offsetTop do marcador são relativos ao mapCanvas (tamanho real da imagem)
  const x = marker.offsetLeft;
  const y = marker.offsetTop;

  // Calcula a translação para que o ponto (x, y) fique exatamente no centro do viewport
  const targetX = (mapViewport.offsetWidth / 2) - (x * currentScale);
  const targetY = (mapViewport.offsetHeight / 2) - (y * currentScale);

  updateMapPosition(targetX, targetY);
  showMapPopup(locationId);
}

function updateMapPosition(newX, newY) {
  const mapWidth = mapImg.offsetWidth;
  const mapHeight = mapImg.offsetHeight;

  // Calculate boundaries based on current scale
  const maxX = Math.max(0, (mapWidth * currentScale) - mapViewport.offsetWidth);
  const maxY = Math.max(0, (mapHeight * currentScale) - mapViewport.offsetHeight);

  translateX = Math.max(-maxX, Math.min(0, newX));
  translateY = Math.max(-maxY, Math.min(0, newY));

  applyMapTransform();
}

function zoomMap(scaleFactor, centerX = mapViewport.offsetWidth / 2, centerY = mapViewport.offsetHeight / 2) {
  const oldScale = currentScale;
  currentScale = Math.max(0.5, Math.min(3, currentScale * scaleFactor)); // Limit zoom between 0.5x and 3x

  if (currentScale === oldScale) return; // No change in scale

  // Adjust translation to zoom around the center point
  translateX = centerX - (centerX - translateX) * (currentScale / oldScale);
  translateY = centerY - (centerY - translateY) * (currentScale / oldScale);

  // Re-apply boundaries after zoom
  updateMapPosition(translateX, translateY);
}

function resetMap() {
  currentScale = 1;

  // Calcula a posição para centralizar o mapa no viewport
  const targetX = (mapViewport.offsetWidth / 2) - (mapImg.offsetWidth / 2);
  const targetY = (mapViewport.offsetHeight / 2) - (mapImg.offsetHeight / 2);

  updateMapPosition(targetX, targetY);
  hideMapPopup();
}

function showMapPopup(locationId) {
  const popup = document.getElementById('mapPopup');
  const locData = mapLocations[locationId];

  if (locData) {
    document.getElementById('popupType').textContent = locData.type;
    document.getElementById('popupName').textContent = locData.name;
    document.getElementById('popupDesc').textContent = locData.desc;
    popup.classList.add('visible');
  }
}

function hideMapPopup() {
  document.getElementById('mapPopup').classList.remove('visible');
}

// Initialize map elements and event listeners
function setupMapInteractions() {
  mapViewport = document.getElementById('mapViewport');
  mapCanvas = document.getElementById('mapCanvas');
  mapImg = document.getElementById('mapImg');

  if (!mapViewport || !mapCanvas || !mapImg) {
    // console.warn("Map elements not found, skipping map setup.");
    return;
  }

  // Zoom buttons
  document.getElementById('btn-zoom-in')?.addEventListener('click', () => zoomMap(1.2));
  document.getElementById('btn-zoom-out')?.addEventListener('click', () => zoomMap(1 / 1.2));
  document.getElementById('btn-reset')?.addEventListener('click', resetMap);

  // Botões de rolagem da página
  const SCROLL_STEP = 300;
  document.getElementById('btn-scroll-up')?.addEventListener('click', () => window.scrollBy({ top: -SCROLL_STEP, behavior: 'smooth' }));
  document.getElementById('btn-scroll-down')?.addEventListener('click', () => window.scrollBy({ top: SCROLL_STEP, behavior: 'smooth' }));

  // Popup close button
  document.getElementById('popupClose')?.addEventListener('click', hideMapPopup);

  // Map markers
  document.querySelectorAll('.map-marker').forEach(marker => {
    marker.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent triggering viewport click
      showMapPopup(marker.dataset.loc);
    });
  });

  // Drag functionality
  mapViewport.addEventListener('mousedown', (e) => {
    if (e.button === 0) { // Left click
      isDragging = true;
      startX = e.clientX - translateX;
      startY = e.clientY - translateY;
      mapViewport.style.cursor = 'grabbing';
      hideMapPopup(); // Hide popup when dragging starts
    }
  });

  mapViewport.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    e.preventDefault();
    updateMapPosition(e.clientX - startX, e.clientY - startY);
  });

  // Suporte para toque (Mobile)
  mapViewport.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      isDragging = true;
      startX = e.touches[0].clientX - translateX;
      startY = e.touches[0].clientY - translateY;
      mapViewport.style.cursor = 'grabbing';
      hideMapPopup();
    }
  }, { passive: false });

  mapViewport.addEventListener('touchmove', (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    // Previne o scroll da página enquanto navega no mapa
    e.preventDefault();
    updateMapPosition(e.touches[0].clientX - startX, e.touches[0].clientY - startY);
  }, { passive: false });

  mapViewport.addEventListener('touchend', () => {
    isDragging = false;
    mapViewport.style.cursor = 'grab';
  });

  mapViewport.addEventListener('mouseup', () => {
    isDragging = false;
    mapViewport.style.cursor = 'grab';
  });

  mapViewport.addEventListener('mouseleave', () => {
    isDragging = false; // Stop dragging if mouse leaves viewport
    mapViewport.style.cursor = 'grab';
  });

  // Zoom with scroll wheel
  mapViewport.addEventListener('wheel', (e) => {
    e.preventDefault();
    const scaleFactor = e.deltaY < 0 ? 1.1 : 1 / 1.1; // Zoom in/out
    const rect = mapViewport.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    zoomMap(scaleFactor, mouseX, mouseY);
  });

  // Recalcular limites quando a janela for redimensionada
  window.addEventListener('resize', () => {
    if (document.getElementById('page-mapa').classList.contains('active')) {
      updateMapPosition(translateX, translateY);
    }
  });
}

// Event listener for when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  handleHash(); // Set the initial page based on URL hash
  setupMapInteractions(); // Initialize map functionality

  // Adiciona o evento de clique nos cards de Localidades
  document.querySelectorAll('.location-card').forEach(card => {
    card.addEventListener('click', () => {
      const locId = card.dataset.loc;
      const mapTab = document.querySelector('.nav-tab[data-page="mapa"]');
      
      // 1. Muda para a página do mapa
      showPage('mapa', mapTab);
      
      // 2. Aguarda a animação de "virar a página" (midpoint) para centralizar o local
      setTimeout(() => centerMapOnLocation(locId), 400);
    });
  });
});

// Event listener for hash changes (e.g., when user uses browser back/forward buttons)
window.addEventListener('hashchange', handleHash);