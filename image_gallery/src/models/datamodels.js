const connectDB = require('../config/db');
const aggregateData = async(query, collectionName) => {
    return new Promise(async(resolve, reject) => {
        let dbHandler = await connectDB();
        if (dbHandler) {
            let collection = dbHandler.collection(collectionName);
            let result = await collection.aggregate(query).toArray();
            resolve(result);
        } else
            reject(null);
    })


}
const insertData = async(data, collectionName, callback) => {
    return new Promise(async(resolve, reject) => {
        let dbHandler = await connectDB();
        if (dbHandler) {
            let collection = dbHandler.collection(collectionName);
            let result = await collection.insertMany(data);
            resolve(result);
        } else
            reject(null);
    })


}

const getData = async(query, collectionName, callback) => {
    return new Promise(async(resolve, reject) => {
        let dbHandler = await connectDB();
        if (dbHandler) {
            let collection = dbHandler.collection(collectionName);
            let result = await collection.find(query).toArray();
            resolve(result);
        } else
            reject(null);
    })

}

module.exports = {
    aggregateData,
    insertData,
    getData
}