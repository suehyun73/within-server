import { Body, Controller, Inject, Put, UseGuards } from '@nestjs/common';
import { SAVE_USECASE, SaveDtoIn, SaveUsecasePort } from 'src/port/in/layout/save.usecase.port';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import { Client } from '../auth/client/client.decorator';

@Controller('/layout')
export class LayoutController {
  constructor(@Inject(SAVE_USECASE) private readonly saveUsecase: SaveUsecasePort) {}

  @Put('/')
  @UseGuards(JwtGuard)
  async save(@Body() dto: SaveDtoIn, @Client() client: Client) {
    return await this.saveUsecase.exec(dto, client);
  }
}
