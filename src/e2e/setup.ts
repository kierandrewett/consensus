import { ChildProcess, spawn } from "child_process";
import puppeteer, { Browser, Page } from "puppeteer";

export interface E2EContext {
    browser: Browser;
    page: Page;
    serverProcess?: ChildProcess;
    baseUrl: string;
}

const TEST_PORT = 3099;

/**
 * Wait for server to be ready by polling
 */
async function waitForServer(url: string, timeout: number): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        try {
            const response = await fetch(url);
            if (response.ok || response.status < 500) {
                return;
            }
        } catch {
            // Server not ready yet
        }
        await new Promise((resolve) => setTimeout(resolve, 200));
    }
    throw new Error(`Server did not start within ${timeout}ms`);
}

export async function setupE2E(): Promise<E2EContext> {
    const wsEndpoint = process.env.__E2E_WS_ENDPOINT__;
    const baseUrl = process.env.__E2E_BASE_URL__ || `http://127.0.0.1:${TEST_PORT}`;

    let browser: Browser;
    let serverProcess: ChildProcess | undefined;

    if (wsEndpoint) {
        // Connect to shared browser from global setup
        browser = await puppeteer.connect({ browserWSEndpoint: wsEndpoint });
    } else {
        // Standalone mode - start own server and browser
        serverProcess = spawn("node", ["dist/index.js"], {
            cwd: process.cwd(),
            env: { ...process.env, PORT: String(TEST_PORT), NODE_ENV: "test" },
            stdio: ["pipe", "pipe", "pipe"],
        });

        await waitForServer(baseUrl, 15000);

        browser = await puppeteer.launch({
            headless: false,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
            slowMo: 50, // Slow down actions by 50ms so you can see what's happening
        });
    }

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    return {
        browser,
        page,
        serverProcess,
        baseUrl,
    };
}

export async function teardownE2E(ctx: E2EContext): Promise<void> {
    // Close the page, but keep browser open if using shared instance
    if (ctx.page) {
        await ctx.page.close();
    }

    // Only close browser and server if we started them (standalone mode)
    if (ctx.serverProcess) {
        await ctx.browser.close();
        ctx.serverProcess.kill("SIGTERM");
        await new Promise((resolve) => setTimeout(resolve, 500));
    }
}

export async function clearCookies(page: Page): Promise<void> {
    const client = await page.createCDPSession();
    await client.send("Network.clearBrowserCookies");
}

// Track admin password state (changes after first forced password change)
let adminPassword = "admin123";
const CHANGED_ADMIN_PASSWORD = "NewAdmin123!";

/**
 * Helper: Login as admin
 */
export async function loginAsAdmin(ctx: E2EContext): Promise<void> {
    // Clear any existing session state
    await clearCookies(ctx.page);

    // Navigate to login page and wait for it to fully load
    await ctx.page.goto(`${ctx.baseUrl}/admin/login`, { timeout: 15000, waitUntil: "networkidle0" });

    // If already redirected to dashboard, we're logged in
    if (ctx.page.url().includes("/admin/dashboard")) {
        return;
    }

    // Wait for the form to be present
    await ctx.page.waitForSelector('input[name="username"]', { visible: true, timeout: 10000 });

    await ctx.page.type('input[name="username"]', "admin");
    await ctx.page.type('input[name="password"]', adminPassword);
    await Promise.all([
        ctx.page.waitForNavigation({ waitUntil: "networkidle0", timeout: 15000 }),
        ctx.page.click('button[type="submit"]'),
    ]);

    // Handle forced password change if required
    if (ctx.page.url().includes("/admin/change-password")) {
        await ctx.page.waitForSelector('input[name="password"]', { visible: true, timeout: 5000 });
        await ctx.page.type('input[name="password"]', CHANGED_ADMIN_PASSWORD);
        await ctx.page.type('input[name="confirmPassword"]', CHANGED_ADMIN_PASSWORD);
        await Promise.all([
            ctx.page.waitForNavigation({ waitUntil: "networkidle0", timeout: 15000 }),
            ctx.page.click('button[type="submit"]'),
        ]);
        // Update the password for subsequent logins
        adminPassword = CHANGED_ADMIN_PASSWORD;
    }
}

/**
 * Helper: Login as voter
 */
export async function loginAsVoter(
    ctx: E2EContext,
    email = "alice@example.com",
    password = "password123"
): Promise<void> {
    // Clear any existing session state
    await clearCookies(ctx.page);

    await ctx.page.goto(`${ctx.baseUrl}/login`, { timeout: 10000 });
    await ctx.page.waitForSelector('input[name="email"]', { timeout: 5000 });
    await ctx.page.type('input[name="email"]', email);
    await ctx.page.type('input[name="password"]', password);
    await Promise.all([
        ctx.page.waitForNavigation({ waitUntil: "networkidle0", timeout: 10000 }),
        ctx.page.click('button[type="submit"]'),
    ]);
}
