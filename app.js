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

    const fallbackPages = [
        { page: 1,  label: "Front Cover",        src: "image_ba7af5a7.jpg" },
        { page: 2,  label: "Inside Front Cover", src: "image_f246a38d.jpg" },
        { page: 3,  label: "Page 01",            src: "image_300dbfb7.jpg" },
        { page: 4,  label: "Page 02",            src: "image_dcf22b1f.jpg" },
        { page: 5,  label: "Page 03",            src: "image_b68eaa61.jpg" },
        { page: 6,  label: "Page 04",            src: "image_15e568f9.jpg" },
        { page: 7,  label: "Page 05",            src: "image_d2071447.jpg" },
        { page: 8,  label: "Page 06",            src: "image_c3470f29.jpg" },
        { page: 9,  label: "Page 07",            src: "image_b7eeabf5.jpg" },
        { page: 10, label: "Page 08",            src: "image_609d0584.jpg" },
        { page: 11, label: "Page 09",            src: "image_d79d0f47.jpg" },
        { page: 12, label: "Page 10",            src: "image_627b3484.jpg" },
        { page: 13, label: "Page 11",            src: "image_fcfa2bfd.jpg" },
        { page: 14, label: "Page 12",            src: "image_58dd4a1b.jpg" },
        { page: 15, label: "Page 13",            src: "image_8d90fe87.jpg" },
        { page: 16, label: "Page 14",            src: "image_3d021a82.jpg" },
        { page: 17, label: "Page 15",            src: "image_220ca66e.jpg" },
        { page: 18, label: "Page 16",            src: "image_309b54f9.jpg" },
        { page: 19, label: "Page 17",            src: "image_92b2fd17.jpg" },
        { page: 20, label: "Page 18",            src: "image_3ebe4b56.jpg" },
        { page: 21, label: "Page 19",            src: "image_710b3e20.jpg" },
        { page: 22, label: "Page 20",            src: "image_d14c9b44.jpg" },
        { page: 23, label: "Inside Back Cover",  src: "image_3217442d.jpg" },
        { page: 24, label: "Back Cover",         src: "image_b6d9a022.jpg" }
    ];

    let pages = [];
    let currentIndex = 0;
    let zoomPercent = null;

    async function initReader() {
        try {
            const response = await fetch("comic.json");
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            pages = Array.isArray(data.pages) && data.pages.length > 0 ? data.pages : fallbackPages;
        } catch (err) {
            pages = fallbackPages;
        }

        sidebarCount.textContent = pages.length;
        pageTotal.textContent = `/ ${pages.length}`;
        pageInput.max = pages.length;

        buildSidebarThumbnails();
        renderPage(0, "none");
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

        pageCard.classList.remove("anim-next", "anim-prev");
        void pageCard.offsetWidth;
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

        const thumbs = pageList.querySelectorAll(".thumb-item");
        thumbs.forEach((thumb, idx) => {
            const isActive = idx === currentIndex;
            thumb.classList.toggle("active", isActive);
            if (isActive) {
                thumb.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
        });

        pageViewport.scrollTop = 0;

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

    activeImg.addEventListener("click", (e) => {
        const rect = activeImg.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        if (clickX < rect.width * 0.35) {
            renderPage(currentIndex - 1, "prev");
        } else {
            renderPage(currentIndex + 1, "next");
        }
    });

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