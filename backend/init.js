const fs = require('fs');

const { query } = require('./db');

module.exports.init = async () => {
    try {
        const [ exists ] = await query`
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_name = 'messages'
            );
        `;
        if (exists.exists) return;

        await query([ fs.readFileSync('./schema.sql').toString() ]);
    } catch (e) {  }
};
