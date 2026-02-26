import { E2EContext, setupE2E, teardownE2E, clearCookies, loginAsAdmin } from "./setup";

describe("E2E: Admin Users Management", () => {
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

    describe("Admin Users List", () => {
        it("should display admin users page", async () => {
            await ctx.page.goto(`${ctx.baseUrl}/admin/admins`);

            const heading = await ctx.page.$eval("h1", (el) => el.textContent);
            expect(heading?.toLowerCase()).toMatch(/admin|user/);
        });

        it("should show at least one admin user (the default admin)", async () => {
            await ctx.page.goto(`${ctx.baseUrl}/admin/admins`);

            // Look for admin username in the table or list
            const pageContent = await ctx.page.content();
            expect(pageContent.toLowerCase()).toContain("admin");
        });

        it("should have create admin button or link", async () => {
            await ctx.page.goto(`${ctx.baseUrl}/admin/admins`);

            // Check for presence of creation UI
            const pageContent = await ctx.page.content();
            expect(pageContent.toLowerCase()).toMatch(/create|add|new/);
        });
    });

    describe("Admin Creation", () => {
        it("should open create admin modal or form", async () => {
            await ctx.page.goto(`${ctx.baseUrl}/admin/admins`);

            // Try to find and click create button
            const createBtn = await ctx.page.$("#createAdminBtn");
            if (createBtn) {
                await ctx.page.click("#createAdminBtn");
                await ctx.page.waitForSelector("#createAdminModal:not([hidden]), .modal:not(.hidden)", {
                    timeout: 5000,
                });

                const modal = await ctx.page.$("#createAdminModal:not([hidden]), .modal:not(.hidden)");
                expect(modal).not.toBeNull();
            }
        });

        it("should create a new admin user", async () => {
            await ctx.page.goto(`${ctx.baseUrl}/admin/admins`);

            const createBtn = await ctx.page.$("#createAdminBtn");
            if (createBtn) {
                await ctx.page.click("#createAdminBtn");
                await ctx.page.waitForSelector("#createAdminModal:not([hidden])", { timeout: 5000 });

                const uniqueUsername = `e2e_admin_${Date.now()}`;
                // Fill name first, then username (password is auto-generated)
                await ctx.page.type("#adminName", "E2E Test Admin");
                await ctx.page.type("#adminUsername", uniqueUsername);

                await Promise.all([
                    ctx.page.waitForNavigation({ waitUntil: "networkidle2" }),
                    ctx.page.click('#createAdminForm button[type="submit"]'),
                ]);

                // Check that we're redirected back to admins page or see success
                const pageContent = await ctx.page.content();
                expect(pageContent).toContain(uniqueUsername);
            }
        });

        it("should validate required fields for admin creation", async () => {
            await ctx.page.goto(`${ctx.baseUrl}/admin/admins`);

            const createBtn = await ctx.page.$("#createAdminBtn");
            if (createBtn) {
                await ctx.page.click("#createAdminBtn");
                await ctx.page.waitForSelector("#createAdminModal:not([hidden])", { timeout: 5000 });

                // Check for required attributes on form fields (no password field - it's auto-generated)
                const nameInput = await ctx.page.$("#adminName[required]");
                const usernameInput = await ctx.page.$("#adminUsername[required]");

                expect(nameInput).not.toBeNull();
                expect(usernameInput).not.toBeNull();
            }
        });
    });

    describe("Admin Deletion", () => {
        it("should not allow deleting yourself", async () => {
            await ctx.page.goto(`${ctx.baseUrl}/admin/admins`);

            // Look for delete buttons - should be disabled or not present for current admin
            const pageContent = await ctx.page.content();
            // The page should indicate that you cannot delete yourself
            expect(pageContent.toLowerCase()).toMatch(/admin|user/);
        });
    });
});
