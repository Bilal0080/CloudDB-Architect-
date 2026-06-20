import { ScenarioPreset, ArchitectResult } from "../types";

export const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: "b2c-ecommerce",
    title: "Track 1: CloudMart E-Commerce SaaS",
    description: "Tailored for retail & ecommerce startups. Models products catalog, multiple order timelines, user accounts, and discount vouchers.",
    difficulty: "B2C Ecommerce",
    dataVolume: "Mid Size (100 GB - 500 GB)",
    readRate: 450,
    writeRate: 80,
    patterns: "Get products in category; get items in active order; list order shipments by user ID; scan active promotions by coupon code."
  },
  {
    id: "b2b-multi-tenant",
    title: "Track 2: SaaSify Core CRM Ledger",
    description: "Robust B2B Multi-tenant structure. Safely partition metrics, tenant configs, customized staff attributes, and logged security events.",
    difficulty: "B2B SaaS",
    dataVolume: "Highly Relational (50 GB)",
    readRate: 200,
    writeRate: 30,
    patterns: "Lookup tenant configuration; query logged audits within range by tenant ID; update license metrics totals."
  },
  {
    id: "million-scale-gaming",
    title: "Track 3: Retro Arena Stats Ledger",
    description: "Designed for scaling to millions of concurrent players. Rapid leaderboards, global matchmaking matchmaking shards, and live matches.",
    difficulty: "Million-Scale Gaming",
    dataVolume: "Heavy (3 TB - 10 TB)",
    readRate: 3500,
    writeRate: 1200,
    patterns: "Get active players in region; query live top 100 leaderboards; register match score by ELO rank."
  },
  {
    id: "iot-telemetry",
    title: "Track 4: GridForce Smart Meter Fleet",
    description: "Open innovation IoT aggregate log stream. High write frequency, temporal time-series sorting, and automated hardware status queries.",
    difficulty: "IoT Log Stream",
    dataVolume: "Very Large (50 TB+)",
    readRate: 800,
    writeRate: 6500,
    patterns: "Read device telemetry within time window; aggregate meter consumption hourly; pinpoint anomalous offline devices."
  }
];

// High quality initial default blueprint matching CloudMart so the app is immediately gorgeous on launch
export const INITIAL_MART_BLUEPRINT: ArchitectResult = {
  dynamoDb: {
    tableName: "CloudMart_SingleTable",
    primaryKey: {
      partitionKey: "PK (String)",
      sortKey: "SK (String)"
    },
    gsis: [
      {
        indexName: "GSI1_Inverted",
        partitionKey: "SK",
        sortKey: "PK",
        projection: "ALL"
      },
      {
        indexName: "GSI2_Status_Lookup",
        partitionKey: "Status",
        sortKey: "CreatedDate",
        projection: "INCLUDE (PK, SK, TotalAmount)"
      }
    ],
    accessPatterns: [
      {
        action: "Fetch customer profile and orders",
        keyExpression: "PK = USER#<id>",
        explanation: "Retrieves both the central profile entity and the list of related orders in a single, high-efficiency network round-trip by utilizing item collection pattern."
      },
      {
        action: "Fetch product inventory state",
        keyExpression: "PK = PROD#<sku> AND SK = METADATA",
        explanation: "Direct point read on the product entity metadata partition key."
      },
      {
        action: "List shipped orders by status",
        keyExpression: "GSI2 partitionKey = Status AND sortKey BEGINS_WITH(CreatedDate)",
        explanation: "Enables tracking order progress (e.g., 'SHIPPED') sorted Chronologically across the global system regardless of user isolation."
      }
    ],
    sampleJson: `{
  "//": "AWS DynamoDB SingleTable Design representation of multiple entity records",
  "entities": [
    {
      "PK": "USER#usr_9281",
      "SK": "PROFILE",
      "Email": "bilal@cloud.com",
      "FullName": "Bilal Tanoli",
      "Tier": "VIP",
      "CreatedDate": "2026-06-15T12:00:00Z"
    },
    {
      "PK": "USER#usr_9281",
      "SK": "ORDER#ord_44921",
      "CreatedDate": "2026-06-20T09:30:00Z",
      "Status": "COMPLETED",
      "TotalAmount": 149.50,
      "ItemsCount": 3
    },
    {
      "PK": "PROD#sku_laptop_pro",
      "SK": "METADATA",
      "Title": "AWS Carbon-Zero Laptop",
      "Price": 1299.00,
      "Stock": 42
    }
  ]
}`,
    keyTips: "Always prepend your identifiers with strong, searchable entity tags (e.g., USER#<id>, ORDER#<id>). For DynamoDB, avoid Scan operations entirely. Craft your Single-Table design specifically to fulfill pre-determined access query directions."
  },
  auroraPg: {
    tables: [
      {
        name: "users",
        columns: ["id SERIAL PRIMARY KEY", "email VARCHAR(255) UNIQUE NOT NULL", "full_name VARCHAR(100)", "tier VARCHAR(20) DEFAULT 'STANDARD'", "created_at TIMESTAMP DEFAULT NOW()"],
        keysAndIndexes: "PK: id | Index on email"
      },
      {
        name: "orders",
        columns: ["id VARCHAR(50) PRIMARY KEY", "user_id INTEGER REFERENCES users(id) ON DELETE CASCADE", "status VARCHAR(30) NOT NULL", "total_amount DECIMAL(10,2) NOT NULL", "created_at TIMESTAMP DEFAULT NOW()"],
        keysAndIndexes: "PK: id | FK: user_id | Index on status, created_at"
      },
      {
        name: "order_items",
        columns: ["id SERIAL PRIMARY KEY", "order_id VARCHAR(50) REFERENCES orders(id)", "sku VARCHAR(100) NOT NULL", "qty INTEGER NOT NULL", "price DECIMAL(10,2) NOT NULL"],
        keysAndIndexes: "PK: id | FK: order_id"
      }
    ],
    ddlSql: `-- PostgreSQL DDL generated for AWS Aurora Serverless v2
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(100),
  tier VARCHAR(20) DEFAULT 'STANDARD',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE orders (
  id VARCHAR(50) PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(30) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(50) REFERENCES orders(id) ON DELETE CASCADE,
  sku VARCHAR(100) NOT NULL,
  qty INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL
);

-- Indexing for performance and lookup speed
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status_date ON orders(status, created_at DESC);
CREATE INDEX idx_order_items_sku ON order_items(sku);`,
    indexingSuggestions: "Always index foreign keys in PostgreSQL to prevent full-table sequential scans on JOIN operations. In Aurora Serverless v2, consider enabling pg_stat_statements to observe slow query logs automatically."
  },
  costEstimates: {
    dynamodbMonthlyCost: 28.50,
    auroraMonthlyCost: 45.00,
    explanation: "For early B2C operations (450 reads/sec, 80 writes/sec), DynamoDB under on-demand mode remains extremely cost-effective as you only pay for exact request execution units consumed. Aurora Serverless v2 scales dynamically between ACUs; running at a minimum of 0.5 ACU costs roughly $45/mo including continuous backups. For heavy relational write peaks, Aurora provides powerful constraint checks but incurs slightly more baseline base-cost than DynamoDB."
  },
  vercelIntegrationSnippet: {
    envConfig: `# Vercel Environment Configuration
AWS_REGION="us-east-1"
# For DynamoDB connection:
AWS_ACCESS_KEY_ID="AKIA_MOCK_HACKATHON_ID"
AWS_SECRET_ACCESS_KEY="mock_hackathon_secret_key_xxxx"
DYNAMODB_TABLE_NAME="CloudMart_SingleTable"

# For Aurora PostgreSQL connection:
DATABASE_URL="postgresql://postgres:my-secure-password@aurora-cluster-url.us-east-1.rds.amazonaws.com:5432/cloudmart"`,
    nodeCode: `// Vercel Serverless Function: api/v1/store.js
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import pg from "pg";

// 1. AWS DynamoDB Client Initializer (Lazy-loaded to prevent cold start failures)
let ddbDocClient = null;
function getDynamoDocClient() {
  if (!ddbDocClient) {
    const client = new DynamoDBClient({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    });
    ddbDocClient = DynamoDBDocumentClient.from(client);
  }
  return ddbDocClient;
}

// 2. AWS Aurora PostgreSQL Pool Initializer (Lazy-loaded)
let pgPool = null;
function getPgPool() {
  if (!pgPool) {
    pgPool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10, // Safeguard max pool size for short-lived Serverless/Vercel functions
      idleTimeoutMillis: 30000,
    });
  }
  return pgPool;
}

// 3. API Handler demonstrating route request logic
export default async function handler(req, res) {
  const { action, userId, sku, amount } = req.body;
  
  try {
    if (action === "saveOrderDynamo") {
      const ddb = getDynamoDocClient();
      await ddb.send(new PutCommand({
        TableName: process.env.DYNAMODB_TABLE_NAME || "CloudMart_SingleTable",
        Item: {
          PK: \`USER#\${userId}\`,
          SK: \`ORDER#\${Date.now()}\`,
          Status: "PENDING",
          TotalAmount: Number(amount),
          SKU: sku,
        },
      }));
      return res.status(200).json({ success: true, db: "DynamoDB" });
    }
    
    if (action === "saveOrderAurora") {
      const pool = getPgPool();
      const result = await pool.query(
        "INSERT INTO orders (id, user_id, status, total_amount) VALUES ($1, $2, $3, $4) RETURNING *",
        [\`ord_\${Date.now()}\`, userId, "PENDING", Number(amount)]
      );
      return res.status(200).json({ success: true, db: "Aurora PostgreSQL", data: result.rows[0] });
    }

    res.status(400).json({ error: "Unsupported operation trigger" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}`
  }
};

export const PRESET_BLUEPRINTS: Record<string, ArchitectResult> = {
  "b2c-ecommerce": INITIAL_MART_BLUEPRINT,
  "b2b-multi-tenant": {
    dynamoDb: {
      tableName: "SaaSify_Tenants_Table",
      primaryKey: { partitionKey: "TenantID_PK (String)", sortKey: "SchemaType_SK (String)" },
      gsis: [
        { indexName: "GSI1_Temporal_Audits", partitionKey: "TenantID_PK", sortKey: "Timestamp", projection: "ALL" },
        { indexName: "GSI2_Global_Accounts", partitionKey: "UserEmail", sortKey: "SK", projection: "INCLUDE (TenantID, Role)" }
      ],
      accessPatterns: [
        { action: "Load tenant configuration context", keyExpression: "TenantID_PK = TENANT#<id> AND SchemaType_SK = METADATA", explanation: "Instant lookup of customer tenant tier information." },
        { action: "Scan system audits within datetime range", keyExpression: "GSI1_Temporal_Audits: partitionKey = TENANT#<id> AND sortKey BETWEEN(start, end)", explanation: "Calculates metric ranges efficiently." }
      ],
      sampleJson: `{\n  "entities": [\n    {\n      "TenantID_PK": "TENANT#tnt_alpha",\n      "SchemaType_SK": "METADATA",\n      "Name": "AlphaCorp LLC",\n      "Tier": "ENTERPRISE",\n      "MaxUsers": 500\n    },\n    {\n      "TenantID_PK": "TENANT#tnt_alpha",\n      "SchemaType_SK": "AUDIT#2026-06-20T09:40:00Z",\n      "User": "admin@alpha.com",\n      "Action": "API_KEY_ROTATED"\n    }\n  ]\n}`,
      keyTips: "Partition strictly by TenantID to guarantee true logical tenant isolation within DynamoDB. Use composite keys for dynamic sorting."
    },
    auroraPg: {
      tables: [
        { name: "tenants", columns: ["id SERIAL PRIMARY KEY", "name VARCHAR(150)", "tier VARCHAR(20) DEFAULT 'STANDARD'", "created_at TIMESTAMP DEFAULT NOW()"], keysAndIndexes: "PK: id" },
        { name: "audit_logs", columns: ["id SERIAL PRIMARY KEY", "tenant_id INTEGER REFERENCES tenants(id)", "user_email VARCHAR(100)", "activity VARCHAR(100)", "created_at TIMESTAMP"], keysAndIndexes: "PK: id | FK: tenant_id | Index on tenant_id, created_at DESC" }
      ],
      ddlSql: `-- PostgreSQL DDL for B2B SaaS Tenants\nCREATE TABLE tenants (\n  id SERIAL PRIMARY KEY,\n  name VARCHAR(150) NOT NULL,\n  tier VARCHAR(20) DEFAULT 'STANDARD',\n  created_at TIMESTAMP DEFAULT NOW()\n);\n\nCREATE TABLE audit_logs (\n  id SERIAL PRIMARY KEY,\n  tenant_id INT REFERENCES tenants(id) ON DELETE CASCADE,\n  user_email VARCHAR(100) NOT NULL,\n  activity VARCHAR(255) NOT NULL,\n  created_at TIMESTAMP DEFAULT NOW()\n);\n\nCREATE INDEX idx_logs_tenant ON audit_logs(tenant_id, created_at DESC);`,
      indexingSuggestions: "Always pair tenant_id with created_at indexes to fulfill time-series dashboard charts quickly."
    },
    costEstimates: {
      dynamodbMonthlyCost: 15.00,
      auroraMonthlyCost: 45.00,
      explanation: "For SaaS environments with low write operations (200 read/s, 30 write/s), the PAYG DynamoDB table costs <$15/mo. Aurora PostgreSQL minimum ACUs handle this easily, but has a higher minimum startup floor (~$45)"
    },
    vercelIntegrationSnippet: {
      envConfig: "DATABASE_URL=\"postgresql://tenant_admin:pass@aurora-b2b.us-east-1.rds.amazonaws.com:5432/saas\"",
      nodeCode: "// B2B tenant connector snippet"
    }
  },
  "million-scale-gaming": {
    dynamoDb: {
      tableName: "RetroArena_GlobalLeaderboard",
      primaryKey: { partitionKey: "RegionShard_PK (String)", sortKey: "PlayerPoints_SK (String)" },
      gsis: [
        { indexName: "GSI1_PlayerRecords", partitionKey: "PlayerID", sortKey: "SK", projection: "ALL" }
      ],
      accessPatterns: [
        { action: "Query live top scores chronological lookup", keyExpression: "RegionShard_PK = REGION#EU#SHARD_4 AND SK > SCORE#0900000", explanation: "Fetches live ranking queues filtered by points." }
      ],
      sampleJson: `{\n  "entities": [\n    {\n      "RegionShard_PK": "REGION#US_WEST#SHARD_2",\n      "PlayerPoints_SK": "SCORE#992500#usr_vortex",\n      "PlayerName": "VortexPlayer",\n      "League": "DIAMOND",\n      "Timestamp": "2026" \n    }\n  ]\n}`,
      keyTips: "Under high millisecond write scales, partition keys must be distributed across active sharding IDs (e.g., US_WEST#SHARD_4) to prevent partition-hotspots on single hardware keys."
    },
    auroraPg: {
      tables: [
        { name: "players", columns: ["id VARCHAR(50) PRIMARY KEY", "screen_name VARCHAR(50)", "global_rank INTEGER", "elo_score INTEGER"], keysAndIndexes: "PK: id | Index on elo_score" }
      ],
      ddlSql: `-- PostgreSQL for Million Scale stats\nCREATE TABLE players (\n  id VARCHAR(50) PRIMARY KEY,\n  screen_name VARCHAR(100) NOT NULL,\n  global_rank INT DEFAULT 0,\n  elo_score INT NOT NULL DEFAULT 1200\n);\n\nCREATE INDEX idx_players_elo ON players(elo_score DESC);`,
      indexingSuggestions: "At heavy million metrics, relational standard databases should use read-replicas or pg_shard distributions to keep index structures fitting cleanly inside RAM."
    },
    costEstimates: {
      dynamodbMonthlyCost: 282.00,
      auroraMonthlyCost: 350.00,
      explanation: "At 3500 reads/sec and 1200 writes/sec, throughput volume demands continuous processing. In DynamoDB, provisioning auto-scaling capacity or reserving throughput keeps monthly expenditures compact. Aurora PostgreSQL would command a reliable scaling profile of 4-8 continuous ACUs with read scaling replicas."
    },
    vercelIntegrationSnippet: {
      envConfig: "AWS_REGION=\"us-east-1\"\nGLOBAL_TABLE=\"RetroArena_GlobalLeaderboard\"",
      nodeCode: "// Multiplayer scoreboard sync snippet"
    }
  },
  "iot-telemetry": {
    dynamoDb: {
      tableName: "GridForce_Metrics_Time_Series",
      primaryKey: { partitionKey: "DeviceId_PK (String)", sortKey: "Timestamp_SK (String)" },
      gsis: [
        { indexName: "GSI1_Status_Alerts", partitionKey: "DeviceStatus", sortKey: "Timestamp", projection: "INCLUDE (DeviceId, Value)" }
      ],
      accessPatterns: [
        { action: "Get chronological events in time-window", keyExpression: "DeviceId_PK = DEV#9924 AND Timestamp_SK BETWEEN(T1, T2)", explanation: "Superfast interval scan across continuous sensor streams." }
      ],
      sampleJson: `{\n  "entities": [\n    {\n      "DeviceId_PK": "DEV#m_9421",\n      "Timestamp_SK": "TIME#2026-06-20T09:42:00Z",\n      "Value": 884.21,\n      "DeviceStatus": "NORMAL"\n    }\n  ]\n}`,
      keyTips: "To preserve massive telemetry scales in DynamoDB, structure events sequentially in chronological order. Utilize Time-to-Live (TTL) characteristics to automatically purge old logged metrics."
    },
    auroraPg: {
      tables: [
        { name: "telemetry", columns: ["id BIGSERIAL PRIMARY KEY", "device_id VARCHAR(50) NOT NULL", "val NUMERIC(10,2)", "logged_at TIMESTAMP"], keysAndIndexes: "PK: id | Index on device_id, logged_at" }
      ],
      ddlSql: `-- IoT Telemetry timeseries index\nCREATE TABLE telemetry (\n  id BIGSERIAL PRIMARY KEY,\n  device_id VARCHAR(50) NOT NULL,\n  val DECIMAL(10,2) NOT NULL,\n  logged_at TIMESTAMP DEFAULT NOW()\n);\n\nCREATE INDEX idx_tel_device_date ON telemetry(device_id, logged_at DESC);`,
      indexingSuggestions: "For heavy IoT relational time-series aggregates in Aurora, consider PostgreSQL TimescaleDB extensions or custom range partitioning on timestamps."
    },
    costEstimates: {
      dynamodbMonthlyCost: 512.00,
      auroraMonthlyCost: 650.00,
      explanation: "For constant IoT sensor bursts (800 read/s, 6500 write/s), writes are heavily dominant. Standard PAYG write units can grow expensive; DynamoDB structured in Provisioned Mode with active scaling targets decreases budgets substantially. Aurora would command persistent Serverless scale levels (6-10 average ACUs) to absorb heavy buffer logs."
    },
    vercelIntegrationSnippet: {
      envConfig: "DATABASE_URL=\"postgresql://iot_admin:pass@aurora-iot.us-west-2.rds.amazonaws.com:5432/gridforce\"",
      nodeCode: "// IoT metric streaming ingest"
    }
  }
};

