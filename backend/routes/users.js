const { request, response } = require('@persea/persea');

const { getAuthenticatedUser } = require('../authentication');
const { query } = require('../db');

module.exports.create = async () => {
    const { id, publicKey, username } = request.json
    await query`
        INSERT INTO "users" ("id", "publicKey", "username")
        VALUES (${id}, ${publicKey}, ${username})
    `;
    response.send({ status: 200 });
};

module.exports.update = async (id) => {
    const { username } = request.json
    await query`
        UPDATE "users"
        WHERE id=${id}
        SET username=${username}
    `;
    response.send({ status: 200 });
};

module.exports.destroy = async (id) => {
    const user = await getAuthenticatedUser();
    if (Number(user.id) !== id) throw new Error('Unauthorized');

    await query`
        DELETE FROM "users"
        WHERE id=${id}"
    `;

    response.send({ status: 200 });
};

module.exports.show = async (id) => {
    const [ user ] = await query`
        SELECT * FROM "users"
        WHERE "id"=${id}
    `;

    if (!user) throw new Error('NotFound')

    response.send({ json: user });
};
