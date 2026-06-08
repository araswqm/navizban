// Basit build script — tsc yeterli, ekstra gerekmiyor
import { execSync } from "child_process";
execSync("tsc", { stdio: "inherit" });
