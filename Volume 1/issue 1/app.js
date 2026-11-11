document.addEventListener("DOMContentLoaded", () => {
    const sidebar = document.getElementById("sidebar");
    const pageList = document.getElementById("page-list");
    const sidebarCount = document.getElementById("sidebar-count");
    const pageViewport = document.getElementById("page-viewport");
    const pageCard = document.getElementById("page-card");
    const activeImg = document.getElementById("active-page-img");
    const activeLabel = document.getElementById("active-page-label");

    const pageInput = document.getElementById("page-input");
    const pageTotal = document.getElementById("page-total");
    const zoomLabel = document.getElementById("zoom-label");

    const btnToggleSidebar = document.getElementById("btn-toggle-sidebar");
    const btnFirst = document.getElementById("btn-first");
    const btnPrev = document.getElementById("btn-prev");
    const btnNext = document.getElementById("btn-next");
    const btnLast = document.getElementById("btn-last");

    const btnZoomOut = document.getElementById("btn-zoom-out");
    const btnZoomIn = document.getElementById("btn-zoom-in");
    const btnFit = document.getElementById("btn-fit");

    const btnInfo = document.getElementById("btn-info");
    const btnCloseModal = document.getElementById("btn-close-modal");
    const infoModal = document.getElementById("info-modal");
    const chapterItems = document.querySelectorAll("#chapter-index li[data-page]");

    let pages = [];
    let currentIndex = 0;
    let zoomPercent = null; // null = Fit to viewport height

    async function initReader() {
        try {
            const response = await fetch("comic.json");
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const data = await response.json();
            pages = Array.isArray(data.pages) ? data.pages : [];

            if (pages.length === 0) {
                activeLabel.textContent = "No pages found in comic.json.";
                return;
            }

            sidebarCount.textContent = pages.length;
            pageTotal.textContent = `/ ${pages.length}`;
            pageInput.max = pages.length;

            buildSidebarThumbnails();
            renderPage(0, "none");
        } catch (err) {
            console.error(err);
            activeLabel.textContent = "Error loading comic.json — serve over HTTP or GitHub Pages.";
        }
    }

    function buildSidebarThumbnails() {
        pageList.innerHTML = "";

        pages.forEach((page, idx) => {
            const item = document.createElement("div");
            item.className = "thumb-item";
            item.dataset.index = idx;

            const frame = document.createElement("div");
            frame.className = "thumb-frame";

            const img = document.createElement("img");
            img.src = page.src;
            img.alt = page.label || `Page ${idx + 1}`;
            img.loading = "lazy";

            const numBadge = document.createElement("span");
            numBadge.className = "thumb-num";
            numBadge.textContent = `#${idx + 1}`;

            const label = document.createElement("span");
            label.className = "thumb-label";
            label.textContent = page.label || `Page ${idx + 1}`;

            frame.appendChild(img);
            frame.appendChild(numBadge);
            item.appendChild(frame);
            item.appendChild(label);

            item.addEventListener("click", () => {
                const direction = idx > currentIndex ? "next" : idx < currentIndex ? "prev" : "none";
                renderPage(idx, direction);
            });

            pageList.appendChild(item);
        });
    }

    function renderPage(index, direction = "next") {
        if (index < 0 || index >= pages.length) return;
        currentIndex = index;

        const pageData = pages[currentIndex];

        // Trigger smooth 3D page turn animation
        pageCard.classList.remove("anim-next", "anim-prev");
        void pageCard.offsetWidth; // Force reflow to restart animation
        if (direction === "next") {
            pageCard.classList.add("anim-next");
        } else if (direction === "prev") {
            pageCard.classList.add("anim-prev");
        }

        activeImg.src = pageData.src;
        activeImg.alt = pageData.label || `Page ${currentIndex + 1}`;
        activeLabel.textContent = `${pageData.label || `Page ${currentIndex + 1}`} — (${currentIndex + 1} of ${pages.length})`;

        pageInput.value = currentIndex + 1;
        btnFirst.disabled = currentIndex === 0;
        btnPrev.disabled = currentIndex === 0;
        btnNext.disabled = currentIndex === pages.length - 1;
        btnLast.disabled = currentIndex === pages.length - 1;

        // Highlight & auto-scroll active sidebar thumbnail
        const thumbs = pageList.querySelectorAll(".thumb-item");
        thumbs.forEach((thumb, idx) => {
            const isActive = idx === currentIndex;
            thumb.classList.toggle("active", isActive);
            if (isActive) {
                thumb.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
        });

        pageViewport.scrollTop = 0;

        // Preload next page for instant page turns
        if (currentIndex + 1 < pages.length) {
            const preload = new Image();
            preload.src = pages[currentIndex + 1].src;
        }
    }

    function applyZoom(newZoom) {
        if (newZoom === null) {
            zoomPercent = null;
            pageCard.classList.remove("zoomed");
            pageCard.style.width = "";
            zoomLabel.textContent = "Fit";
            return;
        }

        zoomPercent = Math.min(200, Math.max(50, newZoom));
        pageCard.classList.add("zoomed");
        pageCard.style.width = `${zoomPercent}%`;
        zoomLabel.textContent = `${zoomPercent}%`;
    }

    // --- Event Bindings ---
    btnToggleSidebar.addEventListener("click", () => {
        sidebar.classList.toggle("collapsed");
    });

    btnFirst.addEventListener("click", () => renderPage(0, "prev"));
    btnPrev.addEventListener("click", () => renderPage(currentIndex - 1, "prev"));
    btnNext.addEventListener("click", () => renderPage(currentIndex + 1, "next"));
    btnLast.addEventListener("click", () => renderPage(pages.length - 1, "next"));

    pageInput.addEventListener("change", () => {
        const target = parseInt(pageInput.value, 10) - 1;
        if (!isNaN(target) && target >= 0 && target < pages.length) {
            renderPage(target, target >= currentIndex ? "next" : "prev");
        } else {
            pageInput.value = currentIndex + 1;
        }
    });

    btnZoomIn.addEventListener("click", () => {
        const base = zoomPercent === null ? 90 : zoomPercent;
        applyZoom(base + 15);
    });

    btnZoomOut.addEventListener("click", () => {
        const base = zoomPercent === null ? 90 : zoomPercent;
        applyZoom(base - 15);
    });

    btnFit.addEventListener("click", () => applyZoom(null));

    // Chapter Index Modal & Direct Page Jumps
    btnInfo.addEventListener("click", () => infoModal.classList.remove("hidden"));
    btnCloseModal.addEventListener("click", () => infoModal.classList.add("hidden"));
    infoModal.addEventListener("click", (e) => {
        if (e.target === infoModal) infoModal.classList.add("hidden");
    });

    chapterItems.forEach((item) => {
        item.addEventListener("click", () => {
            const targetIdx = parseInt(item.dataset.page, 10);
            infoModal.classList.add("hidden");
            renderPage(targetIdx, targetIdx >= currentIndex ? "next" : "prev");
        });
    });

    // Click left/right side of active image to turn pages
    activeImg.addEventListener("click", (e) => {
        const rect = activeImg.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        if (clickX < rect.width * 0.35) {
            renderPage(currentIndex - 1, "prev");
        } else {
            renderPage(currentIndex + 1, "next");
        }
    });

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
        if (document.activeElement === pageInput) return;
        if (e.key === "ArrowRight" || e.key === " ") {
            e.preventDefault();
            renderPage(currentIndex + 1, "next");
        } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            renderPage(currentIndex - 1, "prev");
        } else if (e.key === "+" || e.key === "=") {
            btnZoomIn.click();
        } else if (e.key === "-") {
            btnZoomOut.click();
        } else if (e.key === "0") {
            applyZoom(null);
        } else if (e.key === "Escape") {
            infoModal.classList.add("hidden");
        }
    });

    initReader();
});
