import express, { Request, Response } from "express";
import dotenv from "dotenv";
dotenv.config({ path: process.env.NODE_ENV === "test" ? ".env.test" : ".env" });
import cookieParser from "cookie-parser";
import router from "./routes";
import { errorHandler } from "./middlewares/errorHandler";
// Carrega as variáveis de ambiente definidas no arquivo .env ou .env.test

// Inicializa a aplicação Express
const app = express();

// Define a porta utilizada pelo servidor
const PORT = process.env.PORT || 3000;

// Middleware para permitir o envio de dados em formato JSON no corpo das requisições
app.use(express.json());

// Middleware para permitir o envio de dados em formato URL-encoded no corpo das requisições
app.use(express.urlencoded({ extended: true }));

// Middleware para cookies
app.use(cookieParser());

// Rotas principais
app.use("/", router);

// Middleware para rotas não encontradas
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: "Rota não encontrada",
  });
});

// Middleware global de erro (sempre por último)
app.use(errorHandler);

export default app;
