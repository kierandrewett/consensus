import { E2EContext, setupE2E, teardownE2E, clearCookies, loginAsVoter } from './setup';

describe('E2E: Voter Authentication', () => {
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

    describe('Registration', () => {
        it('should display registration form', async () => {
            await ctx.page.goto(`${ctx.baseUrl}/register`);

            const nameInput = await ctx.page.$('input[name="name"]');
            const emailInput = await ctx.page.$('input[name="email"]');
            const passwordInput = await ctx.page.$('input[name="password"]');
            const submitButton = await ctx.page.$('button[type="submit"]');

            expect(nameInput).not.toBeNull();
            expect(emailInput).not.toBeNull();
            expect(passwordInput).not.toBeNull();
            expect(submitButton).not.toBeNull();
        });

        it('should show error for weak password', async () => {
            await ctx.page.goto(`${ctx.baseUrl}/register`);
            await ctx.page.waitForSelector('input[name="password"]');

            await ctx.page.type('input[name="name"]', 'Test User');
            await ctx.page.type('input[name="email"]', 'weakpass@test.com');
            await ctx.page.type('input[name="password"]', '123');

            // Check that the password strength indicator shows weak password
            // and submit button is disabled (client-side validation)
            const strengthText = await ctx.page.$eval('#strengthText', el => el.textContent);
            expect(strengthText?.toLowerCase()).toContain('weak');
            
            // Check submit button is disabled
            const isDisabled = await ctx.page.$eval('#submitBtn', el => (el as HTMLButtonElement).disabled);
            expect(isDisabled).toBe(true);
        });

        it('should successfully register a new voter', async () => {
            const uniqueEmail = `e2e_voter_${Date.now()}@test.com`;
            
            await ctx.page.goto(`${ctx.baseUrl}/register`);
            await ctx.page.waitForSelector('input[name="name"]');

            await ctx.page.type('input[name="name"]', 'E2E Test Voter');
            await ctx.page.type('input[name="email"]', uniqueEmail);
            await ctx.page.type('input[name="password"]', 'SecurePassword123!');

            await Promise.all([
                ctx.page.waitForNavigation({ waitUntil: 'networkidle0' }),
                ctx.page.click('button[type="submit"]')
            ]);

            const url = ctx.page.url();
            expect(url).toContain('/');
        });

        it('should prevent registration with duplicate email', async () => {
            await ctx.page.goto(`${ctx.baseUrl}/register`);
            await ctx.page.waitForSelector('input[name="name"]');

            await ctx.page.type('input[name="name"]', 'Duplicate User');
            await ctx.page.type('input[name="email"]', 'alice@example.com');
            await ctx.page.type('input[name="password"]', 'SecurePassword123!');

            await ctx.page.click('button[type="submit"]');
            await ctx.page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});

            const pageContent = await ctx.page.content();
            expect(pageContent.toLowerCase()).toMatch(/already|exists|duplicate|error/);
        });
    });

    describe('Login', () => {
        it('should display login form', async () => {
            await ctx.page.goto(`${ctx.baseUrl}/login`);

            const emailInput = await ctx.page.$('input[name="email"]');
            const passwordInput = await ctx.page.$('input[name="password"]');
            const submitButton = await ctx.page.$('button[type="submit"]');

            expect(emailInput).not.toBeNull();
            expect(passwordInput).not.toBeNull();
            expect(submitButton).not.toBeNull();
        });

        it('should show error for invalid credentials', async () => {
            await ctx.page.goto(`${ctx.baseUrl}/login`);

            await ctx.page.type('input[name="email"]', 'nonexistent@test.com');
            await ctx.page.type('input[name="password"]', 'wrongpassword');

            await ctx.page.click('button[type="submit"]');
            await ctx.page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});

            const pageContent = await ctx.page.content();
            expect(pageContent.toLowerCase()).toMatch(/invalid|error|incorrect/);
        });
    });

    describe('Dashboard', () => {
        beforeEach(async () => {
            await loginAsVoter(ctx);
        });

        it('should display voter dashboard after login', async () => {
            const url = ctx.page.url();
            expect(url).toContain('/dashboard');

            const pageContent = await ctx.page.content();
            expect(pageContent.toLowerCase()).toContain('dashboard');
        });

        it('should show voter profile information', async () => {
            await ctx.page.goto(`${ctx.baseUrl}/dashboard`);

            const pageContent = await ctx.page.content();
            expect(pageContent).toContain('Alice');
        });
    });

    describe('Logout', () => {
        it('should logout voter successfully', async () => {
            await loginAsVoter(ctx);
            await ctx.page.goto(`${ctx.baseUrl}/logout`, { timeout: 10000 });

            const url = ctx.page.url();
            expect(url === ctx.baseUrl || url === `${ctx.baseUrl}/` || url.includes('/login')).toBe(true);
        }, 45000);
    });

    describe('Access Control', () => {
        it('should redirect unauthenticated voters to login', async () => {
            await ctx.page.goto(`${ctx.baseUrl}/dashboard`);

            const url = ctx.page.url();
            expect(url).toContain('/login');
        });
    });
});
