import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper for GoogleGenAI lazy-loading and validation
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not defined on the server secrets.");
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// REST API for database blueprint architecture generation
app.post("/api/architect", async (req, res) => {
  try {
    const { scenario, dataVolume, readRate, writeRate, accessPatternsText } = req.body;

    if (!scenario) {
      return res.status(400).json({ error: "A scenario descriptive label is required." });
    }

    const ai = getGeminiClient();

    const systemPrompt = `You are a Principal AWS Cloud Database Architect specializing in Serverless architectures, AWS Aurora PostgreSQL, and AWS DynamoDB Single-Table Design.
Your objective is to design two complete, production-ready, highly optimized database blueprints for the user's scenario:
1. An AWS DynamoDB Single-Table Design schema.
2. A PostgreSQL relational model for AWS Aurora Serverless v2.

You must return valid JSON matching this schema exactly. Do not output markdown packaging.
Estimated throughput requirements:
- Data Volume: ${dataVolume || "Light (<10 GB)"}
- Sustained reads: ${readRate || 50} operations/sec
- Sustained writes: ${writeRate || 10} operations/sec
- Access Patterns described by developer: ${accessPatternsText || "Standard CRUD operations"}`;

    const prompt = `Design a database architecture for this scenario: "${scenario}".
Provide standard optimized schemas, indexes, access patterns coverage, cost calculations, and boilerplate integration snippets.
Be extremely detailed. The DynamoDB blueprint must represent genuine Single-Table design where different entities (e.g. users, orders, items) reside in the same physical table of partition keys (PK) and sort keys (SK), using GSIs to unlock different lookup directions.
The Aurora blueprint must represent highly relational tables with primary/foreign keys, correct constraints, and appropriate indexes (e.g. indexes for search, foreign key lookup, combined constraints).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dynamoDb: {
              type: Type.OBJECT,
              properties: {
                tableName: { type: Type.STRING },
                primaryKey: {
                  type: Type.OBJECT,
                  properties: {
                    partitionKey: { type: Type.STRING, description: "Name and layout guideline, e.g. PK (String)" },
                    sortKey: { type: Type.STRING, description: "Name and layout guideline, e.g. SK (String)" }
                  },
                  required: ["partitionKey", "sortKey"]
                },
                gsis: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      indexName: { type: Type.STRING },
                      partitionKey: { type: Type.STRING },
                      sortKey: { type: Type.STRING },
                      projection: { type: Type.STRING }
                    },
                    required: ["indexName", "partitionKey", "sortKey", "projection"]
                  }
                },
                accessPatterns: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      action: { type: Type.STRING, description: "Describe the pattern (e.g. Get User details)" },
                      keyExpression: { type: Type.STRING, description: "DynamoDB partition/sort key condition expression" },
                      explanation: { type: Type.STRING }
                    },
                    required: ["action", "keyExpression", "explanation"]
                  }
                },
                sampleJson: { type: Type.STRING, description: "A beautiful raw JSON representation showcasing multiple entity items (e.g. USER#1, ORDER#123) with PK, SK, and custom attributes within this single table" },
                keyTips: { type: Type.STRING, description: "Important engineering keys and best practice tips" }
              },
              required: ["tableName", "primaryKey", "gsis", "accessPatterns", "sampleJson", "keyTips"]
            },
            auroraPg: {
              type: Type.OBJECT,
              properties: {
                tables: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      columns: { type: Type.ARRAY, items: { type: Type.STRING } },
                      keysAndIndexes: { type: Type.STRING }
                    },
                    required: ["name", "columns", "keysAndIndexes"]
                  }
                },
                ddlSql: { type: Type.STRING, description: "Valid and robust PostgreSQL SQL code to create tables, reference relations, declare foreign key constraints, and add secondary indexes" },
                indexingSuggestions: { type: Type.STRING, description: "Optimization guidelines for Aurora scaling" }
              },
              required: ["tables", "ddlSql", "indexingSuggestions"]
            },
            costEstimates: {
              type: Type.OBJECT,
              properties: {
                dynamodbMonthlyCost: { type: Type.NUMBER, description: "DynamoDB cost estimation in USD per month" },
                auroraMonthlyCost: { type: Type.NUMBER, description: "Aurora PostgreSQL Serverless v2 estimated cost in USD per month" },
                explanation: { type: Type.STRING, description: "Detailed cost trade-off reasoning comparing the two based on volume and operation counts" }
              },
              required: ["dynamodbMonthlyCost", "auroraMonthlyCost", "explanation"]
            },
            vercelIntegrationSnippet: {
              type: Type.OBJECT,
              properties: {
                envConfig: { type: Type.STRING, description: "Plain text with environment variables examples required" },
                nodeCode: { type: Type.STRING, description: "Modern TS boilerplate using standard client libraries to connect and query this designed database architecture from serverless routes" }
              },
              required: ["envConfig", "nodeCode"]
            }
          },
          required: ["dynamoDb", "auroraPg", "costEstimates", "vercelIntegrationSnippet"]
        }
      }
    });

    const parsedData = JSON.parse(response.text.trim());
    return res.json(parsedData);
  } catch (error: any) {
    console.error("Architect Generation Error:", error);
    return res.status(500).json({ error: error.message || "Failure generating AWS Database architectural recommendations." });
  }
});

// REST API for prompt tuning / incremental query optimization
app.post("/api/optimize", async (req, res) => {
  try {
    const { schemaType, customModelText, queryToOptimize } = req.body;
    if (!customModelText) {
      return res.status(400).json({ error: "No schema or query context provided for optimize suggestions." });
    }

    const ai = getGeminiClient();

    const systemPrompt = `You are a database performance tuner for AWS Databases. Recommend indexing strategies, alternate single-table layouts, and schema tweaks. Respond back with clean structured text details inside JSON format.`;
    const prompt = `Our current database is ${schemaType || "DynamoDB/Aurora"}.
Schema:
"${customModelText}"

Query or Access Pattern that suffers from high latency:
"${queryToOptimize || "Our overall bulk scans are slow"}"

Provide optimization advice, exact indexes/code fixes, and a summary.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: { type: Type.STRING },
            proposedFixes: { type: Type.ARRAY, items: { type: Type.STRING } },
            ddlOrIndexOutput: { type: Type.STRING, description: "SQL DDL, or DynamoDB GSI declaration snippet" },
            iopsEstimateBenefit: { type: Type.STRING, description: "Expected performance shift, e.g. 5x reduction in scanned units." }
          },
          required: ["analysis", "proposedFixes", "ddlOrIndexOutput", "iopsEstimateBenefit"]
        }
      }
    });

    const data = JSON.parse(response.text.trim());
    return res.json(data);
  } catch (error: any) {
    console.error("Schema Optimization Error:", error);
    return res.status(500).json({ error: error.message || "Failure optimizing AWS database blueprint." });
  }
});

// Setup Vite Development and Static Host rules
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
