import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  index(): string {
    return "Nothing interesting here...";
  }

  @Get('ping')
  ping(): string {
    return "pong";
  }
}
