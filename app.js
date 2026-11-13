(() => {
  let pages = [];
  let currentVolumeNum = "";
  let currentIssueNum = "";
  let currentIndex = 0;
  let zoomPercent = 100;
  const BASE_WIDTH = 720;

  // GitHub Repository Configuration
  const GH_OWNER = "mercwar";
  const GH_REPO = "COMICS";

  let flipSwapTimer = null;
  let flipEndTimer = null;

  // DOM Elements
  const volumeSelector = document.getElementById("volumeSelector");
  const issueSelector = document.getElementById("issueSelector");
  const issueSubtitle = document.getElementById("issueSubtitle");
  const pageIndicator = document.getElementById("pageIndicator");
  const pageCaptionReadout = document.getElementById("pageCaptionReadout");
  const thumbnailSidebar = document.getElementById("thumbnailSidebar");
  const thumbnailGrid = document.getElementById("thumbnailGrid");
  const thumbCount = document.getElementById("thumbCount");
  const statusToast = document.getElementById("statusToast");
  const stage = document.getElementById("stage");
  const comicViewport = document.getElementById("comicViewport");
  const comicImage = document.getElementById("comicImage");
  const zoomReadout = document.getElementById("zoomReadout");
  const fitWidthBtn = document.getElementById("fitWidthBtn");
  const fitHeightBtn = document.getElementById("fitHeightBtn");
  const toggleSidebarBtn = document.getElementById("toggleSidebarBtn");
  
  const firstBtn = document.getElementById("firstBtn");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const lastBtn = document.getElementById("lastBtn");
  const clickPrevZone = document.getElementById("clickPrevZone");
  const clickNextZone = document.getElementById("clickNextZone");
  const zoomInBtn = document.getElementById("zoomInBtn");
  const zoomOutBtn = document.getElementById("zoomOutBtn");

  const mercwarLinksBtn = document.getElementById("mercwarLinksBtn");
  const mercwarLinksMenu = document.getElementById("mercwarLinksMenu");

  // 1. Scan GitHub for available Volume folders
  async function scanVolumes() {
    try {
      const res = await fetch(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to scan repository root");
      const items = await res.json();

      // Filter directories matching "volume X" (case-insensitive)
      const volumes = items
        .filter(item => item.type === "dir" && /^volume\s+\d+$/i.test(item.name))
        .map(item => {
          const match = item.name.match(/\d+/);
          return { name: item.name, num: match ? match[0] : item.name };
        })
        .sort((a, b) => parseInt(a.num) - parseInt(b.num));

      if (volumes.length === 0) {
        throw new Error("No volume folders found in repository.");
      }

      volumeSelector.innerHTML = "";
      volumes.forEach((vol, idx) => {
        const opt = document.createElement("option");
        opt.value = vol.num;
        opt.textContent = `Volume ${vol.num}`;
        if (idx === 0) opt.selected = true;
        volumeSelector.appendChild(opt);
      });

      currentVolumeNum = volumes[0].num;
      await scanIssues(currentVolumeNum);
    } catch (err) {
      showToast(`GitHub Scan Error: ${err.message}. Ensure folder names match 'volume X'.`);
    }
  }

  // 2. Scan GitHub for available Issue folders inside the selected Volume
  async function scanIssues(volNum) {
    try {
      const volumeFolder = `Volume ${volNum}`;
      const res = await fetch(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${encodeURIComponent(volumeFolder)}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to scan ${volumeFolder}`);
      const items = await res.json();

      // Filter directories matching "issue Y" (case-insensitive)
      const issues = items
        .filter(item => item.type === "dir" && /^issue\s+\d+$/i.test(item.name))
        .map(item => {
          const match = item.name.match(/\d+/);
          return { name: item.name, num: match ? match[0] : item.name };
        })
        .sort((a, b) => parseInt(a.num) - parseInt(b.num));

      issueSelector.innerHTML = "";
      if (issues.length === 0) {
        const opt = document.createElement("option");
        opt.value = "";
        opt.textContent = "No Issues Found";
        issueSelector.appendChild(opt);
        showToast(`No issue folders found inside ${volumeFolder}.`);
        return;
      }

      issues.forEach((iss, idx) => {
        const opt = document.createElement("option");
        opt.value = iss.num;
        opt.textContent = `Issue #${iss.num.padStart(2, "0")}`;
        if (idx === 0) opt.selected = true;
        issueSelector.appendChild(opt);
      });

      currentIssueNum = issues[0].num;
      await loadIssueConfig(currentVolumeNum, currentIssueNum);
    } catch (err) {
      showToast(`Scan Error: ${err.message}`);
    }
  }

  // 3. Load the config.json file for the selected volume & issue
  async function loadIssueConfig(volNum, issNum) {
    currentVolumeNum = String(volNum);
    currentIssueNum = String(issNum);
    currentIndex = 0;
    pages = [];

    const volumeFolder = `volume ${currentVolumeNum}`;
    const issueFolder = `issue ${currentIssueNum}`;
    const jsonPath = `./${volumeFolder}/${issueFolder}/json/config.json`;

    if (issueSubtitle) {
      issueSubtitle.textContent = `Vol. ${currentVolumeNum}, Issue #0${currentIssueNum} • Loading...`;
    }

    try {
      const response = await fetch(jsonPath, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} fetching ${jsonPath}`);
      }

      const data = await response.json();
      const rawPages = Array.isArray(data) ? data : data.pages || [];

      if (issueSubtitle) {
        issueSubtitle.textContent = data.title
          ? `Vol. ${currentVolumeNum} • Issue #0${currentIssueNum} — ${data.title}`
          : `Volume ${currentVolumeNum}, Issue #0${currentIssueNum}`;
      }

      pages = rawPages.map((entry, idx) => {
        if (typeof entry === "string") {
          return {
            title: `Page ${String(idx + 1).padStart(2, "0")}`,
            file: entry
          };
        }
        return {
          title: entry.label || entry.title || `Page ${String(idx + 1).padStart(2, "0")}`,
          file: entry.src || entry.file || entry.image
        };
      });

      if (thumbCount) thumbCount.textContent = `${pages.length} PAGES`;

      if (pages.length === 0) {
        if (comicViewport) comicViewport.hidden = true;
        if (comicImage) comicImage.removeAttribute("src");
        if (pageIndicator) pageIndicator.textContent = "0 / 0";
        if (pageCaptionReadout) pageCaptionReadout.textContent = "NO PAGES";
        if (thumbnailGrid) thumbnailGrid.innerHTML = "";
        showToast(`No pages listed in ${jsonPath}`);
        updateNavButtons();
        return;
      }

      hideToast();
      if (comicViewport) comicViewport.hidden = false;
      renderThumbnails();
      showPage(0, false);
    } catch (err) {
      if (comicViewport) comicViewport.hidden = true;
      if (comicImage) comicImage.removeAttribute("src");
      if (pageIndicator) pageIndicator.textContent = "0 / 0";
      if (pageCaptionReadout) pageCaptionReadout.textContent = "LOAD ERROR";
      if (thumbnailGrid) thumbnailGrid.innerHTML = "";
      if (thumbCount) thumbCount.textContent = "0 PAGES";
      showToast(`Could not load configuration (${err.message})`);
      updateNavButtons();
    }
  }

  function renderThumbnails() {
    if (!thumbnailGrid) return;
    thumbnailGrid.innerHTML = "";
    
    const volumeFolder = `volume ${currentVolumeNum}`;
    const issueFolder = `issue ${currentIssueNum}`;

    pages.forEach((page, idx) => {
      const card = document.createElement("div");
      card.className = "thumb-card";
      card.title = page.title;

      const img = document.createElement("img");
      img.loading = "lazy";
      img.src = `./${volumeFolder}/${issueFolder}/images/${page.file}`;
      img.alt = page.title;

      const badge = document.createElement("span");
      badge.className = "thumb-num";
      badge.textContent = String(idx + 1).padStart(2, "0");

      card.appendChild(img);
      card.appendChild(badge);

      if (idx === currentIndex) card.classList.add("active");
      card.addEventListener("click", () => showPage(idx, true));
      thumbnailGrid.appendChild(card);
    });
  }

  function showPage(index, animate = true) {
    if (index < 0 || index >= pages.length) return;

    const prevIndex = currentIndex;
    currentIndex = index;
    const pageObj = pages[currentIndex];
    
    const volumeFolder = `volume ${currentVolumeNum}`;
    const issueFolder = `issue ${currentIssueNum}`;
    
    const nextSrc = `./${volumeFolder}/${issueFolder}/images/${pageObj.file}`;
    const nextAlt = `Vol. ${currentVolumeNum}, Issue #0${currentIssueNum} — ${pageObj.title}`;

    if (pageIndicator) pageIndicator.textContent = `${currentIndex + 1} / ${pages.length}`;
    if (pageCaptionReadout) pageCaptionReadout.textContent = pageObj.title;

    if (thumbnailGrid) {
      Array.from(thumbnailGrid.children).forEach((card, idx) => {
        const isActive = idx === currentIndex;
        card.classList.toggle("active", isActive);
        if (isActive) {
          card.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
      });
    }

    updateNavButtons();
    if (stage) stage.scrollTo({ top: 0, behavior: "smooth" });

    if (flipSwapTimer) clearTimeout(flipSwapTimer);
    if (flipEndTimer) clearTimeout(flipEndTimer);

    if (!comicViewport || !comicImage) return;
    comicViewport.classList.remove("flip-next", "flip-prev");

    if (!animate || prevIndex === currentIndex) {
      comicImage.src = nextSrc;
      comicImage.alt = nextAlt;
      return;
    }

    const flipClass = currentIndex > prevIndex ? "flip-next" : "flip-prev";
    void comicViewport.offsetWidth;
    comicViewport.classList.add(flipClass);

    flipSwapTimer = setTimeout(() => {
      comicImage.src = nextSrc;
      comicImage.alt = nextAlt;
    }, 240);

    flipEndTimer = setTimeout(() => {
      comicViewport.classList.remove("flip-next", "flip-prev");
    }, 490);
  }

  function updateNavButtons() {
    const total = pages.length;
    const hasPages = total > 0;

    if (firstBtn) firstBtn.disabled = !hasPages || currentIndex === 0;
    if (prevBtn) prevBtn.disabled = !hasPages || currentIndex === 0;
    if (nextBtn) nextBtn.disabled = !hasPages || currentIndex >= total - 1;
    if (lastBtn) lastBtn.disabled = !hasPages || currentIndex >= total - 1;
  }

  function setFitWidthMode() {
    if (stage) stage.classList.remove("fit-height-mode");
    if (fitWidthBtn) fitWidthBtn.classList.add("active");
    if (fitHeightBtn) fitHeightBtn.classList.remove("active");
    applyZoom();
  }

  function setFitHeightMode() {
    if (stage) stage.classList.add("fit-height-mode");
    if (fitHeightBtn) fitHeightBtn.classList.add("active");
    if (fitWidthBtn) fitWidthBtn.classList.remove("active");
    if (zoomReadout) zoomReadout.textContent = "FIT";
  }

  function applyZoom() {
    if (stage && stage.classList.contains("fit-height-mode")) {
      setFitWidthMode();
      return;
    }
    const targetWidth = Math.round((BASE_WIDTH * zoomPercent) / 100);
    if (comicViewport) comicViewport.style.width = `${targetWidth}px`;
    if (zoomReadout) zoomReadout.textContent = `${zoomPercent}%`;
  }

  function showToast(msg) {
    if (!statusToast) return;
    statusToast.textContent = msg;
    statusToast.hidden = false;
  }

  function hideToast() {
    if (!statusToast) return;
    statusToast.hidden = true;
  }

  // Event Listeners Binding
  if (volumeSelector) {
    volumeSelector.addEventListener("change", async (e) => {
      currentVolumeNum = e.target.value;
      await scanIssues(currentVolumeNum);
    });
  }

  if (issueSelector) {
    issueSelector.addEventListener("change", (e) => {
      currentIssueNum = e.target.value;
      loadIssueConfig(currentVolumeNum, currentIssueNum);
    });
  }

  if (firstBtn) firstBtn.addEventListener("click", () => showPage(0, true));
  if (prevBtn) prevBtn.addEventListener("click", () => showPage(currentIndex - 1, true));
  if (nextBtn) nextBtn.addEventListener("click", () => showPage(currentIndex + 1, true));
  if (lastBtn) lastBtn.addEventListener("click", () => showPage(pages.length - 1, true));

  if (clickPrevZone) clickPrevZone.addEventListener("click", () => showPage(currentIndex - 1, true));
  if (clickNextZone) clickNextZone.addEventListener("click", () => showPage(currentIndex + 1, true));

  if (fitWidthBtn) fitWidthBtn.addEventListener("click", setFitWidthMode);
  if (fitHeightBtn) fitHeightBtn.addEventListener("click", setFitHeightMode);

  if (zoomInBtn) {
    zoomInBtn.addEventListener("click", () => {
      zoomPercent = Math.min(200, zoomPercent + 15);
      applyZoom();
    });
  }

  if (zoomOutBtn) {
    zoomOutBtn.addEventListener("click", () => {
      zoomPercent = Math.max(55, zoomPercent - 15);
      applyZoom();
    });
  }

  if (toggleSidebarBtn && thumbnailSidebar) {
    toggleSidebarBtn.addEventListener("click", () => {
      thumbnailSidebar.classList.toggle("collapsed");
    });
  }

  // Links Dropdown Event Handlers
  if (mercwarLinksBtn && mercwarLinksMenu) {
    mercwarLinksBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = !mercwarLinksMenu.hidden;
      mercwarLinksMenu.hidden = isOpen;
      mercwarLinksBtn.setAttribute("aria-expanded", String(!isOpen));
    });

    document.addEventListener("click", (e) => {
      if (!mercwarLinksBtn.contains(e.target) && !mercwarLinksMenu.contains(e.target)) {
        mercwarLinksMenu.hidden = true;
        mercwarLinksBtn.setAttribute("aria-expanded", "false");
      }
    });
  }

  // Global Keyboard Navigation
  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "SELECT" || e.target.tagName === "INPUT") return;

    if (e.key === "ArrowRight" || e.key === " ") {
      e.preventDefault();
      showPage(currentIndex + 1, true);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      showPage(currentIndex - 1, true);
    } else if (e.key === "+" || e.key === "=") {
      zoomPercent = Math.min(200, zoomPercent + 15);
      applyZoom();
    } else if (e.key === "-") {
      zoomPercent = Math.max(55, zoomPercent - 15);
      applyZoom();
    } else if (e.key === "Escape") {
      if (mercwarLinksMenu && !mercwarLinksMenu.hidden) {
        mercwarLinksMenu.hidden = true;
        mercwarLinksBtn.setAttribute("aria-expanded", "false");
      }
    }
  });

  // Initial startup scan
  scanVolumes();
})();