"use strict";
/**
 * Common types for the AI Agent Chat Service
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SSEEventType = void 0;
/**
 * SSE Event types
 */
var SSEEventType;
(function (SSEEventType) {
    SSEEventType["MESSAGE"] = "message";
    SSEEventType["THINKING"] = "thinking";
    SSEEventType["ERROR"] = "error";
    SSEEventType["DONE"] = "done";
})(SSEEventType || (exports.SSEEventType = SSEEventType = {}));
