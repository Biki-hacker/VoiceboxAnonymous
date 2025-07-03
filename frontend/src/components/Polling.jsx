import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from './common/Modal';
import { ExclamationTriangleIcon, PlusIcon, TrashIcon, PencilSquareIcon, StopIcon, PlayIcon, ChartBarIcon, ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline';
import useTheme from '../hooks/useTheme';
import { api } from '../api/axios';
import useWebSocket from '../hooks/useWebSocket';
import DeletionConfirmation from './DeletionConfirmation';
// import { encrypt } from '../utils/crypto'; // Uncomment if encryption util exists

const MAX_OPTIONS = 5;
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:5000';

const Polling = ({
  userRole, // 'admin' or 'employee'
  orgId,
  onBack,
  ...props
}) => {
  const [theme] = useTheme();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStopModal, setShowStopModal] = useState(false);
  const [editingPoll, setEditingPoll] = useState(null);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState({}); // pollId -> optionId
  const [voteError, setVoteError] = useState('');
  const [polls, setPolls] = useState([]);
  const [pollsToShow, setPollsToShow] = useState(5);
  const orgIdRef = useRef(orgId);
  const [pollToDelete, setPollToDelete] = useState(null);
  const [isDeletingPoll, setIsDeletingPoll] = useState(false);

  useEffect(() => { orgIdRef.current = orgId; }, [orgId]);

  // Reset pollsToShow when polls change
  useEffect(() => {
    setPollsToShow(5);
  }, [polls.length]);

  // --- Fetch Polls ---
  const fetchPolls = useCallback(async () => {
    if (!orgId) return;
    try {
      const res = await api.get(`/posts/polls/org/${orgId}`);
      setPolls(res.data || []);
    } catch (err) {
      setError('Failed to fetch polls.');
    }
  }, [orgId]);

  useEffect(() => { fetchPolls(); }, [fetchPolls]);

  // --- WebSocket Message Handler ---
  const handleWsMessage = useCallback((msg) => {
    if (!msg || typeof msg !== 'object') return;
    switch (msg.type) {
      case 'POLL_CREATED':
      case 'POLL_UPDATED':
      case 'POLL_VOTED':
      case 'POLL_STOPPED': {
        if (msg.payload && msg.payload.organization === orgIdRef.current) {
          setPolls((prev) => {
            const idx = prev.findIndex(p => p._id === msg.payload._id);
            if (idx !== -1) {
              const updated = [...prev];
              updated[idx] = msg.payload;
              return updated;
            } else {
              return [msg.payload, ...prev];
            }
          });
        }
        break;
      }
      case 'POLL_DELETED': {
        if (msg.payload && msg.payload.organization === orgIdRef.current) {
          setPolls((prev) => prev.filter(p => p._id !== msg.payload.pollId));
        }
        break;
      }
      default:
        break;
    }
  }, []);

  // --- WebSocket Hook ---
  const { sendMessage } = useWebSocket(
    WS_URL,
    handleWsMessage,
    useCallback((event) => {
      // On open, send authentication message if orgId and userRole are present
      if (orgId && userRole && event?.target?.readyState === WebSocket.OPEN) {
        event.target.send(JSON.stringify({
          type: 'AUTH',
          organizationId: orgId,
          role: userRole,
          token: localStorage.getItem('token')
        }));
      }
    }, [orgId, userRole]),
    undefined,
    undefined
  );

  // --- Handlers for Admin ---
  const openCreateModal = () => {
    setQuestion('');
    setOptions(['', '']);
    setEditingPoll(null);
    setShowCreateModal(true);
    setError('');
  };
  const openEditModal = (poll) => {
    setEditingPoll(poll);
    setQuestion(poll.pollQuestion || '');
    setOptions(poll.pollOptions ? poll.pollOptions.map(opt => typeof opt.text === 'string' ? opt.text : (opt.text?.content || '')) : ['', '']);
    setShowEditModal(true);
    setError('');
  };
  const handleAddOption = () => {
    if (options.length < MAX_OPTIONS) setOptions([...options, '']);
  };
  const handleRemoveOption = (idx) => {
    if (options.length > 2) setOptions(options.filter((_, i) => i !== idx));
  };
  const handleOptionChange = (idx, value) => {
    setOptions(options.map((opt, i) => (i === idx ? value : opt)));
  };
  const handleCreateOrEditPoll = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      const payload = {
        orgId,
        pollQuestion: question,
        pollOptions: options,
        postType: 'poll',
        content: '[poll]',
      };
      if (editingPoll) {
        await api.put(`/posts/polls/${editingPoll._id}`, payload);
      } else {
        await api.post('/posts/polls', payload);
      }
      setShowCreateModal(false);
      setShowEditModal(false);
      fetchPolls();
    } catch (err) {
      setError('Failed to save poll.');
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleDeletePoll = (poll) => {
    setPollToDelete(poll);
  };
  const confirmDeletePoll = async () => {
    if (!pollToDelete) return;
    setIsDeletingPoll(true);
    try {
      await api.delete(`/posts/polls/${pollToDelete._id}`);
      setPollToDelete(null);
      fetchPolls();
    } catch (err) {
      setError('Failed to delete poll.');
    } finally {
      setIsDeletingPoll(false);
    }
  };
  const handleStopPoll = async (poll) => {
    setIsSubmitting(true);
    try {
      await api.post(`/posts/polls/${poll._id}/stop`);
      setShowStopModal(false);
      fetchPolls();
    } catch (err) {
      setError('Failed to stop poll.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Handlers for Employee ---
  const handleVote = async (poll, optionId) => {
    setIsSubmitting(true);
    setVoteError('');
    try {
      await api.post(`/posts/polls/${poll._id}/vote`, { optionId });
      setSelectedOptions(prev => ({ ...prev, [poll._id]: optionId }));
      fetchPolls();
    } catch (err) {
      setVoteError('Failed to vote.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- UI ---
  const pollCard = (poll) => (
    <motion.div
      key={poll._id}
      className={`bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm p-4 mb-4`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold text-gray-900 dark:text-slate-100">{poll.pollQuestion}</div>
        {userRole === 'admin' && (
          <div className="flex gap-2">
            {poll.pollStatus === 'active' && (
              <>
                <button onClick={() => openEditModal(poll)} className="p-1 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"><PencilSquareIcon className="h-5 w-5" /></button>
                <button onClick={() => setShowStopModal(poll)} className="p-1 text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded"><StopIcon className="h-5 w-5" /></button>
              </>
            )}
            <button onClick={() => handleDeletePoll(poll)} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"><TrashIcon className="h-5 w-5" /></button>
          </div>
        )}
      </div>
      <div className="space-y-2">
        {poll.pollOptions && poll.pollOptions.map((opt, idx) => (
          <div key={opt._id || idx} className="flex items-center gap-2">
            {userRole === 'employee' && poll.pollStatus === 'active' ? (
              <button
                disabled={isSubmitting || selectedOptions[poll._id] === opt._id || poll.pollVotes?.some(v => v.user === (window.userId || ''))}
                onClick={() => handleVote(poll, opt._id)}
                className={`flex-1 px-3 py-2 rounded border ${selectedOptions[poll._id] === opt._id ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white'} transition`}
              >
                {typeof opt.text === 'string' ? opt.text : (opt.text?.content || '')}
              </button>
            ) : (
              <div className="flex-1 px-3 py-2 rounded bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white">{typeof opt.text === 'string' ? opt.text : (opt.text?.content || '')}</div>
            )}
            {/* Show voting stats for admin always, for employees if stopped or voted */}
            {(userRole === 'admin' || poll.pollStatus === 'stopped' || selectedOptions[poll._id]) && (
              <div className="w-28 text-right text-xs text-gray-500 dark:text-slate-400">
                {opt.voteCount} votes
                {Array.isArray(poll.pollOptions) && poll.pollOptions.length > 0 && (
                  <span className="ml-1">
                    (
                    {Math.round(
                      (opt.voteCount /
                        (poll.pollOptions.reduce((sum, o) => sum + (o.voteCount || 0), 0) || 1)) *
                        100
                    ) || 0}
                    %)
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      {poll.pollStatus === 'stopped' && (
        <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">Poll stopped</div>
      )}
      {voteError && <div className="text-xs text-red-500 mt-2">{voteError}</div>}
    </motion.div>
  );

  // --- Main Render ---
  return (
    <div className="w-full max-w-2xl mx-auto" {...props}>
      {/* Back to Dashboard Button */}
      <div className="mb-4 flex items-center">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-2"
        >
          <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-2" />
          <span className="text-base font-semibold">Back to Dashboard</span>
        </button>
      </div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2"><ChartBarIcon className="h-6 w-6" /> Polls</h2>
        {userRole === 'admin' && (
          <button onClick={openCreateModal} className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"><PlusIcon className="h-5 w-5 mr-1" /> New Poll</button>
        )}
      </div>
      {/* List of polls */}
      <div>
        {polls && polls.length > 0 ? (
          <>
            {polls.slice(0, pollsToShow).map(pollCard)}
            {pollsToShow < polls.length && (
              <div className="flex justify-center mt-4">
                <button
                  onClick={() => setPollsToShow(pollsToShow + 5)}
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
                >
                  Load more...
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-gray-500 dark:text-slate-400 text-center py-8">No polls found.</div>
        )}
      </div>
      {/* Create/Edit Modal */}
      <Modal isOpen={showCreateModal || showEditModal} onClose={() => { setShowCreateModal(false); setShowEditModal(false); }} title={editingPoll ? 'Edit Poll' : 'Create Poll'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Poll Question</label>
            <input type="text" className="w-full border rounded p-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-white" value={question} onChange={e => setQuestion(e.target.value)} maxLength={200} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Options (2-5)</label>
            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2 mb-2">
                <input type="text" className="flex-1 border rounded p-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-white" value={opt} onChange={e => handleOptionChange(idx, e.target.value)} maxLength={100} />
                {options.length > 2 && <button onClick={() => handleRemoveOption(idx)} className="p-1 text-red-500"><TrashIcon className="h-4 w-4" /></button>}
              </div>
            ))}
            {options.length < MAX_OPTIONS && <button onClick={handleAddOption} className="mt-2 px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200 rounded text-xs">Add Option</button>}
          </div>
          {error && <div className="text-xs text-red-500">{error}</div>}
          <div className="flex justify-end gap-2">
            <button onClick={() => { setShowCreateModal(false); setShowEditModal(false); }} className="px-4 py-2 rounded bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-white">Cancel</button>
            <button onClick={handleCreateOrEditPoll} disabled={isSubmitting || !question.trim() || options.some(opt => !opt.trim())} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">{isSubmitting ? 'Saving...' : (editingPoll ? 'Save Changes' : 'Create Poll')}</button>
          </div>
        </div>
      </Modal>
      {/* Stop Poll Confirmation Modal */}
      <Modal isOpen={!!showStopModal} onClose={() => setShowStopModal(false)} title="Stop Poll?">
        <div className="py-4">
          <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
          <div className="text-center mb-4 text-gray-900 dark:text-white">Are you sure you want to stop this poll? This action cannot be undone.</div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowStopModal(false)} className="px-4 py-2 rounded bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-white">Cancel</button>
            <button onClick={() => handleStopPoll(showStopModal)} disabled={isSubmitting} className="px-4 py-2 rounded bg-yellow-600 text-white hover:bg-yellow-700 disabled:opacity-50">{isSubmitting ? 'Stopping...' : 'Stop Poll'}</button>
          </div>
        </div>
      </Modal>
      <DeletionConfirmation
        isOpen={!!pollToDelete}
        onClose={() => setPollToDelete(null)}
        title="Delete Poll"
        itemType="poll"
        itemPreview={typeof pollToDelete?.pollQuestion === 'string' ? pollToDelete.pollQuestion : (pollToDelete?.pollQuestion?.content || '')}
        isDeleting={isDeletingPoll}
        onConfirm={confirmDeletePoll}
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
      />
    </div>
  );
};

export default Polling; 