"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const CustomError_1 = require("../utils/CustomError");
const validate = (schema, target = "body") => {
    return (req, res, next) => {
        const result = schema.safeParse(req[target]);
        if (!result.success) {
            const errors = result.error.issues.map((err) => ({
                field: err.path.join(".") || target,
                message: err.message,
            }));
            return next(new CustomError_1.CustomError("Validation failed", 400, {
                type: "VALIDATION_ERROR",
                errors,
            }));
        }
        req[target] = result.data;
        next();
    };
};
exports.validate = validate;
