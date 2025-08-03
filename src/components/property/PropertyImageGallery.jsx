import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import imageUploadService from '../../services/imageUploadService';
import { useAuth } from '../../contexts/AuthContext';

const PropertyImageGallery = ({ propertyId, onImagesChange, editable = true }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (propertyId) {
      loadImages();
    }
  }, [propertyId]);

  const loadImages = async () => {
    try {
      setLoading(true);
      const imageData = await imageUploadService.getPropertyImages(propertyId);
      setImages(imageData);
      
      if (onImagesChange) {
        onImagesChange(imageData);
      }
    } catch (error) {
      console.error('이미지 로딩 실패:', error);
      alert('이미지를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination || !editable) return;

    const newImages = Array.from(images);
    const [reorderedItem] = newImages.splice(result.source.index, 1);
    newImages.splice(result.destination.index, 0, reorderedItem);

    // 낙관적 업데이트
    setImages(newImages);

    try {
      // 서버에 순서 업데이트
      const imageIds = newImages.map(img => img.id);
      await imageUploadService.reorderImages(imageIds);
      
      if (onImagesChange) {
        onImagesChange(newImages);
      }
    } catch (error) {
      console.error('이미지 순서 변경 실패:', error);
      alert('이미지 순서 변경에 실패했습니다.');
      // 실패 시 원래 상태로 롤백
      loadImages();
    }
  };

  const deleteImage = async (imageId) => {
    if (!confirm('이미지를 삭제하시겠습니까?')) return;

    try {
      setActionLoading(imageId);
      await imageUploadService.deleteImage(imageId);
      
      const updatedImages = images.filter(img => img.id !== imageId);
      setImages(updatedImages);
      
      if (onImagesChange) {
        onImagesChange(updatedImages);
      }
      
      alert('이미지가 삭제되었습니다.');
    } catch (error) {
      console.error('이미지 삭제 실패:', error);
      alert(`이미지 삭제에 실패했습니다: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const setPrimaryImage = async (imageId) => {
    try {
      setActionLoading(imageId);
      await imageUploadService.setPrimaryImage(imageId, propertyId);
      
      // 로컬 상태 업데이트
      const updatedImages = images.map(img => ({
        ...img,
        is_primary: img.id === imageId
      }));
      setImages(updatedImages);
      
      if (onImagesChange) {
        onImagesChange(updatedImages);
      }
      
    } catch (error) {
      console.error('대표 이미지 설정 실패:', error);
      alert('대표 이미지 설정에 실패했습니다.');
    } finally {
      setActionLoading(null);
    }
  };

  const openImageModal = (image) => {
    setSelectedImage(image);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  const getImageAlt = (image, index) => {
    return image.alt_text || `매물 이미지 ${index + 1}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-3 text-gray-600">이미지를 불러오는 중...</span>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p>등록된 이미지가 없습니다.</p>
        {editable && (
          <p className="text-sm mt-2">이미지 업로드 영역을 사용하여 사진을 추가해보세요.</p>
        )}
      </div>
    );
  }

  return (
    <div className="image-gallery">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          매물 사진 ({images.length}개)
        </h3>
        {editable && (
          <p className="text-sm text-gray-500">
            드래그하여 순서 변경 가능
          </p>
        )}
      </div>

      {editable ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="images" direction="horizontal">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4"
              >
                {images.map((image, index) => (
                  <Draggable key={image.id} draggableId={image.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`relative group cursor-pointer ${
                          snapshot.isDragging ? 'opacity-75 z-50' : ''
                        }`}
                      >
                        <ImageCard
                          image={image}
                          index={index}
                          onDelete={deleteImage}
                          onSetPrimary={setPrimaryImage}
                          onOpenModal={openImageModal}
                          isLoading={actionLoading === image.id}
                          editable={editable}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {images.map((image, index) => (
            <ImageCard
              key={image.id}
              image={image}
              index={index}
              onOpenModal={openImageModal}
              editable={false}
            />
          ))}
        </div>
      )}

      {/* 이미지 상세 모달 */}
      {selectedImage && (
        <ImageModal
          image={selectedImage}
          onClose={closeImageModal}
        />
      )}
    </div>
  );
};

// 개별 이미지 카드 컴포넌트
const ImageCard = ({ image, index, onDelete, onSetPrimary, onOpenModal, isLoading, editable }) => {
  return (
    <div className="aspect-square relative overflow-hidden rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-colors">
      {/* 이미지 */}
      <img
        src={image.thumbnail_url}
        alt={image.alt_text || `매물 이미지 ${index + 1}`}
        className="w-full h-full object-cover cursor-pointer"
        onClick={() => onOpenModal(image)}
        loading="lazy"
      />
      
      {/* 순서 번호 */}
      <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
        {index + 1}
      </div>
      
      {/* 대표 이미지 표시 */}
      {image.is_primary && (
        <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded font-medium">
          대표
        </div>
      )}
      
      {/* 로딩 인디케이터 */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* 편집 가능할 때만 액션 버튼들 표시 */}
      {editable && (
        <div className="absolute bottom-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* 대표 이미지 설정 버튼 */}
          {!image.is_primary && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSetPrimary(image.id);
              }}
              className="bg-green-500 hover:bg-green-600 text-white p-1 rounded text-xs"
              title="대표 이미지로 설정"
              disabled={isLoading}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          )}
          
          {/* 삭제 버튼 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(image.id);
            }}
            className="bg-red-500 hover:bg-red-600 text-white p-1 rounded text-xs"
            title="이미지 삭제"
            disabled={isLoading}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

// 이미지 상세 모달 컴포넌트
const ImageModal = ({ image, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="max-w-4xl max-h-full relative">
        <div className="relative">
          {/* 원본 이미지 표시 */}
          <img
            src={image.google_drive_url}
            alt={image.alt_text}
            className="max-w-full max-h-screen object-contain"
          />
          
          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-colors"
            title="닫기"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          {/* 이미지 정보 */}
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white p-3 rounded">
            <p className="text-sm">{image.original_filename}</p>
            {image.file_size && (
              <p className="text-xs text-gray-300">
                {(image.file_size / 1024 / 1024).toFixed(2)} MB
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* 배경 클릭으로 닫기 */}
      <div 
        className="absolute inset-0 -z-10" 
        onClick={onClose}
      ></div>
    </div>
  );
};

export default PropertyImageGallery;