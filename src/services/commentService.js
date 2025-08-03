import { supabase } from './supabase';
import { handleError, secureLogger } from '../utils/errorHandler';

// 매물 코멘트 조회
export const getPropertyComments = async (propertyId) => {
  try {
    const { data, error } = await supabase
      .from('property_comments')
      .select('*')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    secureLogger.error('코멘트 조회 실패', error, { propertyId });
    return handleError(error, { action: 'getPropertyComments', propertyId });
  }
};

// 코멘트 작성
export const createComment = async (propertyId, commentText, user) => {
  try {
    const { data, error } = await supabase
      .from('property_comments')
      .insert([{
        property_id: propertyId,
        user_id: user.id || user.email,
        user_name: user.name || user.email.split('@')[0],
        comment_text: commentText
      }])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('코멘트 작성 실패:', error);
    return { success: false, error: error.message };
  }
};

// 코멘트 수정
export const updateComment = async (commentId, commentText) => {
  try {
    const { data, error } = await supabase
      .from('property_comments')
      .update({ comment_text: commentText })
      .eq('id', commentId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('코멘트 수정 실패:', error);
    return { success: false, error: error.message };
  }
};

// 코멘트 삭제
export const deleteComment = async (commentId) => {
  try {
    const { error } = await supabase
      .from('property_comments')
      .delete()
      .eq('id', commentId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('코멘트 삭제 실패:', error);
    return { success: false, error: error.message };
  }
};

// 실시간 코멘트 구독
export const subscribeToComments = (propertyId, callback) => {
  const channel = supabase
    .channel(`property-comments-${propertyId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'property_comments',
        filter: `property_id=eq.${propertyId}`
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return channel;
};