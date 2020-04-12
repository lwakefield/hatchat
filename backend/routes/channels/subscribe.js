const { request, response } = require('@persea/persea');

const { query, transaction } = require('../../db');
const { getAuthenticatedUser } = require('../../authentication');

module.exports.create = async () => {
    const user = await getAuthenticatedUser();

    const trx = await transaction();
    await trx`BEGIN`;
    try {
        const [ channel ] = await trx`
            SELECT * from channels
            WHERE id=${request.json.channelId}
        `;

        if (channel.inviteModel === 'self') {
            // anyone can join
        } else if (channel.inviteModel === 'owner') {
            if (user.id !== channel.ownerId) throw new Error('Unauthorized');
        } else if (channel.inviteModel === 'member') {
            const rows = await trx`
                SELECT * FROM "channelUsers"
                WHERE "channelId"=${request.json.channelId} AND "userId"=${user.id}
            `;
            if (rows.length === 0) throw new Error('Unauthorized');
        } else {
            // unknown invite model
            throw new Error('Unauthorized');
        }

        const rows = await trx`
            INSERT INTO "channelUsers" ("channelId", "userId")
            VALUES (${request.json.channelId}, ${request.json.userId})
            ON CONFLICT DO NOTHING
            RETURNING *
            `;
        if (rows.length > 0) {
            await trx`
                INSERT INTO "messages" ("channelId", "fromUserId", "payload")
                VALUES (
                    ${request.json.channelId},
                    (SELECT id FROM users WHERE username='system'),
                    jsonb_build_object(
                        'message',
                        'user ' || ${user.id} || ' has subscribed to the channel'
                    )
                )
            `;
        }
        await trx`COMMIT`;
    } catch (e) {
        await trx`ABORT`;
        throw e;
    }

    response.send({ status: 200 });
};
