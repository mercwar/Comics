document.addEventListener("DOMContentLoaded", () => {
    const animatedSubtitle = document.getElementById("animated-subtitle");
    if (!animatedSubtitle) return;

    let phase = 0;

    function blipSubtitle() {
        phase += 0.025;
        const opacity = 0.25 + ((Math.sin(phase) + 1) * 0.5) * 0.75;
        animatedSubtitle.style.opacity = opacity.toFixed(2);
        requestAnimationFrame(blipSubtitle);
    }

    requestAnimationFrame(blipSubtitle);
});
