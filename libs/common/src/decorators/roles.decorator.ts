import { SetMetadata } from '@nestjs/common'
import { Role } from '@prisma/client'

/**
 * `Roles` is a custom decorator that associates a set of roles with a route handler within NestJS applications. It leverages the framework's metadata capabilities to define the access control requirements for a given route based on user roles.

 * @param roles - A list of roles from the `Role` enum that are allowed to access the route.
 * @returns A decorator function that assigns the specified roles to the route handler's metadata.

 * Usage:
 * Apply the `@Roles()` decorator to controller methods to restrict access to users with the specified roles. The roles are defined in the `Role` enum, which should be aligned with the roles in your application's domain.
 * 
 * Example:
 * ```typescript
 * @Controller('admin')
 * export class AdminController {
 *   @Roles(Role.Admin)
 *   @Get('dashboard')
 *   getAdminDashboard() {
 *     // This route is only accessible to users with the 'Admin' role
 *   }
 * }
 * ```
 * 
 * The `ROLES_KEY` constant is used as a metadata key to store the roles associated with the route handler. The `Roles` decorator simplifies role-based access control by providing a declarative way to specify which roles are required to access certain parts of your application.
 */
export const ROLES_KEY = 'roles'
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles)
