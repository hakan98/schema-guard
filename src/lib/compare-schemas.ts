import type {
    SchemaChange,
    ComparisonResult,
    OpenAPISchema,
    SchemaObject,
    OperationObject,
    ParameterObject,
    Severity,
} from "@/types";

// ─── Main Compare Function ─────────────────────────────────────────────────

export function compareSchemas(
    oldSchema: OpenAPISchema,
    newSchema: OpenAPISchema
): ComparisonResult {
    const changes: SchemaChange[] = [];

    // Compare paths (endpoints)
    comparePaths(oldSchema.paths || {}, newSchema.paths || {}, changes);

    // Compare component schemas (OpenAPI 3.x)
    compareDefinitions(
        oldSchema.components?.schemas || oldSchema.definitions || {},
        newSchema.components?.schemas || newSchema.definitions || {},
        changes,
        "components/schemas"
    );

    const breaking = changes.filter((c) => c.severity === "critical").length;
    const nonBreaking = changes.length - breaking;

    return {
        totalChanges: changes.length,
        breaking,
        nonBreaking,
        changes,
        summary: generateSummary(changes),
    };
}

// ─── Path Comparison ────────────────────────────────────────────────────────

function comparePaths(
    oldPaths: Record<string, Record<string, unknown>>,
    newPaths: Record<string, Record<string, unknown>>,
    changes: SchemaChange[]
): void {
    const allPaths = new Set([...Object.keys(oldPaths), ...Object.keys(newPaths)]);
    const httpMethods = ["get", "post", "put", "patch", "delete", "head", "options"];

    for (const path of allPaths) {
        if (!(path in oldPaths)) {
            changes.push({
                path: `paths.${path}`,
                type: "added",
                severity: "info",
                newValue: newPaths[path],
                description: `New endpoint added: ${path}`,
            });
            continue;
        }

        if (!(path in newPaths)) {
            changes.push({
                path: `paths.${path}`,
                type: "removed",
                severity: "critical",
                oldValue: oldPaths[path],
                description: `🚨 Endpoint removed: ${path} — This is a BREAKING CHANGE`,
            });
            continue;
        }

        // Compare methods within the path
        for (const method of httpMethods) {
            const oldOp = oldPaths[path]?.[method] as OperationObject | undefined;
            const newOp = newPaths[path]?.[method] as OperationObject | undefined;

            if (!oldOp && newOp) {
                changes.push({
                    path: `paths.${path}.${method.toUpperCase()}`,
                    type: "added",
                    severity: "info",
                    newValue: newOp,
                    description: `New method ${method.toUpperCase()} added to ${path}`,
                });
            } else if (oldOp && !newOp) {
                changes.push({
                    path: `paths.${path}.${method.toUpperCase()}`,
                    type: "removed",
                    severity: "critical",
                    oldValue: oldOp,
                    description: `🚨 Method ${method.toUpperCase()} removed from ${path} — BREAKING CHANGE`,
                });
            } else if (oldOp && newOp) {
                compareOperation(path, method.toUpperCase(), oldOp, newOp, changes);
            }
        }
    }
}

// ─── Operation Comparison ───────────────────────────────────────────────────

function compareOperation(
    path: string,
    method: string,
    oldOp: OperationObject,
    newOp: OperationObject,
    changes: SchemaChange[]
): void {
    // Compare parameters
    compareParameters(path, method, oldOp.parameters || [], newOp.parameters || [], changes);

    // Compare request body
    const oldBody = oldOp.requestBody?.content?.["application/json"]?.schema;
    const newBody = newOp.requestBody?.content?.["application/json"]?.schema;
    if (oldBody || newBody) {
        compareSchemaObjects(
            `paths.${path}.${method}.requestBody`,
            oldBody,
            newBody,
            changes
        );
    }

    // Compare responses
    const oldResponses = oldOp.responses || {};
    const newResponses = newOp.responses || {};
    for (const status of new Set([...Object.keys(oldResponses), ...Object.keys(newResponses)])) {
        const oldResp = oldResponses[status]?.content?.["application/json"]?.schema ||
            oldResponses[status]?.schema;
        const newResp = newResponses[status]?.content?.["application/json"]?.schema ||
            newResponses[status]?.schema;
        if (oldResp || newResp) {
            compareSchemaObjects(
                `paths.${path}.${method}.responses.${status}`,
                oldResp as SchemaObject | undefined,
                newResp as SchemaObject | undefined,
                changes
            );
        }
    }
}

// ─── Parameter Comparison ───────────────────────────────────────────────────

function compareParameters(
    path: string,
    method: string,
    oldParams: ParameterObject[],
    newParams: ParameterObject[],
    changes: SchemaChange[]
): void {
    const oldMap = new Map(oldParams.map((p) => [`${p.name}:${p.in}`, p]));
    const newMap = new Map(newParams.map((p) => [`${p.name}:${p.in}`, p]));

    for (const [key, param] of newMap) {
        if (!oldMap.has(key)) {
            const severity: Severity = param.required ? "warning" : "info";
            changes.push({
                path: `paths.${path}.${method}.parameters.${param.name}`,
                type: "added",
                severity,
                newValue: param,
                description: param.required
                    ? `⚠️ New required parameter "${param.name}" added to ${method} ${path}`
                    : `New optional parameter "${param.name}" added to ${method} ${path}`,
            });
        }
    }

    for (const [key, param] of oldMap) {
        if (!newMap.has(key)) {
            changes.push({
                path: `paths.${path}.${method}.parameters.${param.name}`,
                type: "removed",
                severity: "critical",
                oldValue: param,
                description: `🚨 Parameter "${param.name}" removed from ${method} ${path} — BREAKING CHANGE`,
            });
        }
    }

    // Compare matching parameters for type changes
    for (const [key, oldParam] of oldMap) {
        const newParam = newMap.get(key);
        if (newParam) {
            const oldType = oldParam.schema?.type || oldParam.type;
            const newType = newParam.schema?.type || newParam.type;
            if (oldType && newType && oldType !== newType) {
                changes.push({
                    path: `paths.${path}.${method}.parameters.${oldParam.name}.type`,
                    type: "modified",
                    severity: "critical",
                    oldValue: oldType,
                    newValue: newType,
                    description: `🚨 Parameter "${oldParam.name}" type changed from "${oldType}" to "${newType}" in ${method} ${path}`,
                });
            }

            if (!oldParam.required && newParam.required) {
                changes.push({
                    path: `paths.${path}.${method}.parameters.${oldParam.name}.required`,
                    type: "modified",
                    severity: "warning",
                    oldValue: false,
                    newValue: true,
                    description: `⚠️ Parameter "${oldParam.name}" is now required in ${method} ${path}`,
                });
            }
        }
    }
}

// ─── Schema Object Comparison ───────────────────────────────────────────────

function compareSchemaObjects(
    basePath: string,
    oldSchema: SchemaObject | undefined,
    newSchema: SchemaObject | undefined,
    changes: SchemaChange[]
): void {
    if (!oldSchema && !newSchema) return;

    if (!oldSchema && newSchema) {
        changes.push({
            path: basePath,
            type: "added",
            severity: "info",
            newValue: newSchema,
            description: `New schema added at ${basePath}`,
        });
        return;
    }

    if (oldSchema && !newSchema) {
        changes.push({
            path: basePath,
            type: "removed",
            severity: "critical",
            oldValue: oldSchema,
            description: `🚨 Schema removed at ${basePath} — BREAKING CHANGE`,
        });
        return;
    }

    // Both exist — compare types
    if (oldSchema!.type !== newSchema!.type && oldSchema!.type && newSchema!.type) {
        changes.push({
            path: `${basePath}.type`,
            type: "modified",
            severity: "critical",
            oldValue: oldSchema!.type,
            newValue: newSchema!.type,
            description: `🚨 Type changed from "${oldSchema!.type}" to "${newSchema!.type}" at ${basePath}`,
        });
    }

    // Compare properties
    const oldProps = oldSchema!.properties || {};
    const newProps = newSchema!.properties || {};
    const allProps = new Set([...Object.keys(oldProps), ...Object.keys(newProps)]);

    for (const prop of allProps) {
        const propPath = `${basePath}.properties.${prop}`;

        if (!(prop in oldProps)) {
            const isRequired = newSchema!.required?.includes(prop);
            changes.push({
                path: propPath,
                type: "added",
                severity: isRequired ? "warning" : "info",
                newValue: newProps[prop],
                description: isRequired
                    ? `⚠️ New required property "${prop}" added at ${basePath}`
                    : `New optional property "${prop}" added at ${basePath}`,
            });
            continue;
        }

        if (!(prop in newProps)) {
            changes.push({
                path: propPath,
                type: "removed",
                severity: "critical",
                oldValue: oldProps[prop],
                description: `🚨 Property "${prop}" removed from ${basePath} — BREAKING CHANGE`,
            });
            continue;
        }

        // Recursively compare nested schemas
        if (oldProps[prop].type !== newProps[prop].type && oldProps[prop].type && newProps[prop].type) {
            changes.push({
                path: `${propPath}.type`,
                type: "modified",
                severity: "critical",
                oldValue: oldProps[prop].type,
                newValue: newProps[prop].type,
                description: `🚨 Property "${prop}" type changed from "${oldProps[prop].type}" to "${newProps[prop].type}"`,
            });
        }

        // Compare enum changes
        if (oldProps[prop].enum || newProps[prop].enum) {
            const oldEnum = JSON.stringify(oldProps[prop].enum || []);
            const newEnum = JSON.stringify(newProps[prop].enum || []);
            if (oldEnum !== newEnum) {
                changes.push({
                    path: `${propPath}.enum`,
                    type: "modified",
                    severity: "warning",
                    oldValue: oldProps[prop].enum,
                    newValue: newProps[prop].enum,
                    description: `⚠️ Enum values changed for property "${prop}" at ${basePath}`,
                });
            }
        }

        // Recurse into nested object properties
        if (oldProps[prop].properties || newProps[prop].properties) {
            compareSchemaObjects(propPath, oldProps[prop], newProps[prop], changes);
        }
    }

    // Compare required fields
    const oldRequired = new Set(oldSchema!.required || []);
    const newRequired = new Set(newSchema!.required || []);

    for (const field of newRequired) {
        if (!oldRequired.has(field) && field in oldProps) {
            changes.push({
                path: `${basePath}.required.${field}`,
                type: "modified",
                severity: "warning",
                oldValue: false,
                newValue: true,
                description: `⚠️ Property "${field}" is now required at ${basePath}`,
            });
        }
    }
}

// ─── Definition/Component Comparison ────────────────────────────────────────

function compareDefinitions(
    oldDefs: Record<string, SchemaObject>,
    newDefs: Record<string, SchemaObject>,
    changes: SchemaChange[],
    prefix: string
): void {
    const allDefs = new Set([...Object.keys(oldDefs), ...Object.keys(newDefs)]);

    for (const name of allDefs) {
        const defPath = `${prefix}.${name}`;

        if (!(name in oldDefs)) {
            changes.push({
                path: defPath,
                type: "added",
                severity: "info",
                newValue: newDefs[name],
                description: `New schema definition added: ${name}`,
            });
            continue;
        }

        if (!(name in newDefs)) {
            changes.push({
                path: defPath,
                type: "removed",
                severity: "critical",
                oldValue: oldDefs[name],
                description: `🚨 Schema definition removed: ${name} — BREAKING CHANGE`,
            });
            continue;
        }

        compareSchemaObjects(defPath, oldDefs[name], newDefs[name], changes);
    }
}

// ─── Summary Generation ─────────────────────────────────────────────────────

function generateSummary(changes: SchemaChange[]): string {
    const critical = changes.filter((c) => c.severity === "critical").length;
    const warnings = changes.filter((c) => c.severity === "warning").length;
    const info = changes.filter((c) => c.severity === "info").length;

    if (changes.length === 0) {
        return "No changes detected between the two schemas.";
    }

    const parts: string[] = [];
    if (critical > 0) parts.push(`${critical} breaking change(s)`);
    if (warnings > 0) parts.push(`${warnings} warning(s)`);
    if (info > 0) parts.push(`${info} informational change(s)`);

    return `Detected ${changes.length} total change(s): ${parts.join(", ")}.`;
}

// ─── Generic Deep JSON Comparison ───────────────────────────────────────────

export function deepCompareJSON(
    oldObj: Record<string, unknown>,
    newObj: Record<string, unknown>
): ComparisonResult {
    const changes: SchemaChange[] = [];
    compareObjects(oldObj, newObj, "", changes);

    const breaking = changes.filter((c) => c.severity === "critical").length;
    const nonBreaking = changes.length - breaking;

    return {
        totalChanges: changes.length,
        breaking,
        nonBreaking,
        changes,
        summary: generateSummary(changes),
    };
}

function compareObjects(
    oldObj: Record<string, unknown>,
    newObj: Record<string, unknown>,
    basePath: string,
    changes: SchemaChange[]
): void {
    const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

    for (const key of allKeys) {
        const currentPath = basePath ? `${basePath}.${key}` : key;
        const oldVal = oldObj[key];
        const newVal = newObj[key];

        // Key removed
        if (key in oldObj && !(key in newObj)) {
            changes.push({
                path: currentPath,
                type: "removed",
                severity: "critical",
                oldValue: oldVal,
                description: `🚨 Key "${key}" removed — BREAKING CHANGE`,
            });
            continue;
        }

        // Key added
        if (!(key in oldObj) && key in newObj) {
            changes.push({
                path: currentPath,
                type: "added",
                severity: "info",
                newValue: newVal,
                description: `New key "${key}" added`,
            });
            continue;
        }

        // Both exist — compare types
        const oldType = Array.isArray(oldVal) ? "array" : typeof oldVal;
        const newType = Array.isArray(newVal) ? "array" : typeof newVal;

        if (oldType !== newType) {
            changes.push({
                path: currentPath,
                type: "modified",
                severity: "warning",
                oldValue: oldVal,
                newValue: newVal,
                description: `⚠️ Type of "${key}" changed from "${oldType}" to "${newType}"`,
            });
            continue;
        }

        // Same type — recurse for objects, compare values for primitives
        if (oldType === "object" && oldVal !== null && newVal !== null) {
            compareObjects(
                oldVal as Record<string, unknown>,
                newVal as Record<string, unknown>,
                currentPath,
                changes
            );
        } else if (oldType === "array") {
            const oldArr = JSON.stringify(oldVal);
            const newArr = JSON.stringify(newVal);
            if (oldArr !== newArr) {
                changes.push({
                    path: currentPath,
                    type: "modified",
                    severity: "info",
                    oldValue: oldVal,
                    newValue: newVal,
                    description: `Array "${key}" contents changed`,
                });
            }
        } else if (oldVal !== newVal) {
            changes.push({
                path: currentPath,
                type: "modified",
                severity: "info",
                oldValue: oldVal,
                newValue: newVal,
                description: `Value of "${key}" changed from "${String(oldVal)}" to "${String(newVal)}"`,
            });
        }
    }
}
