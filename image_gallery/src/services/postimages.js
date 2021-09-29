const AWS = require('aws-sdk');
const download = require('download');
const fs = require('fs');
const moment = require('moment');
const path = require('path');
const { v4: uuidv4 } = require('uuid');





const { insertData, getData } = require('../models/datamodels')

const FILE_PATH = `${__dirname}/../files`;
const SUPPORTED_IMAGES_TYPES = ['.jpg', '.jpeg'];


const s3 = new AWS.S3({
    accessKeyId: 'AKIA3BJBF5RJW4F7I4N7',
    secretAccessKey: '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'
});


//Download the files from the image url of the request
async function downloadFiles(images) {
    try {
        console.log('27', uuidv4())
        await Promise.all(images.map(async(item, index) => {
            if (item.isSupported) {
                const random = uuidv4();
                console.log("random is ", random)
                fs.writeFileSync(`${FILE_PATH}/image_${random}${item.fileType}`,
                    await download(item.url)
                );
                item.isDownloaded = true;
                item.random = random;
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
        if (Array.isArray(body) && body.length) {
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
        images.map(img => {
            if (!img.isSupported)
                img.info = 'file format no supported';
            if (img.fileSize > 4)
                img.info = 'file format not supported';
        });

        let validImages = images.filter(item => item.isSupported && item.fileSize < 4);
        validImages.map(img => {
            img.createDate = moment().add('330', 'minutes').toISOString()
        });

        //remove the unwanted keys
        images.map(img => {
            delete img.isSupported;
            delete img.isDownloaded;
            delete img.random;
        })
        console.log("images are112", images);
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

        await Promise.all(images.map(async item => {
            if ((item.isSupported) && (item.fileSize < 4)) {
                console.log("131", item)
                let result = await s3.upload({
                    Bucket: 'images-list',
                    Key: item.fileName,
                    Body: fs.readFileSync(`${FILE_PATH}/image_${item.random}${item.fileType}`)

                }).promise();
                item.s3url = result.Location;


            }
        }));
        return images;

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
        console.log("143 images", images);
        let filenames = fs.readdirSync(FILE_PATH);
        console.log("filenames", filenames)
        filenames.map(name => {
            let fileSize = fs.statSync(`${FILE_PATH}/${name}`);
            fileSize = fileSize.size / (1024 * 1024);
            let fileKey = name.split('_')[1].split('.')[0];

            //attach the image size to image configuration
            console.log("fileKey", fileKey)
            let imageInfo = images.find(item => item.random === fileKey)
            imageInfo['fileSize'] = fileSize;
            imageInfo['fileName'] = `image_${fileKey}${imageInfo.fileType}`
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

        imagesUrls = await insertToS3(imagesUrls);
        let dbResult = await insertToDB(imagesUrls);
        if (dbResult) {
            return imagesUrls;
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
