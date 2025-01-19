import { Injectable } from '@nestjs/common';
import { Builder } from 'builder-pattern';
import { and, eq, isNull } from 'drizzle-orm';
import { User } from 'src/domain/entity/user';
import { Email } from 'src/domain/vo/email';
import { GoogleId } from 'src/domain/vo/googleId';
import { Id } from 'src/domain/vo/id';
import { Name } from 'src/domain/vo/name';
import { Role } from 'src/domain/vo/role';
import { Timestamp } from 'src/domain/vo/timestamp';
import { Url } from 'src/domain/vo/url';
import { UserRepoPort } from 'src/port/out/repo/user.repo.port';
import { DbService } from '../db.service';
import { userTable } from '../orm/schema';

@Injectable()
export class UserRepo implements UserRepoPort {
  constructor(private readonly dbService: DbService) {}

  async save(user: User, tx = this.dbService.getInstance()): Promise<User> {
    const [row] = await tx
      .insert(userTable)
      .values({
        googleId: user.googleId.value,
        name: user.name.value,
        email: user.email.value,
        roles: user.roles.map((role) => role.value),
        profileUrl: user.profileUrl?.value,
      })
      .returning();

    return Builder(User)
      .id(Id.create(row.id))
      .googleId(GoogleId.create(row.googleId))
      .name(Name.create(row.name))
      .email(Email.create(row.email))
      .roles(row.roles.map((role) => Role.create(role)))
      .profileUrl(row.profileUrl ? Url.create(row.profileUrl) : undefined)
      .createdAt(Timestamp.create(row.createdAt))
      .updatedAt(Timestamp.create(row.updatedAt))
      .build();
  }

  async findOneByUserId(
    userId: Id,
    tx = this.dbService.getInstance(),
  ): Promise<User | undefined> {
    const row = await tx.query.userTable.findFirst({
      columns: { deletedAt: false },
      where: and(eq(userTable.id, userId.value), isNull(userTable.deletedAt)),
    });

    return (
      row &&
      Builder(User)
        .id(Id.create(row.id))
        .googleId(GoogleId.create(row.googleId))
        .name(Name.create(row.name))
        .email(Email.create(row.email))
        .roles(row.roles.map((role) => Role.create(role)))
        .profileUrl(row.profileUrl ? Url.create(row.profileUrl) : undefined)
        .createdAt(Timestamp.create(row.createdAt))
        .updatedAt(Timestamp.create(row.updatedAt))
        .build()
    );
  }

  async findOneByGoogleId(
    googleId: GoogleId,
    tx = this.dbService.getInstance(),
  ): Promise<User | undefined> {
    const row = await tx.query.userTable.findFirst({
      columns: { deletedAt: false },
      where: and(
        eq(userTable.googleId, googleId.value),
        isNull(userTable.deletedAt),
      ),
    });

    return (
      row &&
      Builder(User)
        .id(Id.create(row.id))
        .googleId(GoogleId.create(row.googleId))
        .name(Name.create(row.name))
        .email(Email.create(row.email))
        .roles(row.roles.map((role) => Role.create(role)))
        .profileUrl(row.profileUrl ? Url.create(row.profileUrl) : undefined)
        .createdAt(Timestamp.create(row.createdAt))
        .updatedAt(Timestamp.create(row.updatedAt))
        .build()
    );
  }

  async deleteByUserId(
    userId: Id,
    tx = this.dbService.getInstance(),
  ): Promise<void> {
    await tx
      .update(userTable)
      .set({ deletedAt: Timestamp.now().value })
      .where(and(eq(userTable.id, userId.value), isNull(userTable.deletedAt)));
  }
}
