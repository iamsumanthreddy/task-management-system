import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { Gender } from '../../entities/user.entity';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;
}
