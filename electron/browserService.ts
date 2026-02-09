import { chromium, Browser, BrowserContext, Page } from 'playwright';

export class BrowserService {
    private browser: Browser | null = null;
    private context: BrowserContext | null = null;
    private page: Page | null = null;
    private initPromise: Promise<Page> | null = null;

    async init(newTab: boolean = false): Promise<Page> {
        // S'il y a déjà une initialisation en cours, on l'attend
        if (this.initPromise) {
            const page = await this.initPromise;
            if (newTab && this.context) {
                const newPage = await this.context.newPage();
                newPage.on('close', () => {
                    if (this.page === newPage) this.page = null;
                });
                return newPage;
            }
            return page;
        }

        this.initPromise = (async () => {
            try {
                // Si le browser a été fermé manuellement, on réinitialise tout
                if (this.browser && !this.browser.isConnected()) {
                    this.browser = null;
                    this.context = null;
                    this.page = null;
                }

                if (!this.browser) {
                    this.browser = await chromium.launch({
                        headless: false,
                        args: ['--no-sandbox', '--disable-setuid-sandbox']
                    });

                    // Gérer la fermeture inattendue
                    this.browser.on('disconnected', () => {
                        this.browser = null;
                        this.context = null;
                        this.page = null;
                        this.initPromise = null;
                    });

                    this.context = await this.browser.newContext({
                        viewport: { width: 1280, height: 720 },
                        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    });

                    this.page = await this.context.newPage();

                    // Gérer la fermeture de la page
                    this.page.on('close', () => {
                        this.page = null;
                    });
                }

                // Si la page principale a été fermée mais pas le browser, on en ouvre une nouvelle
                if (!this.page && this.context) {
                    this.page = await this.context.newPage();
                    this.page.on('close', () => {
                        this.page = null;
                    });
                }

                if (!this.page) {
                    throw new Error('Impossible d\'initialiser la page du navigateur');
                }

                // Si on a demandé un nouvel onglet spécifiquement
                if (newTab && this.context) {
                    const newPage = await this.context.newPage();
                    newPage.on('close', () => {
                        if (this.page === newPage) this.page = null;
                    });
                    return newPage;
                }

                return this.page;
            } finally {
                this.initPromise = null;
            }
        })();

        return this.initPromise;
    }

    async navigate(url: string, newTab: boolean = false) {
        const page = await this.init(newTab);
        // Use 'load' for more completeness, but with a reasonable timeout
        await page.goto(url, { waitUntil: 'load', timeout: 30000 }).catch(e => {
            console.warn('[BrowserService] Navigation timeout or error, trying to proceed anyway:', e.message);
        });

        return {
            url: page.url(),
            title: await page.title(),
            status: 'success',
            tabOpened: newTab
        };
    }

    async search(query: string) {
        const page = await this.init();
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        await page.goto(searchUrl, { waitUntil: 'load', timeout: 30000 }).catch(() => { });

        // Try to wait for results to appear
        await page.waitForSelector('#search', { timeout: 5000 }).catch(() => { });

        return {
            status: 'success',
            url: page.url(),
            title: await page.title()
        };
    }

    async click(selector: string) {
        const page = await this.init();
        // Scroll to element before clicking
        await page.locator(selector).first().scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => { });
        await page.click(selector, { timeout: 10000 });
        return { status: 'success' };
    }

    async type(selector: string, text: string) {
        const page = await this.init();
        await page.fill(selector, text, { timeout: 10000 });
        return { status: 'success' };
    }

    async press(key: string) {
        const page = await this.init();
        await page.keyboard.press(key);
        return { status: 'success' };
    }

    async scroll(direction: 'up' | 'down' | 'top' | 'bottom') {
        const page = await this.init();
        await page.evaluate((dir) => {
            if (dir === 'up') window.scrollBy(0, -window.innerHeight * 0.8);
            else if (dir === 'down') window.scrollBy(0, window.innerHeight * 0.8);
            else if (dir === 'top') window.scrollTo(0, 0);
            else if (dir === 'bottom') window.scrollTo(0, document.body.scrollHeight);
        }, direction);
        return { status: 'success' };
    }

    async goBack() {
        const page = await this.init();
        await page.goBack().catch(() => { });
        return { status: 'success', url: page.url() };
    }

    async goForward() {
        const page = await this.init();
        await page.goForward().catch(() => { });
        return { status: 'success', url: page.url() };
    }

    async getContent() {
        const page = await this.init();
        const data = await page.evaluate(() => {
            // Target main content area if possible to reduce noise
            const main = document.querySelector('main') || document.querySelector('article') || document.body;

            // Temporary removal of scripts, styles and invisible elements for cleaner text
            const scripts = document.querySelectorAll('script, style, noscript, svg, iframe');
            const hidden: any[] = [];
            scripts.forEach(s => {
                hidden.push({ parent: s.parentNode, next: s.nextSibling, node: s });
                s.remove();
            });

            const content = (main as HTMLElement).innerText;

            // Restore removed elements (optional but safer)
            hidden.reverse().forEach((h: any) => {
                if (h.parent) h.parent.insertBefore(h.node, h.next);
            });

            return {
                content: content,
                title: document.title,
                url: window.location.href
            };
        });

        return {
            content: data.content.substring(0, 15000), // Slightly increased limit
            title: data.title,
            url: data.url
        };
    }

    async screenshot() {
        const page = await this.init();
        const buffer = await page.screenshot({
            type: 'jpeg',
            quality: 70, // Reduced quality for faster transfer
            fullPage: false
        });
        return buffer.toString('base64');
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.context = null;
            this.page = null;
        }
    }
}

export const browserService = new BrowserService();
