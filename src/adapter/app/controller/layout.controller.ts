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
  SAVE_LAYOUT_USECASE,
  SaveLayoutDtoIn,
  SaveLayoutUsecasePort,
} from 'src/port/in/layout/saveLayout.usecase.port';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import { Client } from '../auth/client/client.decorator';
import {
  GET_LAYOUT_USECASE,
  GetLayoutDtoIn,
  GetLayoutUsecasePort,
} from 'src/port/in/layout/getLayout.usecase.port';

@Controller('/layout')
export class LayoutController {
  constructor(
    @Inject(SAVE_LAYOUT_USECASE)
    private readonly saveLayoutUsecase: SaveLayoutUsecasePort,
    @Inject(GET_LAYOUT_USECASE)
    private readonly getLayoutUsecase: GetLayoutUsecasePort,
  ) {}

  @Put('/')
  @UseGuards(JwtGuard)
  async saveLayout(
    @Body() dto: SaveLayoutDtoIn,
    @Client() client: Client,
  ) {
    return await this.saveLayoutUsecase.execute(dto, client);
  }

  @Get('/')
  @UseGuards(JwtGuard)
  async getLayout(
    @Query() dto: GetLayoutDtoIn,
    @Client() client: Client,
  ) {
    return await this.getLayoutUsecase.execute(dto, client);
  }
}
