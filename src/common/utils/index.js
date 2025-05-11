"use strict";
/**
 * Common utilities for the chat application
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateId = generateId;
exports.truncateString = truncateString;
exports.extractTitleFromContent = extractTitleFromContent;
__exportStar(require("./date"), exports);
__exportStar(require("./yaml"), exports);
/**
 * Generate a unique ID
 * @returns Unique ID string
 */
function generateId() {
    return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
}
/**
 * Truncate a string to a maximum length
 * @param str String to truncate
 * @param maxLength Maximum length
 * @returns Truncated string
 */
function truncateString(str, maxLength) {
    if (str.length <= maxLength) {
        return str;
    }
    return str.substring(0, maxLength - 3) + '...';
}
/**
 * Extract a title from a message content
 * @param content Message content
 * @param maxLength Maximum title length
 * @returns Extracted title
 */
function extractTitleFromContent(content, maxLength = 30) {
    // Remove markdown formatting
    const plainText = content.replace(/[#*_~`]/g, '');
    // Get the first line or sentence
    const firstLine = plainText.split('\n')[0] || '';
    const firstSentence = firstLine.split('.')[0] || '';
    // Use the shorter of the two
    const title = firstSentence.length < firstLine.length ?
        firstSentence : firstLine;
    return truncateString(title.trim(), maxLength);
}
