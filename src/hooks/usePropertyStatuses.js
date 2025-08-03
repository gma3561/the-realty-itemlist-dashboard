import { useQuery } from 'react-query';
import { supabase } from '../services/supabase';

export const usePropertyStatuses = () => {
  const fetchPropertyStatuses = async () => {
    const { data, error } = await supabase
      .from('property_statuses')
      .select('*')
      .order('display_order');
      
    if (error) throw error;
    return data;
  };
  
  const { data, error, isLoading } = useQuery('propertyStatuses', fetchPropertyStatuses, {
    staleTime: 1000 * 60 * 60,
    cacheTime: 1000 * 60 * 60 * 24,
  });
  
  return {
    propertyStatuses: data || [],
    loading: isLoading,
    error
  };
};