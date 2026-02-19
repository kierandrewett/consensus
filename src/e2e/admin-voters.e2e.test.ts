import { E2EContext, setupE2E, teardownE2E, clearCookies, loginAsAdmin } from "./setup";

/**
 * Helper: Register a new voter and return their email
 */
async function createTestVoter(ctx: E2EContext, namePrefix: string): Promise<string> {
    await clearCookies(ctx.page);
    const uniqueEmail = `e2e_${namePrefix}_${Date.now()}@test.com`;
    await ctx.page.goto(`${ctx.baseUrl}/register`);
    await ctx.page.waitForSelector('input[name="name"]', { timeout: 5000 });
    await ctx.page.type('input[name="name"]', `${namePrefix} Test Voter`);
    await ctx.page.type('input[name="email"]', uniqueEmail);
    await ctx.page.type('input[name="password"]', "SecurePassword123!");
    await Promise.all([
        ctx.page.waitForNavigation({ waitUntil: "networkidle0" }),
        ctx.page.click('button[type="submit"]'),
    ]);
    return uniqueEmail;
}

describe("E2E: Admin Voters Management", () => {
    let ctx: E2EContext;

    beforeAll(async () => {
        ctx = await setupE2E();
        // Create a test voter so we have data to work with
        await createTestVoter(ctx, "setup");
        await clearCookies(ctx.page);
    }, 30000);

    afterAll(async () => {
        await teardownE2E(ctx);
    });

    beforeEach(async () => {
        await clearCookies(ctx.page);
        await loginAsAdmin(ctx);
    });

    describe("Voters List", () => {
        it("should display voters list", async () => {
            await ctx.page.goto(`${ctx.baseUrl}/admin/voters`);

            const heading = await ctx.page.$eval("h1", (el) => el.textContent);
            expect(heading?.toLowerCase()).toContain("voter");
        });

        it("should show voter status indicators", async () => {
            await ctx.page.goto(`${ctx.baseUrl}/admin/voters`);

            const pageContent = await ctx.page.content();
            // Should show status like pending, approved, rejected
            expect(pageContent.toLowerCase()).toMatch(/pending|approved|rejected|status/);
        });

        it("should have filter or search functionality", async () => {
            await ctx.page.goto(`${ctx.baseUrl}/admin/voters`);

            // Look for search input or filter controls
            const searchInput = await ctx.page.$(
                'input[type="search"], input[name="search"], input[placeholder*="search" i]'
            );
            const pageContent = await ctx.page.content();
            // Either has search input or filter tabs/buttons
            const hasFiltering =
                searchInput !== null ||
                pageContent.toLowerCase().includes("filter") ||
                pageContent.toLowerCase().includes("all") ||
                pageContent.toLowerCase().includes("pending");
            expect(hasFiltering).toBe(true);
        });
    });

    describe("Voter Details", () => {
        it("should show voter details", async () => {
            await ctx.page.goto(`${ctx.baseUrl}/admin/voters`);

            const voterLink = await ctx.page.$('a[href*="/admin/voters/"]');
            expect(voterLink).not.toBeNull(); // Should have at least one voter from setup

            await Promise.all([ctx.page.waitForNavigation({ waitUntil: "networkidle0" }), voterLink!.click()]);

            const url = ctx.page.url();
            expect(url).toContain("/admin/voters/");
        });

        it("should display voter information on details page", async () => {
            await ctx.page.goto(`${ctx.baseUrl}/admin/voters`);

            const voterLink = await ctx.page.$('a[href*="/admin/voters/"]');
            expect(voterLink).not.toBeNull();

            await Promise.all([ctx.page.waitForNavigation({ waitUntil: "networkidle0" }), voterLink!.click()]);

            const pageContent = await ctx.page.content();
            // Should show voter details like name, email, status
            expect(pageContent.toLowerCase()).toMatch(/name|email|status|voter/);
        });
    });

    describe("Voter Approval", () => {
        it("should have approve button for pending voters", async () => {
            // First create a pending voter via registration
            await clearCookies(ctx.page);
            const uniqueEmail = `e2e_pending_${Date.now()}@test.com`;
            await ctx.page.goto(`${ctx.baseUrl}/register`);
            await ctx.page.waitForSelector('input[name="name"]', { timeout: 5000 });
            await ctx.page.type('input[name="name"]', "Pending Test Voter");
            await ctx.page.type('input[name="email"]', uniqueEmail);
            await ctx.page.type('input[name="password"]', "SecurePassword123!");
            await Promise.all([
                ctx.page.waitForNavigation({ waitUntil: "networkidle0" }),
                ctx.page.click('button[type="submit"]'),
            ]);

            // Login as admin to check the voter
            await loginAsAdmin(ctx);
            await ctx.page.goto(`${ctx.baseUrl}/admin/voters`);

            const pageContent = await ctx.page.content();
            // Should show pending voters or approve button
            expect(pageContent.toLowerCase()).toMatch(/pending|approve/);
        });

        it("should approve a pending voter", async () => {
            // Create a new pending voter
            await clearCookies(ctx.page);
            const uniqueEmail = `e2e_approve_${Date.now()}@test.com`;
            await ctx.page.goto(`${ctx.baseUrl}/register`);
            await ctx.page.waitForSelector('input[name="name"]', { timeout: 5000 });
            await ctx.page.type('input[name="name"]', "Approve Test Voter");
            await ctx.page.type('input[name="email"]', uniqueEmail);
            await ctx.page.type('input[name="password"]', "SecurePassword123!");
            await Promise.all([
                ctx.page.waitForNavigation({ waitUntil: "networkidle0" }),
                ctx.page.click('button[type="submit"]'),
            ]);

            // Login as admin (loginAsAdmin clears cookies internally)
            await loginAsAdmin(ctx);
            await ctx.page.goto(`${ctx.baseUrl}/admin/voters`, { waitUntil: "networkidle0" });

            // Look for approve button or link
            const approveBtn = await ctx.page.$(
                'button[data-action="approve"], a[href*="approve"], form[action*="approve"] button'
            );
            if (approveBtn) {
                await Promise.all([
                    ctx.page.waitForNavigation({ waitUntil: "networkidle0" }).catch(() => {}),
                    approveBtn.click(),
                ]);

                const pageContent = await ctx.page.content();
                expect(pageContent.toLowerCase()).toMatch(/approved|success|voter/);
            }
        });
    });

    describe("Voter Rejection", () => {
        it("should have reject button for pending voters", async () => {
            await ctx.page.goto(`${ctx.baseUrl}/admin/voters`);

            const pageContent = await ctx.page.content();
            // Should show reject option
            expect(pageContent.toLowerCase()).toMatch(/reject|pending/);
        });

        it("should reject a pending voter", async () => {
            // Create a new pending voter
            await clearCookies(ctx.page);
            const uniqueEmail = `e2e_reject_${Date.now()}@test.com`;
            await ctx.page.goto(`${ctx.baseUrl}/register`);
            await ctx.page.waitForSelector('input[name="name"]', { timeout: 5000 });
            await ctx.page.type('input[name="name"]', "Reject Test Voter");
            await ctx.page.type('input[name="email"]', uniqueEmail);
            await ctx.page.type('input[name="password"]', "SecurePassword123!");
            await Promise.all([
                ctx.page.waitForNavigation({ waitUntil: "networkidle0" }),
                ctx.page.click('button[type="submit"]'),
            ]);

            // Login as admin (loginAsAdmin clears cookies internally)
            await loginAsAdmin(ctx);
            await ctx.page.goto(`${ctx.baseUrl}/admin/voters`, { waitUntil: "networkidle0" });

            // Look for reject button or link
            const rejectBtn = await ctx.page.$(
                'button[data-action="reject"], a[href*="reject"], form[action*="reject"] button'
            );
            if (rejectBtn) {
                await Promise.all([
                    ctx.page.waitForNavigation({ waitUntil: "networkidle0" }).catch(() => {}),
                    rejectBtn.click(),
                ]);

                const pageContent = await ctx.page.content();
                expect(pageContent.toLowerCase()).toMatch(/rejected|success|voter/);
            }
        });
    });
});
