"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const internals_1 = require("@prisma/internals");
exports.default = (0, internals_1.defineConfig)({
    datasources: {
        db: {
            provider: 'postgresql',
            url: process.env.DATABASE_URL,
        },
    },
});
//# sourceMappingURL=prisma.config.js.map