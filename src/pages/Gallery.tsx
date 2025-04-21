import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useColoringStore } from '../store/coloringStore';
import './Gallery.css';

const Gallery: React.FC = () => {
  const { images, fetchImages, isLoading, error } = useColoringStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const handleImageClick = (id: number) => {
    navigate(`/coloring/${id}`);
  };

  if (isLoading) return <div className="loading">Loading images...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="gallery-container">
      <h1 className="page-title">Choose an Image to Color</h1>
      <div className="image-grid">
        {images.map((image) => (
          <div 
            key={image.id} 
            className="image-item"
            onClick={() => handleImageClick(image.id)}
          >
            <img src={image.url} alt={image.name} />
            <p>{image.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Gallery;
