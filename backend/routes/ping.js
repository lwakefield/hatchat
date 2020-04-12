const { response } = require('@persea/persea');

const { query } = require('../db');

module.exports.index = async () => {
    const [ row ] = await query`select 1 as pong`;
    response.send({ json: row });
}
