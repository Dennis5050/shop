import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Send, Tag, Image as ImageIcon } from 'lucide-react';
import { useSocialStore } from '../../store/socialStore.js';
import { useAuthStore } from '../../store/authStore.js';
import { Avatar } from '../ui/Avatar.jsx';
import { Button } from '../ui/Button.jsx';
import { formatDistanceToNowStrict } from 'date-fns';

export function FeedView() {
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [tags, setTags] = useState('');
  const [commentInputs, setCommentInputs] = useState({});
  const [expandedComments, setExpandedComments] = useState({});

  const posts = useSocialStore((s) => s.posts);
  const isLoading = useSocialStore((s) => s.isLoading);
  const fetchFeed = useSocialStore((s) => s.fetchFeed);
  const createPost = useSocialStore((s) => s.createPost);
  const toggleLike = useSocialStore((s) => s.toggleLike);
  const activePostComments = useSocialStore((s) => s.activePostComments);
  const fetchComments = useSocialStore((s) => s.fetchComments);
  const addComment = useSocialStore((s) => s.addComment);

  const currentUser = useAuthStore((s) => s.user);

  useEffect(() => {
    fetchFeed();
  }, []);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    const parsedTags = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    await createPost(
      content.trim(),
      mediaUrl.trim(),
      mediaUrl.trim() ? 'image' : 'none',
      parsedTags
    );

    setContent('');
    setMediaUrl('');
    setTags('');
  };

  const handleToggleComments = (postId) => {
    const isExpanded = expandedComments[postId];
    setExpandedComments((prev) => ({ ...prev, [postId]: !isExpanded }));
    if (!isExpanded) {
      fetchComments(postId);
    }
  };

  const handleAddComment = async (postId) => {
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;

    await addComment(postId, text.trim());
    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
  };

  return (
    <div className="flex-1 bg-chat-panel flex flex-col h-full overflow-y-auto p-4 md:p-8">
      <div className="max-w-2xl mx-auto w-full space-y-6">
        {/* Post Creation Box */}
        <div className="bg-chat-sidebar border border-chat-border rounded-2xl p-5 shadow-sm">
          <div className="flex gap-3">
            <Avatar
              src={currentUser?.avatar}
              name={currentUser?.displayName || currentUser?.username}
              size="md"
            />
            <form onSubmit={handleCreatePost} className="flex-1 space-y-3">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's happening in the community?"
                rows={3}
                className="w-full bg-chat-panel text-sm text-chat-bubbleText rounded-xl p-3 border border-chat-border focus:border-brand-500 outline-none resize-none placeholder:text-chat-muted/60"
              />

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="Image URL (optional)"
                  className="flex-1 bg-chat-panel text-xs text-chat-bubbleText px-3 py-2 rounded-xl border border-chat-border focus:border-brand-500 outline-none"
                />
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Tags (comma separated: dev, announcement)"
                  className="flex-1 bg-chat-panel text-xs text-chat-bubbleText px-3 py-2 rounded-xl border border-chat-border focus:border-brand-500 outline-none"
                />
              </div>

              <div className="flex justify-end pt-1">
                <Button
                  type="submit"
                  size="sm"
                  disabled={!content.trim()}
                  leftIcon={<Send className="w-3.5 h-3.5" />}
                >
                  Publish Post
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Post Stream */}
        <div className="space-y-4">
          {posts.map((post) => {
            const postId = post._id || post.id;
            const comments = activePostComments[postId] || [];
            const isCommentsOpen = Boolean(expandedComments[postId]);
            const formattedTime = post.createdAt
              ? formatDistanceToNowStrict(new Date(post.createdAt), { addSuffix: true })
              : 'just now';

            return (
              <div
                key={postId}
                className="bg-chat-sidebar border border-chat-border rounded-2xl p-5 space-y-4 shadow-sm"
              >
                {/* Author Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={post.author?.avatar}
                      name={post.author?.displayName || post.author?.username}
                      size="md"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {post.author?.displayName || post.author?.username || 'Community Member'}
                      </h4>
                      <p className="text-xs text-chat-muted">
                        @{post.author?.username} • {formattedTime}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <p className="text-sm text-chat-bubbleText whitespace-pre-wrap leading-relaxed">
                  {post.content}
                </p>

                {/* Media Attachment */}
                {post.mediaUrl && (
                  <img
                    src={post.mediaUrl}
                    alt="Post media"
                    className="rounded-xl max-h-96 w-full object-cover border border-chat-border/50"
                  />
                )}

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {post.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="text-[11px] font-semibold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-lg border border-brand-500/20"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action Bar */}
                <div className="flex items-center gap-6 pt-2 border-t border-chat-border/40 text-xs text-chat-muted">
                  <button
                    onClick={() => toggleLike(postId)}
                    className={`flex items-center gap-1.5 transition-colors ${
                      post.isLiked ? 'text-rose-500 font-semibold' : 'hover:text-rose-400'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} />
                    <span>{post.likesCount || 0}</span>
                  </button>

                  <button
                    onClick={() => handleToggleComments(postId)}
                    className="flex items-center gap-1.5 hover:text-white transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>{post.commentsCount || 0} Comments</span>
                  </button>
                </div>

                {/* Comment Section */}
                {isCommentsOpen && (
                  <div className="pt-3 border-t border-chat-border/30 space-y-3">
                    {/* Add Comment Input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={commentInputs[postId] || ''}
                        onChange={(e) =>
                          setCommentInputs((prev) => ({ ...prev, [postId]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddComment(postId);
                        }}
                        placeholder="Write a comment..."
                        className="flex-1 bg-chat-panel text-xs text-chat-bubbleText px-3 py-2 rounded-xl border border-chat-border focus:border-brand-500 outline-none"
                      />
                      <Button size="sm" onClick={() => handleAddComment(postId)}>
                        Reply
                      </Button>
                    </div>

                    {/* Comments List */}
                    <div className="space-y-2.5 pt-2">
                      {comments.map((comment) => (
                        <div
                          key={comment._id || comment.id}
                          className="bg-chat-panel/60 p-3 rounded-xl border border-chat-border/40 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-white">
                              {comment.author?.displayName || comment.author?.username}
                            </span>
                            <span className="text-[10px] text-chat-muted">
                              {comment.createdAt
                                ? formatDistanceToNowStrict(new Date(comment.createdAt), { addSuffix: true })
                                : ''}
                            </span>
                          </div>
                          <p className="text-chat-bubbleText">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default FeedView;
