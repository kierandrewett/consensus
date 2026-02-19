import { E2EContext, setupE2E, teardownE2E, clearCookies } from "./setup";

describe("E2E: Home Page", () => {
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

    it("should display the home page with welcome message", async () => {
        await ctx.page.goto(ctx.baseUrl);

        const title = await ctx.page.title();
        expect(title).toContain("Consensus");

        const heading = await ctx.page.$eval("h1", (el) => el.textContent);
        expect(heading).toBeTruthy();
    });

    it("should have navigation links", async () => {
        await ctx.page.goto(ctx.baseUrl);

        const registerLink = await ctx.page.$('a[href="/register"]');
        const loginLink = await ctx.page.$('a[href="/login"]');

        expect(registerLink).not.toBeNull();
        expect(loginLink).not.toBeNull();
    });

    it("should have proper navigation structure", async () => {
        await ctx.page.goto(ctx.baseUrl);

        const nav = await ctx.page.$("nav, .navbar, .navigation, header");
        expect(nav).not.toBeNull();
    });

    it("should have footer", async () => {
        await ctx.page.goto(ctx.baseUrl);

        const footer = await ctx.page.$("footer");
        expect(footer).not.toBeNull();
    });
});
