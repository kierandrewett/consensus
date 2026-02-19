import puppeteer from "puppeteer";

export default async function globalTeardown() {
    console.log("[E2E Teardown] Starting cleanup...");

    // Close browser
    const wsEndpoint = process.env.__E2E_WS_ENDPOINT__;
    if (wsEndpoint) {
        try {
            const browser = await puppeteer.connect({ browserWSEndpoint: wsEndpoint });
            await browser.close();
            console.log("[E2E Teardown] Browser closed");
        } catch {
            // Browser may already be closed
        }
    }

    // Kill server process
    const serverPid = process.env.__E2E_SERVER_PID__;
    if (serverPid) {
        const pid = parseInt(serverPid, 10);
        try {
            // Try SIGTERM first
            process.kill(pid, "SIGTERM");
            console.log("[E2E Teardown] Sent SIGTERM to server (PID:", pid, ")");

            // Wait a bit then force kill if still running
            await new Promise((resolve) => setTimeout(resolve, 1000));
            try {
                process.kill(pid, 0); // Check if still running
                process.kill(pid, "SIGKILL"); // Force kill
                console.log("[E2E Teardown] Force killed server (PID:", pid, ")");
            } catch {
                // Process is dead, good
            }
        } catch {
            // Process may already be dead
        }
    }

    // Wait for cleanup
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log("[E2E Teardown] Cleanup complete");
}
