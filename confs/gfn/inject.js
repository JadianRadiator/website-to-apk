(function () {
    console.log("[GFN FIX] stable mode loaded");

    const target = document.body || document.documentElement;

    let allowRelock = true;
    let escDownTime = 0;
    let held = false;
    const HOLD = 1100;

    function requestLockOnce() {
        try { target.requestPointerLock(); } catch (e) {}
    }

    function safeRecover() {
        if (!document.pointerLockElement && allowRelock) {
            requestLockOnce();
            setTimeout(requestLockOnce, 80);
        }
    }

    // -------------------------
    // ESC handling (unchanged behavior)
    // -------------------------

    window.addEventListener("keydown", (e) => {
        if (e.key !== "Escape") return;

        escDownTime = Date.now();
        held = false;

        setTimeout(() => {
            if (Date.now() - escDownTime >= HOLD) {
                held = true;
                allowRelock = false;
            }
        }, HOLD);

        e.preventDefault();
        e.stopImmediatePropagation();
    }, true);

    window.addEventListener("keyup", (e) => {
        if (e.key !== "Escape") return;

        const dt = Date.now() - escDownTime;

        if (!held && dt < HOLD) {
            document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
            document.dispatchEvent(new KeyboardEvent("keyup", { key: "Escape", bubbles: true }));

            allowRelock = true;
            safeRecover();

        } else {
            allowRelock = false;
            document.exitPointerLock?.();
        }
    }, true);

    // -------------------------
    // Recovery hooks (ONLY event-based, no spam loop)
    // -------------------------

    document.addEventListener("pointerlockchange", () => {
        safeRecover();
    });

    window.addEventListener("focus", () => {
        safeRecover();
    });

    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) safeRecover();
    });

    ["click", "touchstart"].forEach(evt => {
        window.addEventListener(evt, () => safeRecover(), true);
    });

    // initial attempt only
    setTimeout(safeRecover, 900);

})();    // ESC handling (GFN behavior fix)
    // -----------------------------

    let escDownTime = 0;
    let held = false;
    const HOLD_THRESHOLD = 1100;

    window.addEventListener("keydown", function (e) {
        if (e.key !== "Escape") return;

        escDownTime = Date.now();
        held = false;

        setTimeout(() => {
            if (Date.now() - escDownTime >= HOLD_THRESHOLD) {
                held = true;
                allowRelock = false;
                stopLoop();
            }
        }, HOLD_THRESHOLD);

        e.preventDefault();
        e.stopImmediatePropagation();
    }, true);

    window.addEventListener("keyup", function (e) {
        if (e.key !== "Escape") return;

        const dt = Date.now() - escDownTime;

        if (!held && dt < HOLD_THRESHOLD) {
            // TAP → forward escape into page
            document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
            document.dispatchEvent(new KeyboardEvent("keyup", { key: "Escape", bubbles: true }));

            allowRelock = true;

            requestLock();
            setTimeout(requestLock, 50);
            setTimeout(requestLock, 120);

            startLoop();

        } else {
            // HOLD → user intent to exit
            allowRelock = false;
            stopLoop();
            document.exitPointerLock?.();
        }
    }, true);

    // -----------------------------
    // Recovery hooks (WebView instability)
    // -----------------------------

    document.addEventListener("pointerlockchange", () => {
        if (!document.pointerLockElement && allowRelock) {
            startLoop();
        }
    });

    window.addEventListener("focus", () => {
        if (allowRelock) {
            requestLock();
            startLoop();
        }
    });

    document.addEventListener("visibilitychange", () => {
        if (!document.hidden && allowRelock) {
            requestLock();
            startLoop();
        }
    });

    ["click", "mousedown", "touchstart"].forEach(evt => {
        window.addEventListener(evt, () => {
            if (!document.pointerLockElement && allowRelock) {
                requestLock();
            }
        }, true);
    });

    // initial kick
    setTimeout(() => {
        requestLock();
        startLoop();
    }, 700);

})();
