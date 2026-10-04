import { app } from "./index";
import { startIndexer } from "./indexer";

const PORT = Number(process.env.PORT ?? 3030);

app.listen(PORT, () => {
  console.log(`[runway-backend] listening on :${PORT}`);
  startIndexer();
});
