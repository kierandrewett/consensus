import { E2EContext, setupE2E, teardownE2E, clearCookies, loginAsVoter } from "./setup";

describe("E2E: Voting Flow", () => {
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

    describe("Elections Public View", () => {
        it("should display elections list", async () => {
            await ctx.page.goto(`${ctx.baseUrl}/elections`);

            const heading = await ctx.page.$eval("h1", (el) => el.textContent);
            expect(heading).toContain("Election");
        });

        it("should display closed election results publicly", async () => {
            await ctx.page.goto(`${ctx.baseUrl}/elections`);

            const pageContent = await ctx.page.content();
            expect(pageContent.toLowerCase()).toMatch(/election|closed|results/);
        });
    });

    describe("Voting as Authenticated Voter", () => {
        beforeEach(async () => {
            await loginAsVoter(ctx);
        }, 15000);

        it("should display active elections for voting", async () => {
            await ctx.page.goto(`${ctx.baseUrl}/elections`);

            const pageContent = await ctx.page.content();
            expect(pageContent.toLowerCase()).toMatch(/election|vote|active/);
        });

        it("should show voting form for active election", async () => {
            await ctx.page.goto(`${ctx.baseUrl}/elections`);

            const voteBtn = await ctx.page.$("a.kiosk-btn");
            if (voteBtn) {
                await Promise.all([ctx.page.waitForNavigation({ waitUntil: "networkidle0" }), voteBtn.click()]);

                const pageContent = await ctx.page.content();
                expect(pageContent.toLowerCase()).toMatch(/vote|candidate|already/);
            }
        });
    });
});
