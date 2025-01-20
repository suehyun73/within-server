import { IsString, IsArray, ValidateNested, IsEnum, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export const SAVE_USECASE = Symbol('SAVE_USECASE');

export interface SaveUsecasePort {
  exec(dto: SaveDtoIn, client: Client): Promise<SaveDtoOut>;
}

class Pos {
  @IsNumber()
  x!: number;

  @IsNumber()
  y!: number;
}

class Node {
  @IsString()
  localId!: string;

  @IsString()
  markdown!: string;

  @IsEnum(['global', 'domain', 'full-path'])
  scope!: 'global' | 'domain' | 'full-path';

  @Type(() => Pos)
  @ValidateNested()
  pos!: Pos;
}

export class SaveDtoIn {
  @IsString()
  url!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Node)
  nodes!: Node[];
}

export class SaveDtoOut {}
