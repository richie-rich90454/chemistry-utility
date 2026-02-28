var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import Fastify from "fastify";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import staticPlugin from "@fastify/static";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var fastify = Fastify({ logger: false });
var PORT = 6005;
fastify.addHook("onSend", function (request, reply, payload) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        reply.header("X-Powered-By", undefined);
        return [2 /*return*/, payload];
    });
}); });
fastify.addHook("onRequest", function (request, reply) { return __awaiter(void 0, void 0, void 0, function () {
    var base, parsed;
    return __generator(this, function (_a) {
        try {
            base = request.headers.host ? "http://".concat(request.headers.host) : "http://localhost";
            if (!request.raw.url) {
                reply.code(400).send("Bad Request");
                return [2 /*return*/];
            }
            parsed = new URL(request.raw.url, base);
            request.raw.url = parsed.pathname + parsed.search;
        }
        catch (err) {
            console.warn("Bad request URL:", request.raw.url);
            reply.code(400).send("Bad Request");
        }
        return [2 /*return*/];
    });
}); });
fastify.get("/api/ptable", function (request, reply) { return __awaiter(void 0, void 0, void 0, function () {
    var distPath, filePath;
    return __generator(this, function (_a) {
        if (request.headers["x-requested-with"] !== "XMLHttpRequest") {
            return [2 /*return*/, reply.code(403).send({
                    error: "Forbidden",
                    message: "Direct access to API is not allowed",
                })];
        }
        distPath = path.join(__dirname, "dist");
        filePath = path.join(distPath, "ptable.json");
        if (!fs.existsSync(filePath)) {
            return [2 /*return*/, reply.code(500).send({
                    error: "Server Error",
                    message: "Data file not found",
                })];
        }
        reply.header("X-Content-Type-Options", "nosniff");
        reply.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
        return [2 /*return*/, reply.sendFile("ptable.json", distPath)];
    });
}); });
fastify.get("/ptable.json", function (request, reply) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        reply.code(403).send({
            error: "Forbidden",
            message: "Direct access to file is not allowed",
        });
        return [2 /*return*/];
    });
}); });
fastify.register(staticPlugin, {
    root: path.join(__dirname, "dist"),
    setHeaders: function (res, filePath) {
        res.setHeader("Cache-Control", filePath.endsWith(".html") ? "no-store" : "public, max-age=86400");
    },
});
fastify.get("/", function (request, reply) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        reply.header("Cache-Control", "no-store");
        return [2 /*return*/, reply.sendFile("index.html")];
    });
}); });
fastify.setNotFoundHandler(function (request, reply) {
    if (/^https?:\/\//.test(request.raw.url || "")) {
        return reply.code(400).send("Bad Request");
    }
    reply.header("Cache-Control", "no-store");
    return reply.sendFile("index.html");
});
fastify.setErrorHandler(function (error, request, reply) {
    console.error("Unexpected error:", error.stack || error);
    reply.code(500).send({ error: "Internal Server Error" });
});
var start = function () { return __awaiter(void 0, void 0, void 0, function () {
    var err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, fastify.listen({ port: PORT, host: "::" })];
            case 1:
                _a.sent();
                console.log("Server running at http://localhost:".concat(PORT));
                console.log("Serving static files from: ".concat(path.join(__dirname, "dist")));
                return [3 /*break*/, 3];
            case 2:
                err_1 = _a.sent();
                fastify.log.error(err_1);
                process.exit(1);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
start();
var gracefulShutdown = function (signal) { return __awaiter(void 0, void 0, void 0, function () {
    var shutdownTimeout, err_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log("\n".concat(signal, " received. Starting graceful shutdown..."));
                shutdownTimeout = setTimeout(function () {
                    console.error("Forced shutdown due to timeout");
                    process.exit(1);
                }, 10000);
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, fastify.close()];
            case 2:
                _a.sent();
                clearTimeout(shutdownTimeout);
                console.log("Cleanup completed successfully");
                process.exit(0);
                return [3 /*break*/, 4];
            case 3:
                err_2 = _a.sent();
                console.error("Error during shutdown:", err_2);
                clearTimeout(shutdownTimeout);
                process.exit(1);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
["SIGINT", "SIGTERM", "SIGQUIT"].forEach(function (signal) {
    process.on(signal, function () { return gracefulShutdown(signal); });
});
process.on("uncaughtException", function (err) {
    console.error("Uncaught Exception:", err);
    gracefulShutdown("UNCAUGHT_EXCEPTION");
});
process.on("unhandledRejection", function (reason, promise) {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
    gracefulShutdown("UNHANDLED_REJECTION");
});
