const AWS = require('aws-sdk');
const download = require('download');
const fs = require('fs');
const moment = require('moment');
const path = require('path');





const { insertData, getData } = require('../models/datamodels')

const FILE_PATH = `${__dirname}/../files`;
const SUPPORTED_IMAGES_TYPES = ['.jpg', '.jpeg'];


const s3 = new AWS.S3({
    accessKeyId: 'AKIA3BJBF5RJW4F7I4N7',
    secretAccessKey: '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'
});

//construct the response format with proper messages
function constructResponse(s3ImagesInfo, imagesUrls) {
    try {
        let response = [];
        imagesUrls.map(item => {
            if (!item.isSupported) {
                response.push({
                    'url': item.url,
                    'inserted': false,
                    'message': 'file format not supported to upload'
                })
            } else if (item.fileSize > 4) {
                response.push({
                    'url': item.url,
                    'inserted': false,
                    'message': 'File size exceed the limit 4MB'
                })
            } else {
                console.log('31')
                response.push({
                    'url': item.url,
                    'inserted': true,
                    's3url': s3ImagesInfo.find(image => image.key === item.fileName).Location
                })
            }
        });
        return response;
        console.log("response is", response);

    } catch (e) {
        console.error('Error reported in constructResponse', e);
        return {
            'message': 'Error in constructing response',
            'error': true
        }
    }
}

//Download the files from the image url of the request
async function downloadFiles(images) {
    try {

        await Promise.all(images.map(async(item, index) => {
            if (item.isSupported) {
                console.log("38", index)
                fs.writeFileSync(`${FILE_PATH}/image_${index}${item.fileType}`,
                    await download(item.url)
                );
                item.isDownloaded = true;
            }
        }))
        return images;
    } catch (e) {
        console.error('Error in calculateImageSize', e)
    }
}

async function insertImages(request) {
    try {
        let { body } = request;
        if (Array.isArray(body)) {
            if (body.length > 20) {
                return {
                    message: 'Images exceeded maximum limit 20',
                    error: false,
                    data: []
                }
            } else {
                let result = await processImageLinks(body);
                return result;
            }
        } else {
            return {
                message: 'Body is expected to be an array in the request',
                error: false,
                data: []
            }
        }
    } catch (e) {
        console.error('Error reported in insertImages', e)
    }
}

//Insert the image information to the database
async function insertToDB(images) {
    try {
        let validImages = images.filter(item => item.isSupported && item.fileSize < 4);
        validImages.map(img => {
            img.createDate = moment().add('330', 'minutes').toISOString()
        });
        let result = await insertData(validImages, 'history');
        if (result)
            return true
        else
            return false

    } catch (e) {
        console.log('error in insertToDb', e);
        return e;
    }
}

//Insert the images to s3
async function insertToS3(images) {
    try {
        let s3ImagesInfo = [];
        await Promise.all(images.map(async item => {
            if ((item.isSupported) && (item.fileSize < 4)) {
                let result = await s3.upload({
                    Bucket: 'images-list',
                    Key: item.fileName,
                    Body: fs.readFileSync(`${FILE_PATH}/${item.fileName}`)

                }).promise();
                s3ImagesInfo.push(result);
            }
        }));
        console.log("Inserted information", s3ImagesInfo);
        return s3ImagesInfo;

    } catch (e) {
        console.error('Error reported in insertToS3', e);
        throw new Error(e);
    }
}

//get the image extensions
function getImageExtensions(images) {
    images.map(item => {
        item.fileType = path.extname(item.url);
        if (SUPPORTED_IMAGES_TYPES.includes(item.fileType))
            item.isSupported = true;
    })
    return images;
}

//calculates downloaded images size in MB
function getImageSize(images) {
    try {
        console.log("76", FILE_PATH, images)
        let filenames = fs.readdirSync(FILE_PATH);
        filenames.map(name => {
            let fileSize = fs.statSync(`${FILE_PATH}/${name}`);
            fileSize = fileSize.size / (1024 * 1024);
            let fileIndex = name.split('_')[1].split('.')[0];

            //attach the image size to image configuration
            images[fileIndex]['fileSize'] = fileSize;
            images[fileIndex]['fileName'] = `image_${fileIndex}${images[fileIndex]['fileType']}`
        });
        return images

    } catch (e) {
        console.log('Error reported in getImageSizes', e);
        throw new Error(e);
    }
}
async function processImageLinks(images) {
    try {
        let imagesUrls = [...images];
        imagesUrls = getImageExtensions(imagesUrls);
        imagesUrls = await downloadFiles(imagesUrls);
        imagesUrls = await getImageSize(imagesUrls);

        let s3Result = await insertToS3(imagesUrls);
        let dbResult = await insertToDB(imagesUrls);
        if (dbResult) {
            let response = constructResponse(s3Result, imagesUrls);
            console.log("182", response);
            return response;
        } else {
            return {
                'message': e,
                'error': true,
                'data': []
            }
        }







    } catch (e) {
        console.error('Error reported in processImageLinks', e);
        throw new Error(e);
    }
}







module.exports = {
    insertImages
}