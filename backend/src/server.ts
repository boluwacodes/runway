import { indexerIntervalMs } from "./config";
import { app } from "./index";
import { startIndexer } from "./indexer";

const PORT = Number(process.env.PORT ?? 3030);
const INDEXER_INTERVAL_MS = indexerIntervalMs();

app.listen(PORT, () => {
  console.log(`[runway-backend] listening on :${PORT}`);
  startIndexer(INDEXER_INTERVAL_MS);
});
