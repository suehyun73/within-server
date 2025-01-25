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
import { UserRdbRepoPort } from 'src/port/out/rdb/user.rdb.repo.port';
import * as schema from '../orm/schema';
import {
  RDB_SERVICE,
  RdbServicePort,
} from 'src/port/out/rdb/rdb.service.port';

@Injectable()
export class PgUserDbRepo implements UserRdbRepoPort {
  constructor(
    @Inject(RDB_SERVICE)
    private readonly dbService: RdbServicePort,
  ) {}

  async saveUser(
    user: User,
    db = this.dbService.getInstance(),
  ): Promise<User> {
    const [row] = await db
      .insert(schema.users)
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
        db = this.dbService.getInstance(),
      ): Promise<User | undefined> => {
        const row = await db.query.users.findFirst({
          where: and(
            eq(schema.users.id, userId.value),
            isNull(schema.users.deletedAt),
          ),
        });

        return row && this.mapToUser(row);
      },

      byGoogleId: async (
        googleId: GoogleId,
        db = this.dbService.getInstance(),
      ): Promise<User | undefined> => {
        const row = await db.query.users.findFirst({
          where: and(
            eq(schema.users.googleId, googleId.value),
            isNull(schema.users.deletedAt),
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
        db = this.dbService.getInstance(),
      ): Promise<void> => {
        await db
          .update(schema.users)
          .set({ deletedAt: Timestamp.now().value })
          .where(
            and(
              eq(schema.users.id, userId.value),
              isNull(schema.users.deletedAt),
            ),
          );
      },
    };
  }

  private mapToUser(
    row: InferSelectModel<typeof schema.users>,
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
