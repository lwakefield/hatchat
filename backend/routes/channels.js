const { request, response } = require('@persea/persea');

const { query, transaction } = require('../db');
const { getAuthenticatedUser } = require('../authentication');
const { assertUserOwnsChannel, assertUserIsAuthorizedForChannel } = require('../authorization');

module.exports.create = async () => {
    const user = await getAuthenticatedUser();

    const trx = await transaction();
    await trx`BEGIN`;
    await trx`
        INSERT INTO channels (id, "ownerId", "inviteModel")
        VALUES (${request.json.id}, ${user.id}, ${request.json.inviteModel})
    `;
    await trx`
        INSERT INTO "channelUsers" ("channelId", "userId")
        VALUES (${request.json.id}, ${user.id})
    `;
    await trx`
        INSERT INTO "messages" ("channelId", "fromUserId", "payload")
        VALUES (
            ${request.json.id},
            (SELECT id FROM users WHERE username='system'),
            jsonb_build_object(
                'message',
                'user ' || ${user.id} || ' has subscribed to the channel'
            )
        )
    `;
    await trx`COMMIT`;

    response.send({ status: 200 });
};

module.exports.update = async (channelId) => {
    await assertUserOwnsChannel(channelId);
    await trx`
        UPDATE "channelUsers"
        SET "inviteModel"=${request.json.inviteModel}
        WHERE "id"=${channelId}
    `;
    response.send({ status: 200 });
};

module.exports.destroy = async (channelId) => {
    await assertUserOwnsChannel(channelId);

    await query`
        DELETE FROM channels
        WHERE "id"=${channelId}
    `;

    response.send({ status: 200 });
};

module.exports.show = async (id) => {
    await assertUserIsAuthorizedForChannel(id);

    const [ channel ] = await query`
        SELECT * FROM "channels"
        WHERE "id"=${id}
    `;
    const members = await query`
        SELECT "users".* FROM "channelUsers"
        JOIN "users" ON "users"."id"="channelUsers"."userId"
        WHERE "channelId"=${id}
    `;

    response.send({ json: {
        ...channel,
        members,
    } })
}

module.exports.index = async () => {
    const user = await getAuthenticatedUser();

    const channels = await query`
        SELECT * FROM channels
        WHERE "ownerId" = ${user.id}
    `;

    response.send({ json: channels });
};
