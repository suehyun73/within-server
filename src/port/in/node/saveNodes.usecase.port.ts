import {
  IsString,
  IsArray,
  ValidateNested,
  IsEnum,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export const SAVE_NODES_USECASE = Symbol('SAVE_NODES_USECASE');

export interface SaveNodesUsecasePort {
  execute(
    dto: SaveNodesDtoIn,
    client: Client,
  ): Promise<SaveNodesDtoOut>;
}

class Pos {
  @IsNumber()
  x!: number;

  @IsNumber()
  y!: number;
}

class Memo {
  @IsString()
  localId!: string;

  @IsString()
  markdown!: string;

  @IsEnum(['domain', 'full-path'])
  scope!: 'domain' | 'full-path';

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

export class SaveNodesDtoIn {
  @IsString()
  url!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Memo)
  memos!: Memo[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Highlight)
  highlights!: Highlight[];
}

export class SaveNodesDtoOut {}
