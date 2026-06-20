export interface DynamoPrimaryKey {
  partitionKey: string;
  sortKey: string;
}

export interface DynamoGSI {
  indexName: string;
  partitionKey: string;
  sortKey: string;
  projection: string;
}

export interface DynamoAccessPattern {
  action: string;
  keyExpression: string;
  explanation: string;
}

export interface DynamoDbBlueprint {
  tableName: string;
  primaryKey: DynamoPrimaryKey;
  gsis: DynamoGSI[];
  accessPatterns: DynamoAccessPattern[];
  sampleJson: string;
  keyTips: string;
}

export interface AuroraTable {
  name: string;
  columns: string[];
  keysAndIndexes: string;
}

export interface AuroraPgBlueprint {
  tables: AuroraTable[];
  ddlSql: string;
  indexingSuggestions: string;
}

export interface CostEstimates {
  dynamodbMonthlyCost: number;
  auroraMonthlyCost: number;
  explanation: string;
}

export interface VercelIntegration {
  envConfig: string;
  nodeCode: string;
}

export interface ArchitectResult {
  dynamoDb: DynamoDbBlueprint;
  auroraPg: AuroraPgBlueprint;
  costEstimates: CostEstimates;
  vercelIntegrationSnippet: VercelIntegration;
}

export interface ScenarioPreset {
  id: string;
  title: string;
  description: string;
  difficulty: "B2C Ecommerce" | "B2B SaaS" | "Million-Scale Gaming" | "IoT Log Stream";
  dataVolume: string;
  readRate: number;
  writeRate: number;
  patterns: string;
}

export interface OptimizerResult {
  analysis: string;
  proposedFixes: string[];
  ddlOrIndexOutput: string;
  iopsEstimateBenefit: string;
}
