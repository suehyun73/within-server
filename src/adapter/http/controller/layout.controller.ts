import {
  Body,
  Controller,
  Inject,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  SAVE_USECASE,
  SaveLayoutDtoIn,
  SaveLayoutUsecasePort,
} from 'src/port/in/layout/saveLayout.usecase.port';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import { Client } from '../auth/client/client.decorator';

@Controller('/layout')
export class LayoutController {
  constructor(
    @Inject(SAVE_USECASE)
    private readonly saveLayoutUsecase: SaveLayoutUsecasePort,
  ) {}

  @Put('/')
  @UseGuards(JwtGuard)
  async saveLayout(
    @Body() dto: SaveLayoutDtoIn,
    @Client() client: Client,
  ) {
    return await this.saveLayoutUsecase.execute(dto, client);
  }
}
