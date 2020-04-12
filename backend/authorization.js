const { getAuthenticatedUser } = require('./authentication');
const { query } = require('./db');

async function assertUserIsAuthorizedForChannel (channelId) {
    const user = await getAuthenticatedUser();

    const rows = await query`
        SELECT * FROM "channelUsers"
        WHERE "channelId"=${channelId} AND "userId"=${user.id}
    `;
    if (rows.length !== 1) throw new Error('Forbidden');
}

async function assertUserOwnsChannel (channelId) {
    const user = await getAuthenticatedUser();

    const rows = await query`
        SELECT * FROM "channels"
        WHERE "id"=${channelId} AND "ownerId"=${user.id}
    `;
    if (rows.length !== 1) throw new Error('Forbidden');
}

module.exports = { assertUserIsAuthorizedForChannel, assertUserOwnsChannel };
