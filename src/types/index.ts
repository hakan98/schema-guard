// ─── Schema Comparison Types ────────────────────────────────────────────────

export type ChangeType = "added" | "removed" | "modified";
export type Severity = "critical" | "warning" | "info";

export interface SchemaChange {
  path: string;
  type: ChangeType;
  severity: Severity;
  oldValue?: unknown;
  newValue?: unknown;
  description: string;
}

export interface ComparisonResult {
  totalChanges: number;
  breaking: number;
  nonBreaking: number;
  changes: SchemaChange[];
  summary: string;
}

// ─── AI Analysis Types ──────────────────────────────────────────────────────

export interface AffectedComponent {
  name: string;
  reason: string;
  severity: Severity;
}

export interface SuggestedInterface {
  name: string;
  code: string;
}

export interface AIAnalysisResult {
  affectedComponents: AffectedComponent[];
  suggestedInterfaces: SuggestedInterface[];
  summary: string;
  migrationSteps: string[];
}

// ─── API Request/Response Types ─────────────────────────────────────────────

export interface CompareRequest {
  oldSchema: Record<string, unknown>;
  newSchema: Record<string, unknown>;
}

export interface AnalyzeRequest {
  changes: SchemaChange[];
  oldSchema?: Record<string, unknown>;
  newSchema?: Record<string, unknown>;
}

// ─── OpenAPI Schema Types (simplified) ──────────────────────────────────────

export interface OpenAPISchema {
  openapi?: string;
  swagger?: string;
  info?: {
    title?: string;
    version?: string;
    description?: string;
  };
  paths?: Record<string, PathItem>;
  components?: {
    schemas?: Record<string, SchemaObject>;
  };
  definitions?: Record<string, SchemaObject>;
}

export interface PathItem {
  [method: string]: OperationObject | undefined;
}

export interface OperationObject {
  summary?: string;
  operationId?: string;
  parameters?: ParameterObject[];
  requestBody?: RequestBodyObject;
  responses?: Record<string, ResponseObject>;
  tags?: string[];
}

export interface ParameterObject {
  name: string;
  in: string;
  required?: boolean;
  schema?: SchemaObject;
  type?: string;
}

export interface RequestBodyObject {
  required?: boolean;
  content?: Record<string, MediaTypeObject>;
}

export interface MediaTypeObject {
  schema?: SchemaObject;
}

export interface ResponseObject {
  description?: string;
  content?: Record<string, MediaTypeObject>;
  schema?: SchemaObject;
}

export interface SchemaObject {
  type?: string;
  properties?: Record<string, SchemaObject>;
  required?: string[];
  items?: SchemaObject;
  enum?: unknown[];
  $ref?: string;
  allOf?: SchemaObject[];
  oneOf?: SchemaObject[];
  anyOf?: SchemaObject[];
  format?: string;
  description?: string;
  nullable?: boolean;
}
