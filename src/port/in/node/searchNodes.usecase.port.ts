import { IsString } from 'class-validator';

export const SEARCH_NODES_USECASE = Symbol(
  'SEARCH_NODES_USECASE',
);

export interface SearchNodesUsecasePort {
  execute(
    dto: SearchNodesDtoIn,
    client: Client,
  ): Promise<SearchNodesDtoOut>;
}

export class SearchNodesDtoIn {
  @IsString()
  q!: string;
}

export class SearchNodesDtoOut {
  memos!: {
    id: number;
    targetUrl: string;
    markdown: string;
    pos: { x: number; y: number };
    createdAt: Date;
    updatedAt: Date;
  }[];
  highlights!: {
    id: number;
    selector: string;
    targetUrl: string;
    text: string;
    createdAt: Date;
    updatedAt: Date;
  }[];
}
