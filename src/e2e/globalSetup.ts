import { ChildProcess, spawn, execSync } from 'child_process';
import puppeteer, { Browser } from 'puppeteer';

const TEST_PORT = 3099;

let serverProcess: ChildProcess;
let browser: Browser;

/**
 * Kill any existing process on the test port
 */
function killProcessOnPort(port: number): void {
    try {
        // Try to find and kill any process using the port
        execSync(`lsof -ti :${port} | xargs kill -9 2>/dev/null || true`, { stdio: 'ignore' });
        console.log(`[E2E Setup] Killed existing process on port ${port}`);
    } catch {
        // No process to kill, that's fine
    }
}

/**
 * Wait for server to be ready and verify it started correctly
 */
async function waitForServer(url: string, timeout: number, serverProcess: ChildProcess): Promise<void> {
    return new Promise((resolve, reject) => {
        let serverError: string | null = null;
        let hasResolved = false;
        
        // Listen for server startup errors
        const errorHandler = (data: Buffer) => {
            const output = data.toString();
            if (output.includes('EADDRINUSE') || output.includes('address already in use')) {
                serverError = `Port ${TEST_PORT} is already in use. Kill the existing process and try again.`;
            }
        };
        
        // Capture stderr for error detection
        serverProcess.stderr?.on('data', errorHandler);
        
        // Check for process exit
        serverProcess.on('exit', (code) => {
            if (!hasResolved && code !== null && code !== 0) {
                reject(new Error(serverError || `Server exited with code ${code}`));
            }
        });
        
        // Poll for server readiness
        const start = Date.now();
        const checkServer = async () => {
            if (hasResolved) return;
            
            // Check if we have a startup error
            if (serverError) {
                hasResolved = true;
                reject(new Error(serverError));
                return;
            }
            
            // Check timeout
            if (Date.now() - start > timeout) {
                hasResolved = true;
                reject(new Error(`Server did not start within ${timeout}ms`));
                return;
            }
            
            try {
                const response = await fetch(url);
                if (response.ok || response.status < 500) {
                    hasResolved = true;
                    serverProcess.stderr?.off('data', errorHandler);
                    resolve();
                    return;
                }
            } catch {
                // Server not ready yet
            }
            
            setTimeout(checkServer, 200);
        };
        
        checkServer();
    });
}

export default async function globalSetup() {
    console.log('[E2E Setup] Starting server with NODE_ENV=test');
    
    // Kill any existing process on the test port first
    killProcessOnPort(TEST_PORT);
    
    // Small delay to ensure port is freed
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Start server with explicit test environment
    const serverEnv = { 
        ...process.env, 
        PORT: String(TEST_PORT), 
        NODE_ENV: 'test' 
    };
    
    // Log to verify NODE_ENV is set
    console.log('[E2E Setup] Server environment NODE_ENV:', serverEnv.NODE_ENV);
    
    serverProcess = spawn('node', ['dist/index.js'], {
        cwd: process.cwd(),
        env: serverEnv,
        stdio: ['pipe', 'pipe', 'pipe'], // Capture all output to detect errors
        detached: true,
    });
    
    // Pipe server output to console for visibility
    serverProcess.stdout?.on('data', (data) => process.stdout.write(data));
    serverProcess.stderr?.on('data', (data) => process.stderr.write(data));

    const baseUrl = `http://127.0.0.1:${TEST_PORT}`;
    
    try {
        await waitForServer(baseUrl, 15000, serverProcess);
        console.log('[E2E Setup] Server started successfully on', baseUrl);
    } catch (error) {
        // Make sure to kill the server process if startup failed
        try {
            serverProcess.kill('SIGKILL');
        } catch { /* ignore */ }
        throw error;
    }

    // Launch browser
    browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        slowMo: 50 // Slow down actions by 50ms so you can see what's happening
    });

    // Store references globally
    (globalThis as Record<string, unknown>).__E2E_SERVER_PROCESS__ = serverProcess;
    (globalThis as Record<string, unknown>).__E2E_BROWSER__ = browser;
    (globalThis as Record<string, unknown>).__E2E_BASE_URL__ = baseUrl;

    // Store in environment for child processes
    process.env.__E2E_WS_ENDPOINT__ = browser.wsEndpoint();
    process.env.__E2E_BASE_URL__ = baseUrl;
    process.env.__E2E_SERVER_PID__ = String(serverProcess.pid);
}
