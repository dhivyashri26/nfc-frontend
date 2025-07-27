import React, { useState } from 'react';
import UpgradeModal from './UpgradeModal';

function ContactForm({ profileId, onSuccess }) {
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('');
    setIsSubmitting(true);

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/contact/exchange/${profileId}`);
      if (response.status === 200) {
        setStatus('success');
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      if (error.response?.status === 403) {
        setStatus('limit');
        setIsModalOpen(true);
      } else {
        setStatus('error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        {/* ... your fields */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-black text-white p-2 rounded-md"
        >
          {isSubmitting ? 'Sharing...' : 'Exchange Contact'}
        </button>
      </form>

      {status === 'success' && (
        <p className="text-green-600 mt-2">Contact shared successfully!</p>
      )}
      {status === 'error' && (
        <p className="text-red-600 mt-2">Something went wrong. Please try again.</p>
      )}

      <UpgradeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}

export default ContactForm; 