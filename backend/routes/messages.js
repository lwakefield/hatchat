const { request, response } = require('@persea/persea');

const { query } = require('../db');
const { getAuthenticatedUser } = require('../authentication');
const { assertUserIsAuthorizedForChannel } = require('../authorization');
const { sleep } = require('../utils');

module.exports.create = async () => {
    const user = await getAuthenticatedUser();
    const { channelId, payload } = request.json;

    await assertUserIsAuthorizedForChannel(channelId);

    await query`
        INSERT INTO messages ("channelId", "fromUserId", "payload")
        VALUES (${channelId}, ${user.id}, ${payload})
    `;

    response.send({ status: 200 });
};

module.exports.index = async () => {
    await assertUserIsAuthorizedForChannel(request.query.channelId);

    const POLL_LIMIT = 300;
    const POLL_WAIT  = 100;

    const since = request.query.since || '-infinity';
    const until = request.query.until || 'infinity';
    const limit = request.query.limit || 20;

    for (let i = 0; i < POLL_LIMIT; i++) {
        const messages = await query`
            SELECT "createdAt", "fromUserId", "username", "payload" FROM messages
            JOIN "users" ON "users"."id" = "messages"."fromUserId"
            WHERE 1=1
                AND "channelId"=${request.query.channelId}
                AND date_trunc('seconds', "createdAt") > ${since} AND "createdAt" < ${until}
            ORDER BY "createdAt" ASC
            LIMIT ${limit}
        `;

        if (messages.length > 0) return response.send({ json: messages });

        await sleep(POLL_WAIT);
    }

    response.send({ json: [] });
}
