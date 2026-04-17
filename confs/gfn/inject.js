(function () {
    console.log("[GFN FIX] profile loaded");

    const LOCK_INTERVAL = 180;
    let allowRelock = true;
    let loop = null;

    const target = document.body || document.documentElement;

    function requestLock() {
        try { target.requestPointerLock(); } catch (e) {}

        // redundancy for WebView instability
        setTimeout(() => { try { target.requestPointerLock(); } catch (e) {} }, 30);
        setTimeout(() => { try { target.requestPointerLock(); } catch (e) {} }, 90);
        setTimeout(() => { try { target.requestPointerLock(); } catch (e) {} }, 150);
    }

    function startLoop() {
        if (loop) return;

        loop = setInterval(() => {
            if (!document.pointerLockElement && allowRelock) {
                requestLock();
            }
        }, LOCK_INTERVAL);
    }

    function stopLoop() {
        if (loop) {
            clearInterval(loop);
            loop = null;
        }
    }

    // -----------------------------
    // ESC handling (GFN behavior fix)
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
