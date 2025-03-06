import { plainToInstance } from "class-transformer";

export const dtoToClass = <T>(dto: any, classType: new (...args: any[]) => T): T => {
  return plainToInstance(classType, dto, { excludeExtraneousValues: true });
}