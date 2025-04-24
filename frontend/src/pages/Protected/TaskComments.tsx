import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  id: string;
  name: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  userId: string;
  user: User;
}

interface TaskCommentsProps {
  taskId: string;
  currentUser: {
    userId: string;
    name: string;
  };
  isTaskCreator?: boolean;
  isTeamManager?: boolean;
}

const TaskComments: React.FC<TaskCommentsProps> = ({ 
  taskId, 
  currentUser,
  isTaskCreator = false,
  isTeamManager = false
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchComments();
  }, [taskId]);

  const fetchComments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/tasks/${taskId}/comments`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setComments(response.data.comments);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch comments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.post(
        `/api/tasks/${taskId}/comments`,
        { content: newComment },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      // Add the new comment to the list
      setComments([response.data.comment, ...comments]);
      setNewComment('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add comment');
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
  };

  const cancelEditing = () => {
    setEditingCommentId(null);
    setEditContent('');
  };

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.put(
        `/api/comments/${commentId}`,
        { content: editContent },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      // Update the comment in the list
      setComments(comments.map(comment => 
        comment.id === commentId ? response.data.comment : comment
      ));
      setEditingCommentId(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update comment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    
    setIsLoading(true);
    setError(null);
    try {
      await axios.delete(`/api/comments/${commentId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Remove the comment from the list
      setComments(comments.filter(comment => comment.id !== commentId));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete comment');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const canEditComment = (comment: Comment) => {
    return isTeamManager || comment.userId === currentUser.userId;
  };

  const canDeleteComment = (comment: Comment) => {
    return isTeamManager || comment.userId === currentUser.userId;
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Comments</h2>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* Add comment form */}
      <form onSubmit={handleAddComment} className="mb-6">
        <div className="flex flex-col">
          <textarea
            className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
            rows={3}
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={isLoading}
          />
          <button
            type="submit"
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300"
            disabled={isLoading || !newComment.trim()}
          >
            {isLoading ? 'Posting...' : 'Post Comment'}
          </button>
        </div>
      </form>
      
      {/* Comments list */}
      <div className="space-y-4">
        {isLoading && !comments.length ? (
          <div className="text-center py-4">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="text-center py-4 text-gray-500">No comments yet</div>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="bg-gray-50 rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="font-medium">{comment.user.name}</div>
                <div className="text-sm text-gray-500">
                  {formatDate(comment.createdAt)}
                  {comment.updatedAt && comment.updatedAt !== comment.createdAt && ' (edited)'}
                </div>
              </div>
              
              {editingCommentId === comment.id ? (
                <div className="mt-2">
                  <textarea
                    className="w-full p-2 border rounded-lg resize-none focus:ring-2 focus:ring-blue-300"
                    rows={3}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    disabled={isLoading}
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleEditComment(comment.id)}
                      className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300"
                      disabled={isLoading || !editContent.trim()}
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="px-3 py-1 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mt-1">{comment.content}</div>
                  {canEditComment(comment) && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => startEditing(comment)}
                        className="text-sm text-blue-500 hover:text-blue-700"
                        disabled={isLoading}
                      >
                        Edit
                      </button>
                      {canDeleteComment(comment) && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-sm text-red-500 hover:text-red-700"
                          disabled={isLoading}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TaskComments;