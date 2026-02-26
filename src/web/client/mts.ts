import { init } from "@plausible-analytics/tracker";

init({
    domain: "consensus.drewett.dev",
    endpoint: "https://metrics.drewett.dev/api/event",
    captureOnLocalhost: true,
});
