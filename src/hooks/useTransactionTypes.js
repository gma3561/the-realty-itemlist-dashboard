import { useQuery } from 'react-query';
import { supabase } from '../services/supabase';

export const useTransactionTypes = () => {
  const fetchTransactionTypes = async () => {
    const { data, error } = await supabase
      .from('transaction_types')
      .select('*')
      .order('name');
      
    if (error) throw error;
    return data;
  };
  
  const { data, error, isLoading } = useQuery('transactionTypes', fetchTransactionTypes, {
    staleTime: 1000 * 60 * 60,
    cacheTime: 1000 * 60 * 60 * 24,
  });
  
  return {
    transactionTypes: data || [],
    loading: isLoading,
    error
  };
};