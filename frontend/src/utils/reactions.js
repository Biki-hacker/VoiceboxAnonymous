// Key format: "commentId_reactionType"
// Example: "abc123_like"

export const hasReacted = (commentId, type) => {
  const reacted = JSON.parse(localStorage.getItem('reactions') || '{}');
  return reacted[`${commentId}_${type}`] === true;
};

export const toggleReaction = (commentId, type) => {
  const key = `${commentId}_${type}`;
  const reacted = JSON.parse(localStorage.getItem('reactions') || '{}');

  if (reacted[key]) {
    delete reacted[key]; // undo
  } else {
    reacted[key] = true; // add
  }

  localStorage.setItem('reactions', JSON.stringify(reacted));
};
