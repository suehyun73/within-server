import { IsString, IsNumberString } from 'class-validator';

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

  @IsNumberString()
  cursor!: string;

  @IsNumberString()
  limit!: string;
}

export class SearchNodesDtoOut {
  nodes!: (
    | {
        type: 'memo';
        id: number;
        targetUrl: string;
        pos: { x: number; y: number };
        markdown: {
          original: string;
          withTag: string;
        };
        createdAt: Date;
        updatedAt: Date;
      }
    | {
        type: 'highlight';
        id: number;
        targetUrl: string;
        selector: string;
        spans: {
          original: string[];
          withTag: string[];
        };
        createdAt: Date;
        updatedAt: Date;
      }
  )[];
}
