import {
  Body,
  Controller,
  Get,
  Inject,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  SAVE_NODES_USECASE,
  SaveNodesDtoIn,
  SaveNodesUsecasePort,
} from 'src/port/in/node/saveNodes.usecase.port';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import { Client } from '../auth/client/client.decorator';
import {
  GET_NODES_USECASE,
  GetNodesDtoIn,
  GetNodesUsecasePort,
} from 'src/port/in/node/getNodes.usecase.port';
import {
  SEARCH_NODES_USECASE,
  SearchNodesDtoIn,
  SearchNodesUsecasePort,
} from 'src/port/in/node/searchNodes.usecase.port';

@Controller('/node')
export class NodeController {
  constructor(
    @Inject(SAVE_NODES_USECASE)
    private readonly saveNodesUsecase: SaveNodesUsecasePort,
    @Inject(GET_NODES_USECASE)
    private readonly getNodesUsecase: GetNodesUsecasePort,
    @Inject(SEARCH_NODES_USECASE)
    private readonly searchNodesUsecase: SearchNodesUsecasePort,
  ) {}

  @Put('/')
  @UseGuards(JwtGuard)
  async saveNodes(
    @Body() dto: SaveNodesDtoIn,
    @Client() client: Client,
  ) {
    return await this.saveNodesUsecase.execute(dto, client);
  }

  @Get('/')
  @UseGuards(JwtGuard)
  async getNodes(
    @Query() dto: GetNodesDtoIn,
    @Client() client: Client,
  ) {
    return await this.getNodesUsecase.execute(dto, client);
  }

  @Get('/search')
  @UseGuards(JwtGuard)
  async searchNodes(
    @Query() dto: SearchNodesDtoIn,
    @Client() client: Client,
  ) {
    return await this.searchNodesUsecase.execute(dto, client);
  }
}
