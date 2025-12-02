export interface RoleResponseDto {
  id: number;
  name: string;
  key: string;
  permissions: PermissionResponseDto[];
}

interface PermissionResponseDto {
  id: number;
  name: string;
  key: string;
  resource: string;
}
