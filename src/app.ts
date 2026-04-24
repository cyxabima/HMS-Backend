import express, {
  type Request,
  type Response,
  type Application,
} from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const corsOptions = {
  origin: ["http://localhost:3000", "*"],
  methods: ["Get", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true, // for cookies
};
const app: Application = express();

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());
app.use(cors(corsOptions));

app.get("/healthz", (_: Request, res: Response) => {
  const healthData = {
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  };

  return res.status(200).json(healthData);
});

export default app;
