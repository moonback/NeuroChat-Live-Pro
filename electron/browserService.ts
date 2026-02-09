import { chromium, Browser, BrowserContext, Page } from 'playwright';

export class BrowserService {
    private browser: Browser | null = null;
    private context: BrowserContext | null = null;
    private page: Page | null = null;

    async init(): Promise<Page> {
        if (!this.browser) {
            this.browser = await chromium.launch({
                headless: false, // On windows, it's better to show it for the user to see what's happening
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            this.context = await this.browser.newContext({
                viewport: { width: 1280, height: 720 },
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            });
            this.page = await this.context.newPage();
        }
        if (!this.page) {
            throw new Error('Failed to initialize browser page');
        }
        return this.page;
    }

    async navigate(url: string) {
        const page = await this.init();
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        return {
            url: page.url(),
            title: await page.title(),
            status: 'success'
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
