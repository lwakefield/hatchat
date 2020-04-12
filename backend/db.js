const { Pool } = require('pg');

const pool = new Pool();

const makeQueryFn = (queryFn) => {
    const q = async (parts, ...bindings) => {
        const queryString = parts.reduce((query, part, index) => {
            if (index === 0) return part;
            return query + `$${index}` + part;
        })

        const { rows } = await queryFn(queryString, bindings);
        return rows;
    };
    return q;
}

async function transaction () {
    const client = await pool.connect();
    return makeQueryFn(client.query.bind(client));
}

module.exports = {
    pool,
    query: makeQueryFn(pool.query.bind(pool)),
    transaction,
};
