import { IsString } from 'class-validator';

export const GET_NODES_USECASE = Symbol('GET_NODES_USECASE');

export interface GetNodesUsecasePort {
  execute(
    dto: GetNodesDtoIn,
    client: Client,
  ): Promise<GetNodesDtoOut>;
}

export class GetNodesDtoIn {
  @IsString()
  url!: string;
}

export class GetNodesDtoOut {
  memos!: {
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
