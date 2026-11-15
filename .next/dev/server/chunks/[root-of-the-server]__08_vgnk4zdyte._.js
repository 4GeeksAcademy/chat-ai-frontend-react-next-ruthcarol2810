module.exports = [
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/runtime-reacts.external.js [external] (next/dist/server/runtime-reacts.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/runtime-reacts.external.js", () => require("next/dist/server/runtime-reacts.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/node:stream [external] (node:stream, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:stream", () => require("node:stream"));

module.exports = mod;
}),
"[externals]/path [external] (path, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("path", () => require("path"));

module.exports = mod;
}),
"[project]/app/api/chat/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST,
    "runtime",
    ()=>runtime
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$chat$2d$types$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/chat-types.ts [app-route] (ecmascript)");
;
const runtime = 'nodejs';
const GROQ_CHAT_COMPLETIONS_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MAX_MESSAGES = 100;
const MAX_MESSAGE_LENGTH = 20_000;
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function tokenCount(value, fallback) {
    return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : fallback;
}
function getErrorMessage(payload) {
    if (!isRecord(payload) || !isRecord(payload.error)) return undefined;
    return typeof payload.error.message === 'string' ? payload.error.message : undefined;
}
async function POST(request) {
    let body;
    try {
        body = await request.json();
    } catch  {
        return Response.json({
            error: 'El cuerpo de la solicitud no contiene JSON válido.'
        }, {
            status: 400
        });
    }
    if (!isRecord(body) || !Array.isArray(body.messages) || body.messages.length === 0) {
        return Response.json({
            error: 'Envía una conversación con al menos un mensaje.'
        }, {
            status: 400
        });
    }
    if (body.messages.length > MAX_MESSAGES) {
        return Response.json({
            error: 'La conversación es demasiado larga. Borra mensajes e inténtalo de nuevo.'
        }, {
            status: 400
        });
    }
    const messages = [];
    for (const item of body.messages){
        if (!isRecord(item) || item.role !== 'user' && item.role !== 'assistant' || typeof item.content !== 'string' || item.content.trim().length === 0 || item.content.length > MAX_MESSAGE_LENGTH) {
            return Response.json({
                error: 'Uno o más mensajes tienen un formato inválido.'
            }, {
                status: 400
            });
        }
        messages.push({
            role: item.role,
            content: item.content
        });
    }
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        return Response.json({
            error: 'Falta configurar GROQ_API_KEY en el archivo .env.local. Reinicia el servidor después de añadirla.'
        }, {
            status: 500
        });
    }
    const model = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$chat$2d$types$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isModelId"])(body.model) ? body.model : __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$chat$2d$types$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["DEFAULT_MODEL"];
    const startedAt = Date.now();
    let groqResponse;
    try {
        groqResponse = await fetch(GROQ_CHAT_COMPLETIONS_URL, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model,
                messages: [
                    {
                        role: 'system',
                        content: 'Eres un asistente útil y conciso. Responde en el idioma del usuario. Usa texto claro con párrafos cortos y listas simples cuando ayuden.'
                    },
                    ...messages
                ],
                stream: false
            }),
            cache: 'no-store'
        });
    } catch  {
        return Response.json({
            error: 'No se pudo conectar con Groq. Comprueba tu conexión e inténtalo de nuevo.'
        }, {
            status: 502
        });
    }
    let payload;
    try {
        payload = await groqResponse.json();
    } catch  {
        return Response.json({
            error: 'Groq devolvió una respuesta que no se pudo interpretar.'
        }, {
            status: 502
        });
    }
    if (!groqResponse.ok) {
        const providerMessage = getErrorMessage(payload);
        if (groqResponse.status === 401 || groqResponse.status === 403) {
            return Response.json({
                error: 'Groq rechazó la API key. Verifica que sea válida y esté activa.'
            }, {
                status: groqResponse.status
            });
        }
        if (groqResponse.status === 404 || groqResponse.status === 400) {
            return Response.json({
                error: providerMessage ?? 'Groq rechazó el modelo o el formato de la solicitud. Verifica el modelo configurado.'
            }, {
                status: groqResponse.status
            });
        }
        return Response.json({
            error: providerMessage ?? 'Groq no pudo completar la solicitud. Inténtalo de nuevo más tarde.'
        }, {
            status: groqResponse.status >= 500 ? 502 : groqResponse.status
        });
    }
    if (!isRecord(payload)) {
        return Response.json({
            error: 'Groq devolvió una respuesta con formato inválido.'
        }, {
            status: 502
        });
    }
    const result = payload;
    const content = result.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || content.length === 0) {
        return Response.json({
            error: 'Groq no devolvió texto en la respuesta.'
        }, {
            status: 502
        });
    }
    const promptTokens = tokenCount(result.usage?.prompt_tokens, 0);
    const completionTokens = tokenCount(result.usage?.completion_tokens, 0);
    const totalTokens = tokenCount(result.usage?.total_tokens, promptTokens + completionTokens);
    const responseTimeMs = Date.now() - startedAt;
    return Response.json({
        message: content,
        metadata: {
            model: typeof result.model === 'string' ? result.model : model,
            createdAt: Date.now(),
            promptTokens,
            completionTokens,
            totalTokens,
            responseTimeMs,
            tokensPerSecond: responseTimeMs > 0 ? completionTokens / (responseTimeMs / 1000) : 0
        }
    });
}
}),
"[project]/lib/chat-types.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DEFAULT_MODEL",
    ()=>DEFAULT_MODEL,
    "MODELS",
    ()=>MODELS,
    "isModelId",
    ()=>isModelId
]);
const MODELS = [
    {
        id: 'qwen/qwen3.8-27b',
        label: 'Qwen 3.8 27B (Groq)'
    }
];
const DEFAULT_MODEL = MODELS[0].id;
function isModelId(value) {
    return MODELS.some((model)=>model.id === value);
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__08_vgnk4zdyte._.js.map