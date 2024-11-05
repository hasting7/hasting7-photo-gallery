import './App.css';
import React, { useState, useEffect } from 'react';
import AWS from 'aws-sdk';

AWS.config.update({
  accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
  region: process.env.REACT_APP_AWS_REGION,
  signatureVersion: 'v4',
});

const s3 = new AWS.S3();

const constructS3Url = (awsObject) => {
  const bucketName = process.env.REACT_APP_S3_BUCKET_NAME;
  const region = process.env.REACT_APP_AWS_REGION;

  if (!awsObject || !awsObject.Key) {
    throw new Error("Invalid AWS object: Missing Key property.");
  }

  const url = `https://${bucketName}.s3.${region}.amazonaws.com/${awsObject.Key}`;
  return url;
};

const listAllObjects = async () => {
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

const getObjectData = async (key) => {
  const fullKey = key.startsWith('people/') ? key : `people/${key}`;

  const params = {
    Bucket: process.env.REACT_APP_S3_BUCKET_NAME,
    Key: fullKey,
  };

  try {
    const data = await s3.getObject(params).promise();
    const objectData = data.Body.toString('utf-8'); 
    return objectData;
  } catch (error) {
    console.error('Error fetching object:', error);
    throw error; 
  }
};

const deleteObject = async (key) => {
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

function App() {
  const [objects, setObjects] = useState([]);

  useEffect(() => {
    const fetchObjects = async () => {
      const objectUrls = await listAllObjects();
      setObjects(objectUrls);
    };

    fetchObjects();
  }, []);

  const handleImageClick = async (event, image) => {
    console.log('Image clicked:', event.target, image);
    await deleteObject(image.Key); // Call deleteObject or handle as needed
    setObjects((prevObjects) => prevObjects.filter(obj => obj.Key !== image.Key)); // Update state to remove deleted image
  };

  const uploadHandler = async (additions) => {
    const newObjects = [];
    for (const addition of additions) {
      const s3Key = addition.key;
      const s3Url = `https://${process.env.REACT_APP_S3_BUCKET_NAME}.s3.${process.env.REACT_APP_AWS_REGION}.amazonaws.com/${s3Key}`;

      try {
        const objectData = await getObjectData(s3Key);
        console.log(`Fetched data for ${s3Key}:`, objectData);

        if (!objects.includes(s3Url)) {
          newObjects.push(s3Url);
        }
      } catch (error) {
        console.error(`Error fetching object data for ${s3Key}:`, error);
      }
    }

    setObjects((prevObjects) => [...newObjects, ...prevObjects]);
  };

  return (
    <div className="App">
      <ImageUploader onUpload={uploadHandler} />
      <div className="image-library">
        {objects.length > 0 ? (
          objects.map((object, index) => (
            <Image key={index} aws_object={object} onDelete={handleImageClick} />
          ))
        ) : (
          <p className="empty-state">No images found.</p>
        )}
      </div>
    </div>
  );
}

function Image({ aws_object, onDelete }) {
  const [url, setUrl] = useState(constructS3Url(aws_object));

  return (
    <div className='image-item'>
      <button className='delete-button' onClick={(e) => {onDelete(e, aws_object)}}>
        &times;
      </button>
      <img src={url} alt="S3 Object" />
    </div>
  );
}


function ImageUploader({ onUpload }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('');

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    // Filter files to only keep JPG or PNG images
    const validFiles = files.filter(file =>
      file.type === 'image/jpeg' || file.type === 'image/png'
    );
    setSelectedFiles(validFiles);
    
    if (validFiles.length !== files.length) {
      alert('Only JPG and PNG files are allowed.'); // Alert user if there are invalid files
    }
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select files to upload.');
      return;
    }

    setUploadStatus('Uploading...');

    const promises = selectedFiles.map((file) => {
      const params = {
        Bucket: process.env.REACT_APP_S3_BUCKET_NAME,
        Key: `people/${file.name}`,
        Body: file,
        ContentType: file.type,
      };

      return s3.upload(params).promise();
    });

    try {
      await Promise.all(promises);
      setUploadStatus('Upload successful!');
      setSelectedFiles([]);
      onUpload(selectedFiles); // Pass the valid selected files to the onUpload callback
    } catch (error) {
      console.error('Error uploading files:', error);
      setUploadStatus('Upload failed. Please try again.');
    }
  };

  return (
    <div className="upload-manager">
      <input
        type="file"
        multiple
        onChange={handleFileChange}
      />
      <button onClick={uploadFiles}>Upload</button>
      {uploadStatus && <p>{uploadStatus}</p>}
    </div>
  );
}


export default App;
