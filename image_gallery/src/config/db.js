const MongoClient = require('mongodb').MongoClient;
let database = null;
const connectDB = (callback) => {
    return new Promise((resolve, reject) => {
        if (database)
            resolve(database);
        else {
            MongoClient.connect("mongodb+srv://admin:admin@cluster0.vutmx.mongodb.net/images?retryWrites=true&w=majority", { useUnifiedTopology: true }, (err, client) => {
                if (!err) {
                    console.log(`Connected successfully to the Database`);
                    database = client.db('images');
                    resolve(database);
                } else {
                    reject(err);
                    console.error('Erorr in db.js', err);
                }

            });
        }
    })
}

module.exports = connectDB;