import React, { useState, useEffect, useContext } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { MessageCircle, Send, Edit2, Trash2, X, Check } from 'lucide-react';
import AuthContext from '../../context/AuthContext';
import ToastContext from '../../context/ToastContext';
import { 
  getPropertyComments, 
  createComment, 
  updateComment, 
  deleteComment,
  subscribeToComments 
} from '../../services/commentService';

const PropertyComments = ({ propertyId }) => {
  const { user } = useContext(AuthContext);
  const { showToast } = useContext(ToastContext);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 코멘트 불러오기
  useEffect(() => {
    loadComments();
  }, [propertyId]);

  // 실시간 구독
  useEffect(() => {
    const channel = subscribeToComments(propertyId, (payload) => {
      if (payload.eventType === 'INSERT') {
        setComments(prev => [payload.new, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        setComments(prev => prev.map(c => 
          c.id === payload.new.id ? payload.new : c
        ));
      } else if (payload.eventType === 'DELETE') {
        setComments(prev => prev.filter(c => c.id !== payload.old.id));
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, [propertyId]);

  const loadComments = async () => {
    setLoading(true);
    const result = await getPropertyComments(propertyId);
    if (result.success) {
      setComments(result.data);
    } else {
      showToast('코멘트를 불러오는데 실패했습니다.', 'error');
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setSubmitting(true);
    const result = await createComment(propertyId, newComment.trim(), user);
    
    if (result.success) {
      setNewComment('');
      showToast('코멘트가 등록되었습니다.', 'success');
    } else {
      showToast('코멘트 등록에 실패했습니다.', 'error');
    }
    setSubmitting(false);
  };

  const handleUpdate = async (commentId) => {
    if (!editText.trim()) return;

    const result = await updateComment(commentId, editText.trim());
    
    if (result.success) {
      setEditingId(null);
      setEditText('');
      showToast('코멘트가 수정되었습니다.', 'success');
    } else {
      showToast('코멘트 수정에 실패했습니다.', 'error');
    }
  };

  const handleDelete = async (commentId) => {
    if (!confirm('코멘트를 삭제하시겠습니까?')) return;

    const result = await deleteComment(commentId);
    
    if (result.success) {
      showToast('코멘트가 삭제되었습니다.', 'success');
    } else {
      showToast('코멘트 삭제에 실패했습니다.', 'error');
    }
  };

  const startEdit = (comment) => {
    setEditingId(comment.id);
    setEditText(comment.comment_text);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <MessageCircle className="w-5 h-5 mr-2" />
          코멘트 ({comments.length})
        </h3>

        {/* 코멘트 입력 폼 */}
        {user ? (
          <form onSubmit={handleSubmit} className="mb-6">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="코멘트를 입력하세요..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={submitting}
              />
              <button
                type="submit"
                disabled={!newComment.trim() || submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        ) : (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg text-gray-600 text-sm">
            로그인 후 코멘트를 작성할 수 있습니다.
          </div>
        )}

        {/* 코멘트 목록 */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              아직 코멘트가 없습니다.
            </p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="border-b border-gray-200 pb-4 last:border-0">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-medium">{comment.user_name}</span>
                    <span className="text-gray-500 text-sm ml-2">
                      {format(new Date(comment.created_at), 'yyyy.MM.dd HH:mm', { locale: ko })}
                    </span>
                  </div>
                  {user && (user.id === comment.user_id || user.email === comment.user_id) && (
                    <div className="flex space-x-1">
                      {editingId === comment.id ? (
                        <>
                          <button
                            onClick={() => handleUpdate(comment.id)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(comment)}
                            className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(comment.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
                {editingId === comment.id ? (
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                ) : (
                  <p className="text-gray-700">{comment.comment_text}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyComments;