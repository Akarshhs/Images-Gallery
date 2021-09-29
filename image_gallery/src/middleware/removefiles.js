const fs = require('fs');
const FILE_PATH = `${__dirname}/../files`;

function removeFiles() {
    try {
        let filenames = fs.readdirSync(FILE_PATH);
        if (filenames && filenames.length) {
            filenames.map(name => {
                fs.unlinkSync(`${FILE_PATH}/${name}`)
            })
        }
    } catch (e) {
        console.error('Error in removing the files');
    }
}

module.exports = {
    removeFiles
}