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
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        return {
            url: page.url(),
            title: await page.title(),
            status: 'success',
            tabOpened: newTab
        };
    }

    async click(selector: string) {
        const page = await this.init();
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

    async getContent() {
        const page = await this.init();
        const content = await page.evaluate(() => {
            // Basic text extraction without too much noise
            return document.body.innerText;
        });
        return {
            content: content.substring(0, 10000), // Limit to avoid hitting token limits
            url: page.url()
        };
    }

    async screenshot() {
        const page = await this.init();
        const buffer = await page.screenshot({ type: 'jpeg', quality: 80 });
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
