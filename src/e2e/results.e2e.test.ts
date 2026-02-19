import { E2EContext, setupE2E, teardownE2E, clearCookies, loginAsAdmin } from "./setup";

describe("E2E: Election Results", () => {
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

    describe("Public Results", () => {
        it("should show results for closed elections", async () => {
            await ctx.page.goto(`${ctx.baseUrl}/results`);

            const pageContent = await ctx.page.content();
            expect(pageContent.toLowerCase()).toMatch(/result|election|closed/);
        });
    });

    describe("Admin Results", () => {
        beforeEach(async () => {
            await loginAsAdmin(ctx);
        });

        it("should display admin results page", async () => {
            await ctx.page.goto(`${ctx.baseUrl}/admin/results`);

            const heading = await ctx.page.$eval("h1", (el) => el.textContent);
            expect(heading?.toLowerCase()).toContain("result");
        });
    });
});
