/**
 * 班级管理工具类 - Class Utilities
 * 用于处理班级相关的逻辑校验与格式化
 */

/**
 * 校验班级名称是否合法
 * @param {string} name 班级名称
 * @returns {object} {valid: boolean, message: string}
 */
const validateClassName = (name) => {
    if (!name || name.trim().length === 0) {
        return { valid: false, message: '班级名称不能为空' };
    }
    if (name.length > 20) {
        return { valid: false, message: '班级名称不能超过20个字符' };
    }
    return { valid: true, message: '通过' };
};

/**
 * 格式化班级显示名称
 * @param {string} className 班级名
 * @param {string} teacherName 老师名
 * @returns {string} 格式化后的名称
 */
const formatClassDisplay = (className, teacherName) => {
    const teacher = teacherName ? ` (${teacherName}老师)` : '';
    return `${className}${teacher}`;
};

/**
 * 生成随机班级编号 (示例: CL-123456)
 * @returns {string}
 */
const generateClassCode = () => {
    const random = Math.floor(Math.random() * 899999) + 100000;
    return `CL-${random}`;
};

module.exports = {
    validateClassName,
    formatClassDisplay,
    generateClassCode
};
