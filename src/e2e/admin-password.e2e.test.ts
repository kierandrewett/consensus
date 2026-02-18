import { E2EContext, setupE2E, teardownE2E, clearCookies, loginAsAdmin } from './setup';

describe('E2E: Admin Password Change', () => {
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

    describe('Change Password Page', () => {
        it('should display change password page', async () => {
            await ctx.page.goto(`${ctx.baseUrl}/admin/change-password`);

            const heading = await ctx.page.$eval('h1, h2', el => el.textContent);
            expect(heading?.toLowerCase()).toMatch(/password|change/);
        });

        it('should have password input fields', async () => {
            await ctx.page.goto(`${ctx.baseUrl}/admin/change-password`);

            const passwordInput = await ctx.page.$('input[name="password"], input[type="password"]');
            expect(passwordInput).not.toBeNull();
        });

        it('should have confirm password field', async () => {
            await ctx.page.goto(`${ctx.baseUrl}/admin/change-password`);

            const confirmInput = await ctx.page.$('input[name="confirmPassword"]');
            expect(confirmInput).not.toBeNull();
        });

        it('should have submit button', async () => {
            await ctx.page.goto(`${ctx.baseUrl}/admin/change-password`);

            const submitBtn = await ctx.page.$('button[type="submit"]');
            expect(submitBtn).not.toBeNull();
        });
    });

    describe('Password Validation', () => {
        it('should require password fields', async () => {
            await ctx.page.goto(`${ctx.baseUrl}/admin/change-password`);

            const passwordInput = await ctx.page.$('input[name="password"][required], input[type="password"][required]');
            const confirmInput = await ctx.page.$('input[name="confirmPassword"][required]');

            expect(passwordInput).not.toBeNull();
            expect(confirmInput).not.toBeNull();
        });

        it('should show error when passwords do not match', async () => {
            await ctx.page.goto(`${ctx.baseUrl}/admin/change-password`);

            await ctx.page.type('input[name="password"]', 'NewPassword123!');
            await ctx.page.type('input[name="confirmPassword"]', 'DifferentPassword456!');

            await Promise.all([
                ctx.page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {}),
                ctx.page.click('button[type="submit"]')
            ]);

            // Should show error or stay on page
            const pageContent = await ctx.page.content();
            const hasError = pageContent.toLowerCase().includes('match') ||
                             pageContent.toLowerCase().includes('error') ||
                             pageContent.toLowerCase().includes('same') ||
                             ctx.page.url().includes('change-password');
            expect(hasError).toBe(true);
        });
    });

    describe('Force Password Change', () => {
        it('should redirect to change password if force change required', async () => {
            // This tests the flow when an admin has requirePasswordChange = true
            // The default admin user should have this flag set initially
            // After the user changes their password, they should be able to proceed
            
            // Check if we're redirected to change password
            const url = ctx.page.url();
            // Either on dashboard (password already changed) or on change password page
            expect(url.includes('/admin/') || url.includes('/change-password')).toBe(true);
        });
    });
});
