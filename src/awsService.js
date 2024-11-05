// awsService.js
import AWS from 'aws-sdk';

AWS.config.update({
  accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
  region: process.env.REACT_APP_AWS_REGION,
  signatureVersion: 'v4',
});

const s3 = new AWS.S3();

export const constructS3Url = (awsObject) => {
  const bucketName = process.env.REACT_APP_S3_BUCKET_NAME;
  const region = process.env.REACT_APP_AWS_REGION;

  if (!awsObject || !awsObject.Key) {
    throw new Error("Invalid AWS object: Missing Key property.");
  }

  return `https://${bucketName}.s3.${region}.amazonaws.com/${awsObject.Key}`;
};

export const listAllObjects = async () => {
  const params = {
    Bucket: process.env.REACT_APP_S3_BUCKET_NAME,
    Prefix: 'people/'
  };

  try {
    const data = await s3.listObjectsV2(params).promise();
    const files = data.Contents;
    files.shift(); // Assuming the first item is not needed
    files.sort((a, b) => new Date(b.LastModified) - new Date(a.LastModified));

    return files;
  } catch (error) {
    console.error('Error fetching objects:', error);
    return [];
  }
};


export const uploadFiles = async (files) => {
  const bucketName = process.env.REACT_APP_S3_BUCKET_NAME;

  const uploadPromises = files.map((file) => {
    const params = {
      Bucket: bucketName,
      Key: `people/${file.name}`, // Adjust the key path as needed
      Body: file,
      ContentType: file.type,
    };

    return s3.upload(params).promise();
  });

  try {
    const results = await Promise.all(uploadPromises);
    console.log('Files successfully uploaded');
    return results;
  } catch (error) {
    console.error('Error uploading files:', error);
    throw error;
  }
};

export const getObjectData = async (key) => {
  console.log(key)
  const fullKey = key.startsWith('people/') ? key : `people/${key}`;
  const params = {
    Bucket: process.env.REACT_APP_S3_BUCKET_NAME,
    Key: fullKey,
  };

  try {
    const data = await s3.getObject(params).promise();
    return data.Body.toString('utf-8');
  } catch (error) {
    console.error('Error fetching object:', error);
    throw error;
  }
};

export const deleteObject = async (key) => {
  const params = {
    Bucket: process.env.REACT_APP_S3_BUCKET_NAME,
    Key: key,
  };

  try {
    await s3.deleteObject(params).promise();
    console.log(`Successfully deleted ${key}`);
  } catch (error) {
    console.error('Error deleting object:', error);
  }
};

export const getRandomImage = async () => {
  try {
    const objects = await listAllObjects(); // Fetch all objects
    if (objects.length > 0) {
      const randomIndex = Math.floor(Math.random() * objects.length);
      return objects[randomIndex]; // Return a random object
    }
    throw new Error("No images available.");
  } catch (error) {
    console.error('Error fetching random image:', error);
    throw error; // Rethrow the error for handling in the calling component
  }
};