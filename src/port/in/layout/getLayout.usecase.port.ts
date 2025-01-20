import { IsString } from 'class-validator';

export const GET_LAYOUT_USECASE = Symbol('GET_LAYOUT_USECASE');

export interface GetLayoutUsecasePort {
  execute(
    dto: GetLayoutDtoIn,
    client: Client,
  ): Promise<GetLayoutDtoOut>;
}

export class GetLayoutDtoIn {
  @IsString()
  url!: string;
}

export class GetLayoutDtoOut {
  nodes!: {
    localId: string;
    markdown: string;
    pos: { x: number; y: number };
    scope: 'domain' | 'full-path';
    createdAt: Date;
    updatedAt: Date;
  }[];
  highlights!: {
    selector: string;
    spans: {
      start: number;
      text: string;
    }[];
    createdAt: Date;
    updatedAt: Date;
  }[];
}
