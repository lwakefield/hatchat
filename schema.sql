begin;

create extension if not exists "uuid-ossp";

create table users (
    id uuid primary key,
    username varchar,
    "publicKey" text
);

insert into users (id, username)
values ('00000000-0000-0000-0000-000000000000', 'system');

create type "inviteModel" as enum ('owner', 'member', 'self');
create table channels (
    id varchar primary key,
    "ownerId" uuid references users not null,
    "inviteModel" "inviteModel" default 'owner' not null
);

create table "channelUsers" (
    "channelId" varchar references channels on delete cascade not null,
    "userId" uuid references users not null
);
create unique index on "channelUsers" ("channelId", "userId");

create table messages (
    "channelId" varchar references channels on delete cascade not null,
    "createdAt" timestamptz default now(),
    "fromUserId" uuid references users,
    payload jsonb not null
);

commit;
