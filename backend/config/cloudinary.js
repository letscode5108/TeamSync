// import cloudinaryPkg from'cloudinary';
// import { CloudinaryStorage }from'multer-storage-cloudinary';
// import multer from'multer'

// // Get the v2 instance from the cloudinary package
// const cloudinary = cloudinaryPkg.v2;

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET
// });

// const storage = new CloudinaryStorage({
//  cloudinary : cloudinary,
//   params: {
//     folder: 'team-chat-files',
//     resource_type: 'auto'
//   }
// });

// const upload = multer({ storage: storage });

// export  { cloudinary, upload };

// In cloudinary.js
// import cloudinary from 'cloudinary/v2';
// import { CloudinaryStorage } from 'multer-storage-cloudinary';
// import multer from 'multer';
// 
// cloudinary.config({ 
  // cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  // api_key: process.env.CLOUDINARY_API_KEY, 
  // api_secret: process.env.CLOUDINARY_API_SECRET
// });
// 
// const storage = new CloudinaryStorage({
  // cloudinary: cloudinary,
  // params: {
    // folder: 'chat_attachments',
    // allowed_formats: ['jpg', 'png', 'pdf', 'doc', 'docx']
  // }
// });
// 
// const upload = multer({ storage: storage });
// 
// export { cloudinary, upload };
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'chat_attachments',
    allowed_formats: ['jpg', 'png', 'pdf', 'doc', 'docx']
  }
});

const upload = multer({ storage: storage });

export { cloudinary, upload };