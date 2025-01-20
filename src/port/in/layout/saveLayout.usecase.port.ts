import {
  IsString,
  IsArray,
  ValidateNested,
  IsEnum,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export const SAVE_USECASE = Symbol('SAVE_USECASE');

export interface SaveLayoutUsecasePort {
  execute(
    dto: SaveLayoutDtoIn,
    client: Client,
  ): Promise<SaveLayoutDtoOut>;
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

class Span {
  @IsNumber()
  start!: number;

  @IsString()
  text!: string;
}

class Highlight {
  @IsString()
  selector!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Span)
  spans!: Span[];
}

export class SaveLayoutDtoIn {
  @IsString()
  url!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Node)
  nodes!: Node[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Highlight)
  highlights!: Highlight[];
}

export class SaveLayoutDtoOut {}
