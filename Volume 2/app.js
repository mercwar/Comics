(() => {
  let pages = [];
  let currentIssueNum = "1";
  let currentIndex = 0;
  let currentWidth = 760;
  let flipSwapTimer = null;
  let flipEndTimer = null;

  const issueSelector = document.getElementById("issueSelector");
  const issueSubtitle = document.getElementById("issueSubtitle");
  const pageIndicator = document.getElementById("pageIndicator");
  const pageList = document.getElementById("pageList");
  const statusBanner = document.getElementById("statusBanner");
  const comicFrame = document.getElementById("comicFrame");
  const comicImage = document.getElementById("comicImage");

  async function loadIssue(issueNum) {
    currentIssueNum = String(issueNum);
    currentIndex = 0;
    pages = [];

    const issueFolder = `issue ${currentIssueNum}`;
    const encodedFolder = encodeURIComponent(issueFolder);
    const jsonPath = `./${encodedFolder}/json/config.json`;

    issueSubtitle.textContent = `Volume 2, Issue #0${currentIssueNum} • Loading ${issueFolder}/json/config.json...`;

    try {
      const response = await fetch(jsonPath, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} fetching ./${issueFolder}/json/config.json`);
      }

      const data = await response.json();
      const rawPages = Array.isArray(data) ? data : data.pages || [];

      if (data.title) {
        issueSubtitle.textContent = `Issue #0${currentIssueNum} — ${data.title}${data.subtitle ? " • " + data.subtitle : ""}`;
      } else {
        issueSubtitle.textContent = `Volume 2, Issue #0${currentIssueNum}`;
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

      if (pages.length === 0) {
        comicFrame.hidden = true;
        comicImage.removeAttribute("src");
        pageIndicator.textContent = "0 / 0";
        pageList.innerHTML = "";
        showStatus(`No pages listed in ./${issueFolder}/json/config.json.`);
        updateControls();
        return;
      }

      hideStatus();
      comicFrame.hidden = false;
      renderThumbnailIndex();
      showPage(0, false);
    } catch (err) {
      comicFrame.hidden = true;
      comicImage.removeAttribute("src");
      pageIndicator.textContent = "0 / 0";
      pageList.innerHTML = "";
      showStatus(`Could not load ./${issueFolder}/json/config.json (${err.message})`);
      updateControls();
    }
  }

  function renderThumbnailIndex() {
    pageList.innerHTML = "";
    const encodedFolder = encodeURIComponent(`issue ${currentIssueNum}`);

    pages.forEach((page, idx) => {
      const li = document.createElement("li");
      li.title = page.title;

      const img = document.createElement("img");
      img.className = "thumb-img";
      img.loading = "lazy";
      img.src = `./${encodedFolder}/images/${encodeURIComponent(page.file)}`;
      img.alt = page.title;

      const badge = document.createElement("span");
      badge.className = "thumb-badge";
      badge.textContent = `#${idx + 1}`;

      li.appendChild(img);
      li.appendChild(badge);

      if (idx === currentIndex) li.classList.add("active");
      li.addEventListener("click", () => showPage(idx, true));
      pageList.appendChild(li);
    });
  }

  function showPage(index, animate = true) {
    if (index < 0 || index >= pages.length) return;

    const prevIndex = currentIndex;
    currentIndex = index;
    const pageObj = pages[currentIndex];
    const encodedFolder = encodeURIComponent(`issue ${currentIssueNum}`);
    const encodedFile = encodeURIComponent(pageObj.file);
    const nextSrc = `./${encodedFolder}/images/${encodedFile}`;
    const nextAlt = `Issue #0${currentIssueNum} — ${pageObj.title}`;

    // Update page counter and active thumbnail immediately
    pageIndicator.textContent = `${currentIndex + 1} / ${pages.length}`;
    Array.from(pageList.children).forEach((li, idx) => {
      const isActive = idx === currentIndex;
      li.classList.toggle("active", isActive);
      if (isActive) {
        li.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    });
    updateControls();

    // Clear any in-flight page flip timers
    if (flipSwapTimer) clearTimeout(flipSwapTimer);
    if (flipEndTimer) clearTimeout(flipEndTimer);

    comicFrame.classList.remove("flip-next", "flip-prev");

    if (!animate || prevIndex === currentIndex) {
      comicImage.src = nextSrc;
      comicImage.alt = nextAlt;
      return;
    }

    // Trigger 3D horizontal book-page flip and swap image at the 90-degree midpoint (260ms)
    const flipClass = currentIndex > prevIndex ? "flip-next" : "flip-prev";
    void comicFrame.offsetWidth;
    comicFrame.classList.add(flipClass);

    flipSwapTimer = setTimeout(() => {
      comicImage.src = nextSrc;
      comicImage.alt = nextAlt;
    }, 260);

    flipEndTimer = setTimeout(() => {
      comicFrame.classList.remove("flip-next", "flip-prev");
    }, 530);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateControls() {
    const total = pages.length;
    const hasPages = total > 0;

    document.getElementById("firstBtn").disabled = !hasPages || currentIndex === 0;
    document.getElementById("prevBtn").disabled = !hasPages || currentIndex === 0;
    document.getElementById("bottomPrevBtn").disabled = !hasPages || currentIndex === 0;
    document.getElementById("nextBtn").disabled = !hasPages || currentIndex >= total - 1;
    document.getElementById("bottomNextBtn").disabled = !hasPages || currentIndex >= total - 1;
    document.getElementById("lastBtn").disabled = !hasPages || currentIndex >= total - 1;
  }

  function showStatus(msg) {
    statusBanner.textContent = msg;
    statusBanner.hidden = false;
  }

  function hideStatus() {
    statusBanner.hidden = true;
  }

  issueSelector.addEventListener("change", (e) => loadIssue(e.target.value));
  document.getElementById("firstBtn").addEventListener("click", () => showPage(0, true));
  document.getElementById("prevBtn").addEventListener("click", () => showPage(currentIndex - 1, true));
  document.getElementById("bottomPrevBtn").addEventListener("click", () => showPage(currentIndex - 1, true));
  document.getElementById("nextBtn").addEventListener("click", () => showPage(currentIndex + 1, true));
  document.getElementById("bottomNextBtn").addEventListener("click", () => showPage(currentIndex + 1, true));
  document.getElementById("lastBtn").addEventListener("click", () => showPage(pages.length - 1, true));

  document.getElementById("zoomInBtn").addEventListener("click", () => {
    currentWidth = Math.min(1400, currentWidth + 120);
    comicFrame.style.width = `${currentWidth}px`;
  });

  document.getElementById("zoomOutBtn").addEventListener("click", () => {
    currentWidth = Math.max(380, currentWidth - 120);
    comicFrame.style.width = `${currentWidth}px`;
  });

  document.getElementById("fitBtn").addEventListener("click", () => {
    currentWidth = 760;
    comicFrame.style.width = "760px";
  });

  document.getElementById("toggleDrawerBtn").addEventListener("click", () => {
    document.getElementById("indexDrawer").classList.toggle("collapsed");
  });

  document.getElementById("closeDrawerBtn").addEventListener("click", () => {
    document.getElementById("indexDrawer").classList.add("collapsed");
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") showPage(currentIndex + 1, true);
    if (e.key === "ArrowLeft") showPage(currentIndex - 1, true);
  });

  const urlParams = new URLSearchParams(window.location.search);
  const initialIssue = urlParams.get("issue") || "1";
  if (["1", "2", "3", "4", "5"].includes(initialIssue)) {
    issueSelector.value = initialIssue;
  }
  loadIssue(issueSelector.value);
})();
