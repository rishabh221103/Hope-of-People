import React, { useState, useEffect } from 'react';
import { X, Upload, Video, AlertCircle, Link as LinkIcon, Film, CheckCircle } from 'lucide-react';
import { reelService, ReelItem } from '../services/reelService';
import { assistanceService, AssistanceRequestItem } from '../services/assistanceService';
import { businessService, BusinessCampaignItem } from '../services/businessService';

interface CreateReelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (newReel: ReelItem) => void;
}

export const CreateReelModal: React.FC<CreateReelModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [caption, setCaption] = useState<string>('');
  const [selectedCauseId, setSelectedCauseId] = useState<string>('');
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('');
  const [causes, setCauses] = useState<AssistanceRequestItem[]>([]);
  const [businesses, setBusinesses] = useState<BusinessCampaignItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Load public causes & business campaigns for linking
      assistanceService.getPublicRequests()
        .then(setCauses)
        .catch(() => {});
      businessService.getCampaigns()
        .then(setBusinesses)
        .catch(() => {});
    }
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        setError('Please select a valid video file (MP4, WebM, MOV).');
        return;
      }
      setVideoFile(file);
      setPreviewSrc(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption.trim()) {
      setError('Please provide a caption or description for your reel.');
      return;
    }

    if (activeTab === 'upload' && !videoFile) {
      setError('Please choose a video file to upload.');
      return;
    }

    if (activeTab === 'url' && !videoUrl.trim()) {
      setError('Please enter a valid video URL.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let created: ReelItem;
      const causeIdNum = selectedCauseId ? parseInt(selectedCauseId, 10) : undefined;
      const bizIdNum = selectedBusinessId ? parseInt(selectedBusinessId, 10) : undefined;

      if (activeTab === 'upload' && videoFile) {
        const formData = new FormData();
        formData.append('video', videoFile);
        formData.append('caption', caption.trim());
        if (causeIdNum) formData.append('assistanceRequestId', causeIdNum.toString());
        if (bizIdNum) formData.append('businessCampaignId', bizIdNum.toString());

        created = await reelService.uploadReelVideo(formData);
      } else {
        created = await reelService.createReel({
          videoUrl: videoUrl.trim(),
          caption: caption.trim(),
          assistanceRequestId: causeIdNum,
          businessCampaignId: bizIdNum,
          durationSeconds: 15,
        });
      }

      onCreated(created);
      handleClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to create reel.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setVideoFile(null);
    setVideoUrl('');
    setCaption('');
    setSelectedCauseId('');
    setSelectedBusinessId('');
    setPreviewSrc(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-tr from-pink-500 to-rose-600 rounded-lg text-white">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Post a Reel</h2>
              <p className="text-xs text-slate-400">Share video proof, updates, or stories of impact</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2.5 text-rose-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Mode Switcher */}
          <div className="flex bg-slate-800/80 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${
                activeTab === 'upload'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Video File
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${
                activeTab === 'url'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              Video URL
            </button>
          </div>

          {/* Video Input */}
          {activeTab === 'upload' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Select Video (MP4 / WebM / MOV)
              </label>
              <label className="border-2 border-dashed border-slate-700 hover:border-rose-500 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition bg-slate-950/40">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {previewSrc ? (
                  <div className="w-full flex flex-col items-center gap-3">
                    <video
                      src={previewSrc}
                      className="max-h-48 rounded-lg object-contain bg-black"
                      controls
                    />
                    <span className="text-xs text-rose-400 font-medium">Click to replace video file</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-slate-400 mb-2" />
                    <span className="text-sm font-medium text-slate-300">Click to choose a vertical short video</span>
                    <span className="text-xs text-slate-500 mt-1">Max 50MB • Recommended 9:16 vertical ratio</span>
                  </>
                )}
              </label>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Video Direct Link (MP4)
              </label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://example.com/videos/impact-story.mp4"
                className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 text-sm"
              />
            </div>
          )}

          {/* Caption */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Caption & Impact Story *
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
              placeholder="Tell donors what this video shows (e.g. 'Thank you all! Wheelchair delivered to patient in Evanston today #HopeOfPeople')..."
              className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 text-sm resize-none"
            />
          </div>

          {/* Link to Cause */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-rose-400" />
                Link Assistance Cause
              </label>
              <select
                value={selectedCauseId}
                onChange={(e) => {
                  setSelectedCauseId(e.target.value);
                  if (e.target.value) setSelectedBusinessId('');
                }}
                className="w-full px-3 py-2.5 bg-slate-950/60 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-rose-500"
              >
                <option value="">-- None (General Reel) --</option>
                {causes.map((c) => (
                  <option key={c.id} value={c.id}>
                    #{c.id} - {c.title.length > 28 ? c.title.substring(0, 28) + '...' : c.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-blue-400" />
                Link Business Campaign
              </label>
              <select
                value={selectedBusinessId}
                onChange={(e) => {
                  setSelectedBusinessId(e.target.value);
                  if (e.target.value) setSelectedCauseId('');
                }}
                className="w-full px-3 py-2.5 bg-slate-950/60 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
              >
                <option value="">-- None (General Reel) --</option>
                {businesses.map((b) => (
                  <option key={b.id} value={b.id}>
                    #{b.id} - {b.businessName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex justify-end gap-3 bg-slate-950/60">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-sm font-medium transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white text-sm font-semibold shadow-lg shadow-rose-500/25 disabled:opacity-50 flex items-center gap-2 transition"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Publishing Reel...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Publish Reel
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
