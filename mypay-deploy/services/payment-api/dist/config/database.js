"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.testConnection = testConnection;
const client_1 = require("@prisma/client");
let prisma;
if (process.env.NODE_ENV === 'production') {
    exports.prisma = prisma = new client_1.PrismaClient();
}
else {
    if (!global.__paymentPrisma) {
        global.__paymentPrisma = new client_1.PrismaClient({
            log: ['query', 'error', 'warn'],
        });
    }
    exports.prisma = prisma = global.__paymentPrisma;
}
async function testConnection() {
    try {
        await prisma.$queryRaw `SELECT 1`;
        console.log('✅ Database connected successfully');
    }
    catch (error) {
        console.error('❌ Database connection failed:', error);
        process.exit(1);
    }
}
//# sourceMappingURL=database.js.map