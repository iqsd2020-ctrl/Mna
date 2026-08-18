(() => {
    'use strict';

    let deferredInstallPrompt = null;

    const isStandalone = () => (
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true
    );

    const isMobileDevice = () => /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

    const registerServiceWorker = () => {
        if (!('serviceWorker' in navigator)) return;
        window.addEventListener('load', () => {
            navigator.serviceWorker.register(new URL('sw.js', document.baseURI), { scope: './' })
                .catch((error) => console.warn('تعذر تسجيل Service Worker:', error));
        });
    };

    const INSTALL_PROMPT_SEEN_KEY = 'menaAlMananInstallPromptSeenForever';
    const INSTALL_PROMPT_DISMISSED_KEY = 'menaAlMananInstallPromptDismissedForever';

    const hasPermanentInstallPromptRecord = () => {
        try {
            if (
                localStorage.getItem(INSTALL_PROMPT_SEEN_KEY) === '1' ||
                localStorage.getItem(INSTALL_PROMPT_DISMISSED_KEY) === '1'
            ) return true;
        } catch (error) {
            console.warn('تعذر قراءة حالة نافذة التثبيت من localStorage:', error);
        }

        return document.cookie.split('; ').some(cookie => (
            cookie === `${INSTALL_PROMPT_SEEN_KEY}=1` ||
            cookie === `${INSTALL_PROMPT_DISMISSED_KEY}=1`
        ));
    };

    const savePermanentInstallPromptRecord = () => {
        try {
            localStorage.setItem(INSTALL_PROMPT_SEEN_KEY, '1');
            localStorage.setItem(INSTALL_PROMPT_DISMISSED_KEY, '1');
        } catch (error) {
            console.warn('تعذر حفظ حالة نافذة التثبيت في localStorage:', error);
        }

        document.cookie = `${INSTALL_PROMPT_SEEN_KEY}=1; max-age=315360000; path=/; SameSite=Lax`;
        document.cookie = `${INSTALL_PROMPT_DISMISSED_KEY}=1; max-age=315360000; path=/; SameSite=Lax`;
    };

    const hideInstallOverlay = () => {
        const overlay = document.getElementById('pwaInstallOverlay');
        if (overlay) overlay.classList.add('pwa-hidden');
    };

    const showInstallOverlay = () => {
        if (isStandalone() || !isMobileDevice()) return;
        if (hasPermanentInstallPromptRecord()) return;

        // تسجيل الظهور قبل إنشاء النافذة لضمان ظهورها مرة واحدة فقط حتى لو لم يُضغط أي زر.
        savePermanentInstallPromptRecord();

        const overlay = document.createElement('div');
        overlay.id = 'pwaInstallOverlay';
        overlay.innerHTML = `
            <section class="pwa-install-card" role="dialog" aria-modal="true" aria-labelledby="pwaInstallTitle">
                <img class="pwa-install-icon" src="icons/icon-180.png" alt="أيقونة منة المنان">
                <h2 class="pwa-install-title" id="pwaInstallTitle">ثبت التطبيق الآن</h2>
                <p class="pwa-install-text" id="pwaInstallText">ثبّت «منة المنان» على هاتفك للوصول إليه بسرعة والعمل دون اتصال بالإنترنت.</p>
                <div class="pwa-install-actions">
                    <button type="button" id="pwaInstallButton">تثبيت التطبيق</button>
                    <button type="button" id="pwaDismissButton">لاحقًا</button>
                </div>
            </section>
        `;
        document.body.appendChild(overlay);

        const installButton = document.getElementById('pwaInstallButton');
        const dismissButton = document.getElementById('pwaDismissButton');
        const installText = document.getElementById('pwaInstallText');

        if (!deferredInstallPrompt) {
            installText.textContent = /iPhone|iPad|iPod/i.test(navigator.userAgent)
                ? 'اضغط زر المشاركة في متصفح Safari، ثم اختر «إضافة إلى الشاشة الرئيسية» لتثبيت التطبيق والعمل دون اتصال.'
                : 'افتح قائمة المتصفح واختر «إضافة إلى الشاشة الرئيسية» أو «تثبيت التطبيق» لإضافته إلى هاتفك والعمل دون اتصال.';
        }

        installButton.addEventListener('click', async () => {
            if (!deferredInstallPrompt) {
                hideInstallOverlay();
                return;
            }

            deferredInstallPrompt.prompt();
            const result = await deferredInstallPrompt.userChoice;
            deferredInstallPrompt = null;
            if (result && result.outcome === 'accepted') hideInstallOverlay();
        });

        dismissButton.addEventListener('click', () => {
            savePermanentInstallPromptRecord();
            sessionStorage.setItem('menaAlMananInstallPromptDismissed', '1');
            hideInstallOverlay();
        });
    };

    window.addEventListener('beforeinstallprompt', (event) => {
        event.preventDefault();
        deferredInstallPrompt = event;
        const installButton = document.getElementById('pwaInstallButton');
        const installText = document.getElementById('pwaInstallText');
        if (installButton) installButton.disabled = false;
        if (installText) installText.textContent = 'ثبّت «منة المنان» على هاتفك للوصول إليه بسرعة والعمل دون اتصال بالإنترنت.';
    });

    window.addEventListener('appinstalled', hideInstallOverlay);
    registerServiceWorker();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(showInstallOverlay, 800), { once: true });
    } else {
        setTimeout(showInstallOverlay, 800);
    }
})();
