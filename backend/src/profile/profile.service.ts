import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async getProfile(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      profilePicture: user.profilePicture,
      profileCompleted: user.profileCompleted,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (dto.name !== undefined) user.name = dto.name;
    if (dto.dateOfBirth !== undefined) user.dateOfBirth = new Date(dto.dateOfBirth);
    if (dto.gender !== undefined) user.gender = dto.gender;

    // Mark profile as completed if name is provided
    if (user.name && user.name.length > 0) {
      user.profileCompleted = true;
    }

    await this.userRepo.save(user);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      profilePicture: user.profilePicture,
      profileCompleted: user.profileCompleted,
    };
  }

  async uploadPicture(userId: string, filename: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    user.profilePicture = `/uploads/${filename}`;
    await this.userRepo.save(user);

    return { profilePicture: user.profilePicture };
  }
}
