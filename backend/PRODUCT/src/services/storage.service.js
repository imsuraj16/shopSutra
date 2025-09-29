const ImageKit = require('imagekit');
const {v4 : uuidv4} = require('uuid');


const imageKit = new ImageKit({
    publicKey : process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey : process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint : process.env.IMAGEKIT_URL_ENDPOINT
});


const uploadImage = async(file)=>{

    const data = await imageKit.upload({
        file : file.buffer,
        fileName : uuidv4(),
        folder : 'shopSutra'
    })

    return data;
}


module.exports = {
    uploadImage
}