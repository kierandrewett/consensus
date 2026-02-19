import path from "path";

export const config = {
    server: {
        host: process.env.HOST || "0.0.0.0",
        port: parseInt(process.env.PORT || "3000", 10),
    },
    session: {
        secret: process.env.SESSION_SECRET || "consensus-secret-key-change-in-production",
        cookieName: "consensusSessionId",
    },
    views: {
        root: path.join(__dirname, "views"),
        engine: {
            ejs: require("ejs"),
        },
    },
    static: {
        root: path.join(__dirname, "public"),
    },
};
