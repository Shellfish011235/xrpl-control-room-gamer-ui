import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, Upload, Link as LinkIcon, Check } from 'lucide-react';
import { useProfileStore } from '../store/profileStore';

interface ProfilePictureUploadProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ProfilePictureUpload({ size = 'lg', className = '' }: ProfilePictureUploadProps) {
  const { profileImage, setProfileImage } = useProfileStore();
  const [showModal, setShowModal] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-full aspect-square max-w-[180px]'
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setPreviewImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      setPreviewImage(urlInput.trim());
    }
  };

  const handleSave = () => {
    if (previewImage) {
      setProfileImage(previewImage);
      setShowModal(false);
      setPreviewImage(null);
      setUrlInput('');
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setPreviewImage(null);
    setUrlInput('');
  };

  return (
    <>
      {/* Profile Picture Display */}
      <div 
        className={`relative ${sizeClasses[size]} mx-auto rounded-lg overflow-hidden border-2 border-cyber-border cursor-pointer group ${className}`}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={() => setShowModal(true)}
      >
        {/* Image or Placeholder */}
        {profileImage ? (
          <img 
            src={profileImage} 
            alt="Profile" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-cyber-glow/20 via-cyber-purple/20 to-cyber-navy flex items-center justify-center">
            <Camera size={40} className="text-cyber-glow/60" />
          </div>
        )}
        
        {/* Hover Overlay */}
        <motion.div 
          className="absolute inset-0 bg-cyber-darker/80 flex flex-col items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovering ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <Camera size={24} className="text-cyber-glow mb-2" />
          <span className="text-xs text-cyber-glow font-cyber">CHANGE</span>
        </motion.div>
        
        {/* Glow Border Effect */}
        <div className="absolute inset-0 border-2 border-cyber-glow/0 group-hover:border-cyber-glow/50 transition-colors rounded-lg pointer-events-none" />
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCancel}
          >
            <motion.div
              className="cyber-panel cyber-glow w-full max-w-md p-6"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-cyber text-lg text-cyber-glow tracking-wider">
                  CHANGE PROFILE PICTURE
                </h3>
                <button 
                  onClick={handleCancel}
                  className="p-2 hover:bg-cyber-glow/10 rounded transition-colors"
                >
                  <X size={20} className="text-cyber-muted" />
                </button>
              </div>

              {/* Preview */}
              <div className="mb-6">
                <div className="w-32 h-32 mx-auto rounded-lg overflow-hidden border-2 border-cyber-border">
                  {previewImage ? (
                    <img 
                      src={previewImage} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                      onError={() => setPreviewImage(null)}
                    />
                  ) : profileImage ? (
                    <img 
                      src={profileImage} 
                      alt="Current" 
                      className="w-full h-full object-cover opacity-50"
                    />
                  ) : (
                    <div className="w-full h-full bg-cyber-darker flex items-center justify-center">
                      <Camera size={32} className="text-cyber-muted" />
                    </div>
                  )}
                </div>
                {previewImage && (
                  <p className="text-center text-xs text-cyber-green mt-2">Preview ready!</p>
                )}
              </div>

              {/* Tabs */}
              <div className="flex mb-4 border-b border-cyber-border">
                <button
                  className={`flex-1 py-2 text-sm font-cyber tracking-wider transition-colors ${
                    activeTab === 'upload' 
                      ? 'text-cyber-glow border-b-2 border-cyber-glow' 
                      : 'text-cyber-muted hover:text-cyber-text'
                  }`}
                  onClick={() => setActiveTab('upload')}
                >
                  <Upload size={14} className="inline mr-2" />
                  UPLOAD
                </button>
                <button
                  className={`flex-1 py-2 text-sm font-cyber tracking-wider transition-colors ${
                    activeTab === 'url' 
                      ? 'text-cyber-glow border-b-2 border-cyber-glow' 
                      : 'text-cyber-muted hover:text-cyber-text'
                  }`}
                  onClick={() => setActiveTab('url')}
                >
                  <LinkIcon size={14} className="inline mr-2" />
                  URL
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === 'upload' ? (
                <div className="space-y-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-4 border-2 border-dashed border-cyber-border rounded-lg hover:border-cyber-glow/50 hover:bg-cyber-glow/5 transition-colors"
                  >
                    <Upload size={24} className="mx-auto mb-2 text-cyber-muted" />
                    <p className="text-sm text-cyber-text">Click to upload an image</p>
                    <p className="text-xs text-cyber-muted mt-1">PNG, JPG, GIF up to 5MB</p>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-cyber-muted block mb-2">Image URL</label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="https://example.com/image.png"
                        className="flex-1 bg-cyber-darker border border-cyber-border rounded px-3 py-2 text-sm text-cyber-text placeholder:text-cyber-muted focus:border-cyber-glow focus:outline-none"
                      />
                      <button
                        onClick={handleUrlSubmit}
                        className="px-4 py-2 bg-cyber-glow/20 border border-cyber-glow/50 rounded text-cyber-glow hover:bg-cyber-glow/30 transition-colors"
                      >
                        <Check size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCancel}
                  className="flex-1 py-2 border border-cyber-border rounded text-cyber-muted hover:text-cyber-text hover:border-cyber-muted transition-colors font-cyber text-sm"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleSave}
                  disabled={!previewImage}
                  className={`flex-1 py-2 rounded font-cyber text-sm transition-all ${
                    previewImage 
                      ? 'bg-cyber-glow/20 border border-cyber-glow text-cyber-glow hover:bg-cyber-glow/30' 
                      : 'bg-cyber-darker border border-cyber-border text-cyber-muted cursor-not-allowed'
                  }`}
                >
                  SAVE
                </button>
              </div>

              {/* Remove button */}
              {profileImage && (
                <button
                  onClick={() => {
                    setProfileImage(null);
                    setShowModal(false);
                  }}
                  className="w-full mt-3 py-2 text-xs text-cyber-red hover:text-cyber-red/80 transition-colors"
                >
                  Remove profile picture
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
