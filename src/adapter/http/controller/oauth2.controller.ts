import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { GoogleOauth2Guard } from '../auth/googleOauth2/googleOauth2.guard';

@Controller('/oauth2')
export class Ouath2Controller {
  @Get('/google')
  @UseGuards(GoogleOauth2Guard)
  async redirectGoogle(@Req() req, @Res() res: Response) {
    const token = req.user.token;
    res.header('Authorization', `Bearer ${token}`);
    res.redirect('/result' + `?token=${token}`);
  }
}
