import './ImageUploader.css';
import React, { useState, useEffect } from 'react';
import {uploadFiles } from './awsService';

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

  const handleOnUpload = async () => {
    try {
      const uploadResults = await uploadFiles(selectedFiles); // Wait for uploadFiles to complete
      onUpload(uploadResults); // Call onUpload with the results of the upload
    } catch (error) {
      console.error('Error during file upload:', error);
    }
  };

  return (
    <div className="upload-manager">
      <input
        type="file"
        multiple
        onChange={handleFileChange}
      />
      <button onClick={handleOnUpload}>Upload</button>
      {uploadStatus && <p>{uploadStatus}</p>}
    </div>
  );
}

export default ImageUploader;