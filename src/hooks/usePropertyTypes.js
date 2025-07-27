import { useQuery } from 'react-query';
import { supabase } from '../services/supabase';

export const usePropertyTypes = () => {
  const fetchPropertyTypes = async () => {
    const { data, error } = await supabase
      .from('property_types')
      .select('*')
      .order('name');
      
    if (error) throw error;
    return data;
  };
  
  const { data, error, isLoading } = useQuery('propertyTypes', fetchPropertyTypes, {
    staleTime: 1000 * 60 * 60, // 1시간 캐시
    cacheTime: 1000 * 60 * 60 * 24, // 24시간 캐시
  });
  
  return {
    propertyTypes: data || [],
    loading: isLoading,
    error
  };
};