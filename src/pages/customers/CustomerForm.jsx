import React from 'react';
import { useParams } from 'react-router-dom';
import CustomerFormComponent from '../../components/customer/CustomerForm';

const CustomerForm = () => {
  const { id } = useParams();
  const isEditing = !!id;

  return <CustomerFormComponent isEditing={isEditing} />;
};

export default CustomerForm;