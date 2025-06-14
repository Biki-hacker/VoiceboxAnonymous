import React, { useState, useEffect } from 'react';
import { decryptContent } from '../utils/crypto';

const DecryptedContent = ({ 
  content, 
  children, 
  loadingComponent = <span className="text-gray-400">Loading...</span>,
  errorComponent = (error) => (
    <span className="text-red-500">Error loading content: {error}</span>
  )
}) => {
  const [state, setState] = useState({
    decrypted: null,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    let isMounted = true;
    let abortController = new AbortController();
    
    const decrypt = async () => {
      if (!isMounted) return;
      
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      try {
        // If content is already a string, no need to decrypt
        if (typeof content === 'string') {
          if (isMounted) {
            setState({
              decrypted: content,
              isLoading: false,
              error: null
            });
          }
          return;
        }
        
        // If content is an encrypted object, decrypt it
        if (content?.iv && content?.content) {
          const result = await decryptContent(content, { signal: abortController.signal });
          if (isMounted) {
            setState({
              decrypted: result,
              isLoading: false,
              error: null
            });
          }
          return;
        }
        
        // If content is null/undefined, return empty string
        if (content == null) {
          if (isMounted) {
            setState({
              decrypted: '',
              isLoading: false,
              error: null
            });
          }
          return;
        }
        
        throw new Error('Unsupported content format');
        
      } catch (error) {
        if (error.name === 'AbortError') return;
        
        if (isMounted) {
          console.error('Error decrypting content:', error);
          setState({
            decrypted: null,
            isLoading: false,
            error: error.message || 'Failed to decrypt content'
          });
        }
      }
    };
    
    // Only attempt to decrypt if we have content
    if (content !== undefined) {
      decrypt();
    } else {
      setState({
        decrypted: '',
        isLoading: false,
        error: null
      });
    }
    
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [content]);
  
  if (state.isLoading) return loadingComponent;
  if (state.error) return errorComponent(state.error);
  
  return children(state.decrypted || '');
};

export default DecryptedContent;
