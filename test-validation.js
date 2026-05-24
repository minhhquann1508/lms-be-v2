"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const login_dto_1 = require("./src/modules/auth/dto/login.dto");
const payload = {
    "email": "super.admin@gmail.com",
    "password": "1508",
    "device": {
        "deviceUid": "1649048d-2c64-4e22-9065-a96b1de4919c",
        "deviceName": "Chrome",
        "deviceType": "desktop",
        "os": "macOS",
        "browser": "Chrome",
        "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36"
    }
};
const instance = (0, class_transformer_1.plainToInstance)(login_dto_1.LoginDto, payload);
const errors = (0, class_validator_1.validateSync)(instance, { whitelist: true, forbidNonWhitelisted: true });
console.log(JSON.stringify(errors, null, 2));
//# sourceMappingURL=test-validation.js.map