import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { TokenExpiredError } from 'jsonwebtoken';

export const exceptionHandler = (error: any) => {
  if (error instanceof BadRequestException) {
    throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
  }
  if (error instanceof NotFoundException) {
    throw new HttpException(error.message, HttpStatus.NOT_FOUND);
  }
  if (error instanceof NotAcceptableException) {
    throw new HttpException(error.message, HttpStatus.NOT_ACCEPTABLE);
  }
  if (error instanceof ConflictException) {
    throw new HttpException(error.message, HttpStatus.CONFLICT);
  }
  if (error instanceof ForbiddenException) {
    throw new HttpException(error.message, HttpStatus.FORBIDDEN);
  }
  if (error instanceof TokenExpiredError) {
    throw new HttpException(error.message, HttpStatus.UNAUTHORIZED);
  }
  if (error instanceof HttpException) {
    throw error;
  }
  throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
};
