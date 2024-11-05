import './ImageLibrary.css';
import React, { useState, useEffect } from 'react';
import { constructS3Url, listAllObjects, deleteObject } from './awsService';
import ImageUploader from './ImageUploader'

function ImageLibrary() {
  const [objects, setObjects] = useState([]);

  useEffect(() => {
    const fetchObjects = async () => {
      const objectUrls = await listAllObjects();
      setObjects(objectUrls);
    };

    fetchObjects();
  }, []);

  const handleImageClick = async (event, image) => {
    await deleteObject(image.Key);
    setObjects((prevObjects) => prevObjects.filter(obj => obj.Key !== image.Key));
  };

  const uploadHandler = async (additions) => {
    try {

      // Ensure each new addition is unique by filtering based on the Key property
      const newUniqueAdditions = additions.filter(
        (addition) => !objects.some((obj) => obj.Key === addition.Key)
      );

      // Prepend new unique objects to the existing objects list
      setObjects((prevObjects) => {
        const updatedObjects = [...newUniqueAdditions, ...prevObjects];
        
        // Use a Set to ensure each Key is unique
        const uniqueObjects = Array.from(new Set(updatedObjects.map(obj => obj.Key)))
                                   .map(key => updatedObjects.find(obj => obj.Key === key));

        return uniqueObjects;
      });

    } catch (error) {
      console.error('Error updating objects:', error);
    }
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
  const [url, setUrl] = useState(() => constructS3Url(aws_object));

  useEffect(() => {
    setUrl(constructS3Url(aws_object));
  }, [aws_object]);

  return (
    <div className='image-item'>
      <button className='delete-button' onClick={(e) => onDelete(e, aws_object)}>
        &times;
      </button>
      
      {/* Wrap the image in an anchor tag to enable downloading */}
      <a href={url} download={aws_object.Key} onClick={(e) => e.stopPropagation()}>
        <img src={url} alt="S3 Object" />
      </a>
    </div>
  );
}

export default ImageLibrary;
