import { E2EContext, setupE2E, teardownE2E, clearCookies, loginAsAdmin } from "./setup";

describe("E2E: Admin Elections Management", () => {
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

    describe("Elections List", () => {
        it("should navigate to elections page", async () => {
            await ctx.page.goto(`${ctx.baseUrl}/admin/elections`);

            const heading = await ctx.page.$eval("h1", (el) => el.textContent);
            expect(heading).toContain("Election");
        });

        it("should open create election modal", async () => {
            await ctx.page.goto(`${ctx.baseUrl}/admin/elections`);

            const createBtn = await ctx.page.$("#createElectionBtn");
            expect(createBtn).not.toBeNull();

            await ctx.page.click("#createElectionBtn");

            await ctx.page.waitForSelector("#createElectionModal:not([hidden])", { timeout: 5000 });

            const modal = await ctx.page.$("#createElectionModal:not([hidden])");
            expect(modal).not.toBeNull();
        });
    });

    describe("Election Creation", () => {
        it("should create a new draft election", async () => {
            await ctx.page.goto(`${ctx.baseUrl}/admin/elections`);

            await ctx.page.click("#createElectionBtn");
            await ctx.page.waitForSelector("#createElectionModal:not([hidden])", { timeout: 5000 });

            const electionName = `E2E Test Election ${Date.now()}`;
            await ctx.page.type("#electionName", electionName);
            await ctx.page.select("#electionType", "FPTP");
            await ctx.page.type("#description", "E2E test election description");

            await Promise.all([
                ctx.page.waitForNavigation({ waitUntil: "networkidle0" }),
                ctx.page.click('#createElectionForm button[type="submit"]'),
            ]);

            const url = ctx.page.url();
            expect(url).toContain("/admin/elections/");
        });

        it("should validate election creation form has required fields", async () => {
            await ctx.page.goto(`${ctx.baseUrl}/admin/elections`);
            await ctx.page.click("#createElectionBtn");
            await ctx.page.waitForSelector("#createElectionModal:not([hidden])", { timeout: 5000 });

            const nameInput = await ctx.page.$("#electionName[required]");
            const typeSelect = await ctx.page.$("#electionType[required]");

            expect(nameInput).not.toBeNull();
            expect(typeSelect).not.toBeNull();
        });
    });

    describe("Election Details", () => {
        it("should view election details", async () => {
            // First ensure we have an election by creating one
            await ctx.page.goto(`${ctx.baseUrl}/admin/elections`);

            // Check if elections exist, if not create one
            let electionLink = await ctx.page.$('a[href*="/admin/elections/"]');
            if (!electionLink) {
                // Create an election
                await ctx.page.click("#createElectionBtn");
                await ctx.page.waitForSelector("#createElectionModal:not([hidden])", { timeout: 5000 });
                await ctx.page.type("#electionName", `Details Test Election ${Date.now()}`);
                await ctx.page.select("#electionType", "FPTP");
                await Promise.all([
                    ctx.page.waitForNavigation({ waitUntil: "networkidle0" }),
                    ctx.page.click('#createElectionForm button[type="submit"]'),
                ]);

                // Now we should be on the election details page
                const url = ctx.page.url();
                expect(url).toContain("/admin/elections/");
                const pageContent = await ctx.page.content();
                expect(pageContent.toLowerCase()).toMatch(/election|status|candidates/);
            } else {
                await Promise.all([ctx.page.waitForNavigation({ waitUntil: "networkidle0" }), electionLink.click()]);

                const pageContent = await ctx.page.content();
                expect(pageContent.toLowerCase()).toMatch(/election|status|candidates/);
            }
        });
    });

    describe("Candidate Management", () => {
        it("should add candidates to a draft election", async () => {
            // Create a new election first
            await ctx.page.goto(`${ctx.baseUrl}/admin/elections`);
            await ctx.page.click("#createElectionBtn");
            await ctx.page.waitForSelector("#createElectionModal:not([hidden])", { timeout: 10000 });

            const electionName = `Candidate Test Election ${Date.now()}`;
            await ctx.page.type("#electionName", electionName);
            await ctx.page.select("#electionType", "FPTP");
            await ctx.page.type("#description", "Test election for candidates");

            await Promise.all([
                ctx.page.waitForNavigation({ waitUntil: "networkidle0", timeout: 15000 }),
                ctx.page.click('#createElectionForm button[type="submit"]'),
            ]);

            const url = ctx.page.url();
            expect(url).toContain("/admin/elections/");

            // Add a candidate
            const addCandidateBtn = await ctx.page.$("#addCandidateBtn");
            if (addCandidateBtn) {
                await addCandidateBtn.click();
                await ctx.page.waitForSelector("#addCandidateModal:not([hidden])", { timeout: 10000 });

                await ctx.page.type("#candidateName", "Test Candidate 1");
                await ctx.page.type("#candidateParty", "Test Party");
                await ctx.page.type("#candidateBiography", "A test candidate for E2E testing");

                await ctx.page.click('#addCandidateForm button[type="submit"]');

                await ctx.page.waitForFunction(() => document.readyState === "complete", { timeout: 15000 });

                await new Promise((resolve) => setTimeout(resolve, 1000));

                const pageContent = await ctx.page.content();
                expect(pageContent).toContain("Test Candidate 1");
            }
        }, 60000);
    });
});
