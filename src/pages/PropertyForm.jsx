import React from 'react';
import { useParams } from 'react-router-dom';
import PropertyFormComponent from '../components/property/PropertyForm';

const PropertyFormPage = () => {
  const { id } = useParams();
  const isEditing = !!id;
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        {isEditing ? '매물 정보 수정' : '새 매물 등록'}
      </h1>
      
      <PropertyFormComponent isEditing={isEditing} />
    </div>
  );
};

export default PropertyFormPage;