"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionsToYaml = sessionsToYaml;
exports.yamlToSessions = yamlToSessions;
/**
 * YAML utilities for chat history import/export
 */
const js_yaml_1 = __importDefault(require("js-yaml"));
/**
 * Convert chat sessions to YAML format
 * @param sessions Array of chat sessions
 * @returns YAML string representation of chat history
 */
function sessionsToYaml(sessions) {
    const exportData = {
        version: '1.0',
        sessions,
        exportedAt: new Date().toISOString(),
    };
    return js_yaml_1.default.dump(exportData, {
        indent: 2,
        lineWidth: -1, // No line wrapping
        noRefs: true,
    });
}
/**
 * Parse YAML chat history into chat sessions
 * @param yamlContent YAML string containing chat history
 * @returns Array of chat sessions
 * @throws Error if YAML parsing fails
 */
function yamlToSessions(yamlContent) {
    try {
        const parsed = js_yaml_1.default.load(yamlContent);
        // Validate the parsed data
        if (!parsed || !parsed.sessions || !Array.isArray(parsed.sessions)) {
            throw new Error('Invalid YAML format: missing sessions array');
        }
        return parsed.sessions;
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to parse YAML: ${error.message}`);
        }
        throw new Error('Failed to parse YAML: unknown error');
    }
}
