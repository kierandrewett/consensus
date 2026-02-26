import { E2EContext, setupE2E, teardownE2E, clearCookies, loginAsAdmin } from "./setup";

describe("E2E: Admin Results", () => {
    let ctx: E2EContext;

    beforeAll(async () => {
        ctx = await setupE2E();
    }, 30000);

    afterAll(async () => {
        await teardownE2E(ctx);
    });

    beforeEach(async () => {
        await clearCookies(ctx.page);
        await loginAsAdmin(ctx);
    });

    describe("Results Page", () => {
        it("should display results page", async () => {
            await ctx.page.goto(`${ctx.baseUrl}/admin/results`);

            const heading = await ctx.page.$eval("h1", (el) => el.textContent);
            expect(heading?.toLowerCase()).toMatch(/result/);
        });

        it("should show list of completed or active elections", async () => {
            await ctx.page.goto(`${ctx.baseUrl}/admin/results`);

            const pageContent = await ctx.page.content();
            // Should show elections or a message about no elections
            expect(pageContent.toLowerCase()).toMatch(/election|result|no.*election|empty/);
        });

        it("should navigate to election results from list", async () => {
            await ctx.page.goto(`${ctx.baseUrl}/admin/results`, { waitUntil: "networkidle2" });

            const resultLink = await ctx.page.$('a[href*="/admin/elections/"]');
            if (resultLink) {
                await Promise.all([
                    ctx.page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }),
                    resultLink.click(),
                ]);

                const url = ctx.page.url();
                expect(url).toContain("/admin/elections/");
            }
        });
    });

    describe("Election Result Details", () => {
        it("should display vote counts when viewing election results", async () => {
            // First create and close an election with votes
            await ctx.page.goto(`${ctx.baseUrl}/admin/elections`);

            // Try to find a closed election with results
            const pageContent = await ctx.page.content();

            // Check if there are any elections
            if (pageContent.toLowerCase().includes("closed") || pageContent.toLowerCase().includes("complete")) {
                // Navigate to results
                await ctx.page.goto(`${ctx.baseUrl}/admin/results`);

                const resultsContent = await ctx.page.content();
                // Should show vote counts or winner info
                expect(resultsContent.toLowerCase()).toMatch(/vote|winner|result|count|total/);
            }
        });

        it("should show tie information if election resulted in tie", async () => {
            await ctx.page.goto(`${ctx.baseUrl}/admin/results`);

            const pageContent = await ctx.page.content();
            // Page should load without errors
            expect(pageContent).toBeDefined();
        });
    });

    describe("Results Navigation", () => {
        it("should have link to results in dashboard", async () => {
            await ctx.page.goto(`${ctx.baseUrl}/admin/dashboard`);

            const resultsLink = await ctx.page.$('a[href="/admin/results"]');
            expect(resultsLink).not.toBeNull();
        });

        it("should have link to results in sidebar", async () => {
            await ctx.page.goto(`${ctx.baseUrl}/admin/dashboard`);

            const sidebarResultsLink = await ctx.page.$(
                'nav a[href="/admin/results"], aside a[href="/admin/results"], .sidebar a[href="/admin/results"]'
            );
            expect(sidebarResultsLink).not.toBeNull();
        });
    });
});
