import 'dotenv/config';
import { createApp } from './app.js';
import { runSchema } from './db/index.js';

// Ensure schema exists on boot (idempotent)
runSchema();

const app = createApp();
const PORT = Number(process.env.PORT || 4000);

app.listen(PORT, () => {
  console.log(`\n  ◆ THREATFORGE API`);
  console.log(`  → http://localhost:${PORT}`);
  console.log(`  → health: http://localhost:${PORT}/api/health\n`);
});
