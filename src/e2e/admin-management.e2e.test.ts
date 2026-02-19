import { E2EContext, setupE2E, teardownE2E, clearCookies, loginAsAdmin } from "./setup";

describe("E2E: Admin Management Settings", () => {
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

    describe("Management Page", () => {
        it("should display management settings page", async () => {
            await ctx.page.goto(`${ctx.baseUrl}/admin/management`);

            const heading = await ctx.page.$eval("h1", (el) => el.textContent);
            expect(heading?.toLowerCase()).toMatch(/management|settings|system/);
        });

        it("should have banner settings section", async () => {
            await ctx.page.goto(`${ctx.baseUrl}/admin/management`);

            const pageContent = await ctx.page.content();
            expect(pageContent.toLowerCase()).toContain("banner");
        });

        it("should have maintenance mode toggle", async () => {
            await ctx.page.goto(`${ctx.baseUrl}/admin/management`);

            // Look for maintenance mode checkbox or toggle
            const maintenanceToggle = await ctx.page.$('input[name="maintenanceMode"], #maintenanceMode');
            expect(maintenanceToggle).not.toBeNull();
        });

        it("should have signup enabled toggle", async () => {
            await ctx.page.goto(`${ctx.baseUrl}/admin/management`);

            const signupToggle = await ctx.page.$('input[name="signupEnabled"], #signupEnabled');
            expect(signupToggle).not.toBeNull();
        });

        it("should have login enabled toggle", async () => {
            await ctx.page.goto(`${ctx.baseUrl}/admin/management`);

            const loginToggle = await ctx.page.$('input[name="loginEnabled"], #loginEnabled');
            expect(loginToggle).not.toBeNull();
        });

        it("should have guest voting toggle", async () => {
            await ctx.page.goto(`${ctx.baseUrl}/admin/management`);

            const guestVotingToggle = await ctx.page.$('input[name="guestVotingEnabled"], #guestVotingEnabled');
            expect(guestVotingToggle).not.toBeNull();
        });

        it("should have turnstile settings section", async () => {
            await ctx.page.goto(`${ctx.baseUrl}/admin/management`);

            const pageContent = await ctx.page.content();
            expect(pageContent.toLowerCase()).toContain("turnstile");
        });
    });

    describe("Settings Update", () => {
        it("should update banner settings", async () => {
            await ctx.page.goto(`${ctx.baseUrl}/admin/management`);

            // Enable banner
            const bannerEnabledCheckbox = await ctx.page.$('input[name="bannerEnabled"]');
            if (bannerEnabledCheckbox) {
                const isChecked = await ctx.page.$eval(
                    'input[name="bannerEnabled"]',
                    (el: HTMLInputElement) => el.checked
                );
                if (!isChecked) {
                    await ctx.page.click('input[name="bannerEnabled"]');
                }

                // Set banner message
                const bannerMessageInput = await ctx.page.$(
                    'input[name="bannerMessage"], textarea[name="bannerMessage"]'
                );
                if (bannerMessageInput) {
                    await ctx.page.$eval(
                        'input[name="bannerMessage"], textarea[name="bannerMessage"]',
                        (el: HTMLInputElement | HTMLTextAreaElement) => (el.value = "")
                    );
                    await ctx.page.type(
                        'input[name="bannerMessage"], textarea[name="bannerMessage"]',
                        "E2E Test Banner Message"
                    );
                }

                // Submit form
                await Promise.all([
                    ctx.page.waitForNavigation({ waitUntil: "networkidle0" }),
                    ctx.page.click('button[type="submit"]'),
                ]);

                // Verify settings were saved
                const pageContent = await ctx.page.content();
                expect(pageContent).toContain("E2E Test Banner Message");
            }
        });

        it("should toggle maintenance mode", async () => {
            await ctx.page.goto(`${ctx.baseUrl}/admin/management`);

            const maintenanceCheckbox = await ctx.page.$('input[name="maintenanceMode"]');
            if (maintenanceCheckbox) {
                // Get current state
                const isChecked = await ctx.page.$eval(
                    'input[name="maintenanceMode"]',
                    (el: HTMLInputElement) => el.checked
                );

                // Toggle it
                await ctx.page.click('input[name="maintenanceMode"]');

                // Submit form
                await Promise.all([
                    ctx.page.waitForNavigation({ waitUntil: "networkidle0" }),
                    ctx.page.click('button[type="submit"]'),
                ]);

                // Verify toggle worked
                const newState = await ctx.page.$eval(
                    'input[name="maintenanceMode"]',
                    (el: HTMLInputElement) => el.checked
                );
                expect(newState).toBe(!isChecked);

                // Reset to original state
                await ctx.page.click('input[name="maintenanceMode"]');
                await Promise.all([
                    ctx.page.waitForNavigation({ waitUntil: "networkidle0" }),
                    ctx.page.click('button[type="submit"]'),
                ]);
            }
        });

        it("should save auto-approval setting", async () => {
            await ctx.page.goto(`${ctx.baseUrl}/admin/management`);

            const autoApprovalCheckbox = await ctx.page.$('input[name="autoApprovalEnabled"]');
            if (autoApprovalCheckbox) {
                const isChecked = await ctx.page.$eval(
                    'input[name="autoApprovalEnabled"]',
                    (el: HTMLInputElement) => el.checked
                );

                // Toggle
                await ctx.page.click('input[name="autoApprovalEnabled"]');

                await Promise.all([
                    ctx.page.waitForNavigation({ waitUntil: "networkidle0" }),
                    ctx.page.click('button[type="submit"]'),
                ]);

                const newState = await ctx.page.$eval(
                    'input[name="autoApprovalEnabled"]',
                    (el: HTMLInputElement) => el.checked
                );
                expect(newState).toBe(!isChecked);

                // Reset
                await ctx.page.click('input[name="autoApprovalEnabled"]');
                await Promise.all([
                    ctx.page.waitForNavigation({ waitUntil: "networkidle0" }),
                    ctx.page.click('button[type="submit"]'),
                ]);
            }
        });
    });

    describe("Form Validation", () => {
        it("should have submit button", async () => {
            await ctx.page.goto(`${ctx.baseUrl}/admin/management`);

            const submitBtn = await ctx.page.$('button[type="submit"]');
            expect(submitBtn).not.toBeNull();
        });

        it("should have form element", async () => {
            await ctx.page.goto(`${ctx.baseUrl}/admin/management`);

            const form = await ctx.page.$("form");
            expect(form).not.toBeNull();
        });
    });
});
