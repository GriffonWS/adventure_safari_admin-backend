// The customer-facing portal that invitation and notification emails point at.
// Emails leave the server and are read anywhere, so a missing CLIENT_URL must
// never degrade to a localhost link the recipient cannot open — the live portal
// is the fallback, and CLIENT_URL only overrides it for local testing.
const DEFAULT_CLIENT_URL = "https://app.adventuresafarinetwork.com";

const clientUrl = (process.env.CLIENT_URL || DEFAULT_CLIENT_URL).replace(/\/+$/, "");

export default clientUrl;
