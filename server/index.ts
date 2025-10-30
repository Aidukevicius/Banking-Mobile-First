import 'dotenv/config';
import { createApp } from "./app";
import { log } from "./vite";

(async () => {
  const { server } = await createApp();

  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
