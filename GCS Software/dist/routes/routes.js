"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const controller_1 = require("../controllers/controller");
function routes(app) {
    app.get('/', controller_1.getText);
}
exports.default = routes;
