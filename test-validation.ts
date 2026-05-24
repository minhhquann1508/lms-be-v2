import { validateSync } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { LoginDto } from './src/modules/auth/dto/login.dto';

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

const instance = plainToInstance(LoginDto, payload);
const errors = validateSync(instance, { whitelist: true, forbidNonWhitelisted: true });
console.log(JSON.stringify(errors, null, 2));
