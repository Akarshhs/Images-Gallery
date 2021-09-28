const { getImages } = require('../services/listimages');
const { insertImages } = require('../services/postimages');

const router = require('express').Router();



router.post('/insert', async(request, response) => {
    try {
        let result = await insertImages(request);
        console.log("result", result);
        response.json({
            data: result
        })
    } catch (e) {
        console.error('Error reported in insert route', e);
        response.json({
            error: true,
            data: [],
            message: e
        })
    }
});

router.get('/list', async(request, response) => {
    console.log("22");
    try {
        let result = await getImages(request, response);
        if (result && result.length) {
            response.json({
                data: result
            })
        } else {
            response.json({
                data: [],
                message: 'No data found'
            })
        }
    } catch (e) {
        console.error('Error reported in list route', e);
        response.json({
            error: true,
            data: [],
            message: e
        })
    }
})

module.exports = router;