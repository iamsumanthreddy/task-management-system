import { IsOptional, IsEnum, IsString, IsNumberString } from 'class-validator';
import { TaskStatus } from '../../entities/task.entity';

export class QueryTaskDto {
  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsString()
  search?: string;
}
