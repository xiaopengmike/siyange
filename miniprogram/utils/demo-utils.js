/**
 * Demo Utilities for real-time code generation showcase
 */

/**
 * Basic addition function
 * @param {number} a 
 * @param {number} b 
 * @returns {number}
 */
const add = (a, b) => {
    return a + b;
};

/**
 * Basic subtraction function
 */
const sub = (a, b) => {
    return a - b;
};

/**
 * Format a date to YYYY-MM-DD
 * @param {Date} date 
 */
const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

module.exports = {
    add,
    sub,
    formatDate
};
