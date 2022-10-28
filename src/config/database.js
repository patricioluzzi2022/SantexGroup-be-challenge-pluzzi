require('dotenv').config()

const getConnectionString = () =>{
    return `mongodb://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_HOST}:${process.env.MONGODB_PORT}`;
}

module.exports = {getConnectionString};