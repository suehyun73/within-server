import { Inject, Injectable } from '@nestjs/common';
import { Builder } from 'builder-pattern';
import { and, eq, InferSelectModel, isNull } from 'drizzle-orm';
import { User } from 'src/domain/entity/user';
import { Email } from 'src/domain/vo/email';
import { GoogleId } from 'src/domain/vo/googleId';
import { Id } from 'src/domain/vo/id';
import { Name } from 'src/domain/vo/name';
import { Role } from 'src/domain/vo/role';
import { Timestamp } from 'src/domain/vo/timestamp';
import { Url } from 'src/domain/vo/url';
import { UserRepoPort } from 'src/port/out/user.repo.port';
import { userTable } from '../orm/schema';
import {
  DB_SERVICE,
  DbServicePort,
} from 'src/port/out/db.service.port';

@Injectable()
export class UserRepo implements UserRepoPort {
  constructor(
    @Inject(DB_SERVICE)
    private readonly dbService: DbServicePort,
  ) {}

  async saveUser(
    user: User,
    db = this.dbService.getDb(),
  ): Promise<User> {
    const [row] = await db
      .insert(userTable)
      .values({
        googleId: user.googleId.value,
        name: user.name.value,
        email: user.email.value,
        roles: user.roles.map((role) => role.value),
        profileUrl: user.profileUrl?.value,
      })
      .returning();

    return this.mapToUser(row);
  }

  findUser() {
    return {
      byId: async (
        userId: Id,
        db = this.dbService.getDb(),
      ): Promise<User | undefined> => {
        const row = await db.query.userTable.findFirst({
          where: and(
            eq(userTable.id, userId.value),
            isNull(userTable.deletedAt),
          ),
        });

        return row && this.mapToUser(row);
      },

      byGoogleId: async (
        googleId: GoogleId,
        db = this.dbService.getDb(),
      ): Promise<User | undefined> => {
        const row = await db.query.userTable.findFirst({
          where: and(
            eq(userTable.googleId, googleId.value),
            isNull(userTable.deletedAt),
          ),
        });

        return row && this.mapToUser(row);
      },
    };
  }

  deleteUser() {
    return {
      byId: async (
        userId: Id,
        db = this.dbService.getDb(),
      ): Promise<void> => {
        await db
          .update(userTable)
          .set({ deletedAt: Timestamp.now().value })
          .where(
            and(
              eq(userTable.id, userId.value),
              isNull(userTable.deletedAt),
            ),
          );
      },
    };
  }

  private mapToUser(
    row: InferSelectModel<typeof userTable>,
  ): User {
    return Builder(User)
      .id(Id.create(row.id))
      .googleId(GoogleId.create(row.googleId))
      .name(Name.create(row.name))
      .email(Email.create(row.email))
      .roles(row.roles.map((role) => Role.create(role)))
      .profileUrl(
        row.profileUrl ? Url.create(row.profileUrl) : undefined,
      )
      .createdAt(Timestamp.create(row.createdAt))
      .updatedAt(Timestamp.create(row.updatedAt))
      .build();
  }
}
