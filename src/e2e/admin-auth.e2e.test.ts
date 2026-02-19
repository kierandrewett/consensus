import { E2EContext, setupE2E, teardownE2E, clearCookies, loginAsAdmin } from "./setup";

describe("E2E: Admin Authentication", () => {
    let ctx: E2EContext;

    beforeAll(async () => {
        ctx = await setupE2E();
    }, 30000);

    afterAll(async () => {
        await teardownE2E(ctx);
    });

    beforeEach(async () => {
        await clearCookies(ctx.page);
    });

    describe("Login", () => {
        it("should display admin login form", async () => {
            await ctx.page.goto(`${ctx.baseUrl}/admin/login`);

            const usernameInput = await ctx.page.$('input[name="username"]');
            const passwordInput = await ctx.page.$('input[name="password"]');
            const submitButton = await ctx.page.$('button[type="submit"]');

            expect(usernameInput).not.toBeNull();
            expect(passwordInput).not.toBeNull();
            expect(submitButton).not.toBeNull();
        });

        it("should login as admin with valid credentials", async () => {
            await loginAsAdmin(ctx);

            const url = ctx.page.url();
            expect(url).toContain("/admin/dashboard");
        });
    });

    describe("Dashboard", () => {
        beforeEach(async () => {
            await loginAsAdmin(ctx);
        });

        it("should display dashboard statistics", async () => {
            await ctx.page.goto(`${ctx.baseUrl}/admin/dashboard`);

            const pageContent = await ctx.page.content();
            expect(pageContent.toLowerCase()).toMatch(/voter|election|dashboard/);
        });

        it("should have navigation links to all admin sections", async () => {
            await ctx.page.goto(`${ctx.baseUrl}/admin/dashboard`);

            const electionsLink = await ctx.page.$('a[href="/admin/elections"]');
            const votersLink = await ctx.page.$('a[href="/admin/voters"]');
            const resultsLink = await ctx.page.$('a[href="/admin/results"]');

            expect(electionsLink).not.toBeNull();
            expect(votersLink).not.toBeNull();
            expect(resultsLink).not.toBeNull();
        });
    });

    describe("Logout", () => {
        it("should logout admin successfully", async () => {
            await loginAsAdmin(ctx);
            await ctx.page.goto(`${ctx.baseUrl}/admin/logout`);

            const url = ctx.page.url();
            expect(url === ctx.baseUrl || url === `${ctx.baseUrl}/` || url.includes("/admin/login")).toBe(true);
        });

        it("should not access admin pages after logout", async () => {
            await loginAsAdmin(ctx);
            await ctx.page.goto(`${ctx.baseUrl}/admin/logout`);

            await ctx.page.goto(`${ctx.baseUrl}/admin/dashboard`);
            const url = ctx.page.url();
            expect(url).toContain("/admin/login");
        });
    });

    describe("Access Control", () => {
        it("should redirect unauthenticated admin to login", async () => {
            await ctx.page.goto(`${ctx.baseUrl}/admin/dashboard`);

            const url = ctx.page.url();
            expect(url).toContain("/login");
        });

        it("should redirect voters from admin pages", async () => {
            // Register and login as voter
            const uniqueEmail = `e2e_access_${Date.now()}@test.com`;
            await ctx.page.goto(`${ctx.baseUrl}/register`);
            await ctx.page.type('input[name="name"]', "Access Test Voter");
            await ctx.page.type('input[name="email"]', uniqueEmail);
            await ctx.page.type('input[name="password"]', "SecurePassword123!");
            await Promise.all([
                ctx.page.waitForNavigation({ waitUntil: "networkidle0" }),
                ctx.page.click('button[type="submit"]'),
            ]);

            // Try to access admin dashboard
            await ctx.page.goto(`${ctx.baseUrl}/admin/dashboard`);
            const url = ctx.page.url();
            expect(url).toContain("/admin/login");
        });
    });
});
