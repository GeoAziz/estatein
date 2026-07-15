// Used by the Dockerfile's HEALTHCHECK — hits the app's own /health endpoint
// and exits non-zero on any failure so Docker can mark the container unhealthy.
const http = require("http");

const req = http.get({ host: "localhost", port: process.env.PORT || 3000, path: "/health", timeout: 5000 }, (res) => {
  process.exit(res.statusCode === 200 ? 0 : 1);
});

req.on("error", () => process.exit(1));
req.on("timeout", () => {
  req.destroy();
  process.exit(1);
});
