import { app } from "./app";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

app.listen(PORT, () => {
  console.log(`🚆 Navizban API server running on port ${PORT}`);
  console.log(`📍 Health: http://localhost:${PORT}/api/health`);
  console.log(`🚄 Trains: http://localhost:${PORT}/api/trains`);
});
