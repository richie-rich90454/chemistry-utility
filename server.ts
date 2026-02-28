import Fastify,{FastifyInstance, FastifyRequest, FastifyReply} from "fastify";
import path from "path";
import fs from "fs";
import{fileURLToPath} from "url";
import staticPlugin,{SetHeadersResponse} from "@fastify/static";

let __filename=fileURLToPath(import.meta.url);
let __dirname=path.dirname(__filename);
let fastify: FastifyInstance=Fastify({ logger: false });
let PORT: number=6005;
fastify.addHook("onSend", async (request: FastifyRequest, reply: FastifyReply, payload: any)=>{
    reply.header("X-Powered-By", undefined);
    return payload;
});
fastify.addHook("onRequest", async (request: FastifyRequest, reply: FastifyReply)=>{
    try{
        let base=request.headers.host?`http://${request.headers.host}`:"http://localhost";
        if (!request.raw.url){
            reply.code(400).send("Bad Request");
            return;
        }
        let parsed=new URL(request.raw.url, base);
        request.raw.url=parsed.pathname+parsed.search;
    }
    catch (err: unknown){
        console.warn("Bad request URL:", request.raw.url);
        reply.code(400).send("Bad Request");
    }
});
fastify.get("/api/ptable", async (request: FastifyRequest, reply: FastifyReply)=>{
    if (request.headers["x-requested-with"]!=="XMLHttpRequest"){
        return reply.code(403).send({
            error: "Forbidden",
            message: "Direct access to API is not allowed",
        });
    }
    let distPath=path.join(__dirname, "dist");
    let filePath=path.join(distPath, "ptable.json");
    if (!fs.existsSync(filePath)){
        return reply.code(500).send({
            error: "Server Error",
            message: "Data file not found",
        });
    }
    reply.header("X-Content-Type-Options", "nosniff");
    reply.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    return reply.sendFile("ptable.json", distPath);
});
fastify.get("/ptable.json", async (request: FastifyRequest, reply: FastifyReply)=>{
    reply.code(403).send({
        error: "Forbidden",
        message: "Direct access to file is not allowed",
    });
});
fastify.register(staticPlugin,{
    root: path.join(__dirname, "dist"),
    setHeaders: (res: SetHeadersResponse, filePath: string)=>{
        res.setHeader(
            "Cache-Control",
            filePath.endsWith(".html")?"no-store":"public, max-age=86400"
        );
    },
});
fastify.get("/", async (request: FastifyRequest, reply: FastifyReply)=>{
    reply.header("Cache-Control", "no-store");
    return reply.sendFile("index.html");
});
fastify.setNotFoundHandler((request: FastifyRequest, reply: FastifyReply)=>{
    if (/^https?:\/\//.test(request.raw.url||"")){
        return reply.code(400).send("Bad Request");
    }
    reply.header("Cache-Control", "no-store");
    return reply.sendFile("index.html");
});
fastify.setErrorHandler((error: Error, request: FastifyRequest, reply: FastifyReply)=>{
    console.error("Unexpected error:", error.stack||error);
    reply.code(500).send({error: "Internal Server Error"});
});
let start=async (): Promise<void>=>{
    try{
        await fastify.listen({port: PORT, host: "::"});
        console.log(`Server running at http://localhost:${PORT}`);
        console.log(`Serving static files from: ${path.join(__dirname, "dist")}`);
    }
    catch (err){
        fastify.log.error(err);
        process.exit(1);
    }
};
start();
let gracefulShutdown=async (signal: string): Promise<void>=>{
    console.log(`\n${signal} received. Starting graceful shutdown...`);
    let shutdownTimeout=setTimeout(()=>{
        console.error("Forced shutdown due to timeout");
        process.exit(1);
    }, 10000);
    try{
        await fastify.close();
        clearTimeout(shutdownTimeout);
        console.log("Cleanup completed successfully");
        process.exit(0);
    }
    catch (err){
        console.error("Error during shutdown:", err);
        clearTimeout(shutdownTimeout);
        process.exit(1);
    }
};
["SIGINT", "SIGTERM", "SIGQUIT"].forEach((signal: string)=>{
    process.on(signal, ()=>gracefulShutdown(signal));
});
process.on("uncaughtException", (err: Error)=>{
    console.error("Uncaught Exception:", err);
    gracefulShutdown("UNCAUGHT_EXCEPTION");
});
process.on("unhandledRejection", (reason: unknown, promise: Promise<unknown>)=>{
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
    gracefulShutdown("UNHANDLED_REJECTION");
});