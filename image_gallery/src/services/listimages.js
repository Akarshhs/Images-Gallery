const { aggregateData } = require('../models/datamodels');


let DEFAULT_LIMIT = 20;

//construct the filters based on the query string
function constructQuery(queryParams) {
    let matchQuery = {
        '$match': {
            '$and': []
        }
    };
    Object.keys(queryParams).map(searchKey => {
        if (!['skip', 'limit'].includes(searchKey)) {
            if (searchKey === 'startRange') {
                let query = {};
                query['createDate'] = {
                    '$gte': new Date(queryParams[searchKey]).toISOString()
                }
                matchQuery['$match']['$and'].push(query)
            } else if (searchKey === 'endRange') {
                let query = {};
                query['createDate'] = {
                    '$lte': new Date(queryParams[searchKey]).toISOString()
                }
                matchQuery['$match']['$and'].push(query)
            } else {
                let query = {};
                query[searchKey] = {
                    '$regex': queryParams[searchKey],
                    '$options': 'i'
                }
                matchQuery['$match']['$and'].push(query)
            }
        }
    })
    if (matchQuery['$match']['$and'].length)
        return matchQuery
    else
        return null;

}
async function getImages(request) {
    try {
        let { query } = request;
        let skip = request.query.skip ? Number(request.query.skip) : 0;
        let limit = request.query.limit != 0 ? Number(request.query.limit) : Number(DEFAULT_LIMIT);

        let finalQuery = [];

        let filterQuery = constructQuery(query);
        if (filterQuery)
            finalQuery.push(filterQuery)

        finalQuery = [...finalQuery, ...[{ '$skip': skip }], ...[{ '$limit': limit }]];
        console.log("finalQuery is", JSON.stringify(finalQuery, null, 4));
        let result = await aggregateData(finalQuery, 'history');
        return result;
    } catch (e) {
        console.error('Error reported in getImages', e)
        throw new error(e);
    }
}


module.exports = {
    getImages
}