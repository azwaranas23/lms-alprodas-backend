import { UsersResponseDto } from 'src/modules/users/dto/users-response.dto';

export interface AuthResponseDto {
  accessToken: string;
  user: UsersResponseDto;
}
