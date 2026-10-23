import "dotenv/config";
import app from "./app.js";
import { connectToDatabase } from "./config/database.js";

const port = Number(process.env.PORT ?? 3000);

try {
  await connectToDatabase();

  app.listen(port, () => {
    console.log(`Backend listening on port ${port}`);
  });
} catch {
  console.error("Could not connect to MongoDB. Check MONGODB_URI and database availability.");
  process.exit(1);
}