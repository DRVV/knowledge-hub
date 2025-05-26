'use client';

import React, { useState } from 'react';
import { Star, ThumbsUp, ThumbsDown, MessageSquare, Send } from 'lucide-react';

interface FeedbackDialogProps {
  isOpen: boolean;
  onClose: () => void;
  traceId?: string;
  sessionId: string;
  onFeedbackSubmitted?: () => void;
}

const FeedbackDialog: React.FC<FeedbackDialogProps> = ({
  isOpen,
  onClose,
  traceId,
  sessionId,
  onFeedbackSubmitted,
}) => {
  const [score, setScore] = useState<number>(0);
  const [hoveredStar, setHoveredStar] = useState<number>(0);
  const [useful, setUseful] = useState<boolean | null>(null);
  const [accuracy, setAccuracy] = useState<number>(5);
  const [completeness, setCompleteness] = useState<number>(5);
  const [graphQuality, setGraphQuality] = useState<'poor' | 'fair' | 'good' | 'excellent'>('good');
  const [comment, setComment] = useState<string>('');
  const [improvements, setImprovements] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);

  const improvementOptions = [
    'More accurate relationships',
    'Better node categorization',
    'Clearer node labels',
    'Improved layout',
    'More detailed descriptions',
    'Better edge types',
    'Reduced complexity',
    'More comprehensive coverage',
  ];

  const handleImprovementToggle = (improvement: string) => {
    setImprovements(prev => 
      prev.includes(improvement)
        ? prev.filter(i => i !== improvement)
        : [...prev, improvement]
    );
  };

  const handleSubmit = async () => {
    if (!traceId) {
      console.warn('No trace ID available for feedback');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          traceId,
          sessionId,
          score: score || undefined,
          comment,
          useful,
          accuracy,
          completeness,
          graphQuality,
          improvements,
        }),
      });

      if (response.ok) {
        setSubmitted(true);
        onFeedbackSubmitted?.();
        setTimeout(() => {
          onClose();
          resetForm();
        }, 2000);
      } else {
        console.error('Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setScore(0);
    setHoveredStar(0);
    setUseful(null);
    setAccuracy(5);
    setCompleteness(5);
    setGraphQuality('good');
    setComment('');
    setImprovements([]);
    setSubmitted(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Rate This Knowledge Graph
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {submitted ? (
            <div className="text-center py-8">
              <div className="text-green-600 text-4xl mb-4">✓</div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Thank you for your feedback!
              </h4>
              <p className="text-gray-600">
                Your input helps us improve our graph generation.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Overall Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Overall Rating
                </label>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      className={`text-2xl ${
                        star <= (hoveredStar || score)
                          ? 'text-yellow-400'
                          : 'text-gray-300'
                      } hover:text-yellow-400 transition-colors`}
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      onClick={() => setScore(star)}
                    >
                      <Star fill="currentColor" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Usefulness */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Was this graph useful?
                </label>
                <div className="flex space-x-4">
                  <button
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${
                      useful === true
                        ? 'bg-green-50 border-green-300 text-green-700'
                        : 'bg-gray-50 border-gray-300 text-gray-700'
                    } hover:bg-green-50 transition-colors`}
                    onClick={() => setUseful(true)}
                  >
                    <ThumbsUp size={18} />
                    <span>Yes</span>
                  </button>
                  <button
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${
                      useful === false
                        ? 'bg-red-50 border-red-300 text-red-700'
                        : 'bg-gray-50 border-gray-300 text-gray-700'
                    } hover:bg-red-50 transition-colors`}
                    onClick={() => setUseful(false)}
                  >
                    <ThumbsDown size={18} />
                    <span>No</span>
                  </button>
                </div>
              </div>

              {/* Quality Assessment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Graph Quality
                </label>
                <select
                  value={graphQuality}
                  onChange={(e) => setGraphQuality(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="poor">Poor</option>
                  <option value="fair">Fair</option>
                  <option value="good">Good</option>
                  <option value="excellent">Excellent</option>
                </select>
              </div>

              {/* Accuracy & Completeness Sliders */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Accuracy: {accuracy}/10
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={accuracy}
                    onChange={(e) => setAccuracy(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Completeness: {completeness}/10
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={completeness}
                    onChange={(e) => setCompleteness(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Improvements */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Areas for Improvement (select all that apply)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {improvementOptions.map((improvement) => (
                    <label
                      key={improvement}
                      className="flex items-center space-x-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={improvements.includes(improvement)}
                        onChange={() => handleImprovementToggle(improvement)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-700">{improvement}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Comments */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Comments (Optional)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your thoughts on the generated graph..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !traceId}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Send size={16} />
                  )}
                  <span>{isSubmitting ? 'Submitting...' : 'Submit Feedback'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackDialog;
