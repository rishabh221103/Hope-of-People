import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  businessService,
  BusinessCampaignItem,
  CreateCampaignPayload,
} from '../services/businessService';
import { ConnectButton } from '../components/ConnectButton';
import {
  Briefcase,
  TrendingUp,
  PlusCircle,
  Wrench,
  CheckCircle,
  Circle,
  MapPin,
  DollarSign,
  Search,
  Loader2,
  X,
} from 'lucide-react';

const INDUSTRIES = [
  { id: 'ALL', label: 'All Industries' },
  { id: 'FOOD_AND_BEVERAGE', label: 'Food & Culinary' },
  { id: 'TAILORING_TEXTILE', label: 'Tailoring & Textiles' },
  { id: 'CARPENTRY_CRAFTS', label: 'Crafts & Carpentry' },
  { id: 'RETAIL_GROCERY', label: 'Retail & Stalls' },
  { id: 'TECH_REPAIR', label: 'Repairs & Tech' },
  { id: 'AGRICULTURE', label: 'Farming & Livestock' },
  { id: 'SERVICES', label: 'Local Services' },
];

export const BusinessHubPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'browse' | 'create' | 'my'>('browse');
  const [campaigns, setCampaigns] = useState<BusinessCampaignItem[]>([]);
  const [myCampaigns, setMyCampaigns] = useState<BusinessCampaignItem[]>([]);
  const [selectedIndustry, setSelectedIndustry] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedCampaignForFunding, setSelectedCampaignForFunding] = useState<BusinessCampaignItem | null>(null);
  const [fundingAmount, setFundingAmount] = useState<string>('50');
  const [fundingMessage, setFundingMessage] = useState<string>('');
  const [isMentorOffer, setIsMentorOffer] = useState<boolean>(false);
  const [fundingLoading, setFundingLoading] = useState<boolean>(false);

  const [selectedCampaignForMilestones, setSelectedCampaignForMilestones] = useState<BusinessCampaignItem | null>(null);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDesc, setNewMilestoneDesc] = useState('');
  const [milestoneSubmitting, setMilestoneSubmitting] = useState(false);

  // New campaign form state
  const [formData, setFormData] = useState<CreateCampaignPayload>({
    businessName: '',
    industry: 'FOOD_AND_BEVERAGE',
    tagline: '',
    description: '',
    equipmentNeeded: '',
    targetAmount: 500,
    location: '',
    sustainabilityPlan: '',
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const publicData = await businessService.getCampaigns(selectedIndustry);
      setCampaigns(publicData || []);

      if (isAuthenticated) {
        const myData = await businessService.getMyCampaigns();
        setMyCampaigns(myData || []);
      }
    } catch (err: any) {
      console.error('Failed to load business campaigns', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedIndustry, isAuthenticated]);

  const handleFundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaignForFunding || !fundingAmount) return;

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setFundingLoading(true);
    try {
      await businessService.fundCampaign(selectedCampaignForFunding.id, {
        amount: Number(fundingAmount),
        message: fundingMessage.trim() || undefined,
        isMentorOffer,
      });

      setToastMessage({
        type: 'success',
        text: `Successfully contributed $${fundingAmount} towards ${selectedCampaignForFunding.businessName}!`,
      });
      setSelectedCampaignForFunding(null);
      setFundingAmount('50');
      setFundingMessage('');
      setIsMentorOffer(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Funding failed. Please try again.');
    } finally {
      setFundingLoading(false);
    }
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaignForMilestones || !newMilestoneTitle.trim()) return;

    setMilestoneSubmitting(true);
    try {
      const newMilestone = await businessService.addMilestone(selectedCampaignForMilestones.id, {
        title: newMilestoneTitle.trim(),
        description: newMilestoneDesc.trim() || newMilestoneTitle.trim(),
      });

      setSelectedCampaignForMilestones((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          milestones: [...(prev.milestones || []), newMilestone],
        };
      });

      setNewMilestoneTitle('');
      setNewMilestoneDesc('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to add milestone.');
    } finally {
      setMilestoneSubmitting(false);
    }
  };

  const handleCompleteMilestone = async (milestoneId: number) => {
    try {
      const updated = await businessService.completeMilestone(milestoneId);
      setSelectedCampaignForMilestones((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          milestones: (prev.milestones || []).map((m) => (m.id === milestoneId ? updated : m)),
        };
      });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to complete milestone.');
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setCreateSubmitting(true);
    try {
      await businessService.createCampaign(formData);
      setToastMessage({
        type: 'success',
        text: 'Your micro-enterprise grant proposal has been published to the Business Hub!',
      });
      setFormData({
        businessName: '',
        industry: 'FOOD_AND_BEVERAGE',
        tagline: '',
        description: '',
        equipmentNeeded: '',
        targetAmount: 500,
        location: '',
        sustainabilityPlan: '',
      });
      setActiveTab('browse');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit proposal.');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const filteredCampaigns = campaigns.filter((c) => {
    const matchSearch =
      c.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.tagline.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.equipmentNeeded.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.founderName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch;
  });

  return (
    <div className="page-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
      {/* Hero Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e3a8a 100%)',
          borderRadius: '20px',
          padding: '3rem 2.5rem',
          color: '#ffffff',
          marginBottom: '2.5rem',
          boxShadow: '0 15px 35px -10px rgba(15, 23, 42, 0.4)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ maxWidth: '720px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              padding: '0.35rem 0.85rem',
              borderRadius: '9999px',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '1rem',
              color: '#93c5fd',
            }}
          >
            <Briefcase size={14} />
            <span>HOP Business Hub & Micro-Grants</span>
          </div>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 800, margin: '0 0 0.85rem 0', letterSpacing: '-0.02em', lineHeight: 1.2, color: '#ffffff' }}>
            Empowering Financial Self-Reliance
          </h1>
          <p style={{ margin: '0 0 1.75rem 0', opacity: 0.9, fontSize: '1.05rem', lineHeight: 1.6, color: '#cbd5e1' }}>
            Transitioning families from aid dependency to sustainable ownership. Fund essential tools, equipment, and seed capital for grassroots entrepreneurs—and connect as a mentor to guide their growth.
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveTab('browse')}
              className="btn btn-primary"
              style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: 700 }}
            >
              Browse Micro-Ventures
            </button>
            <button
              onClick={() => {
                if (!isAuthenticated) navigate('/login');
                else setActiveTab('create');
              }}
              className="btn"
              style={{
                backgroundColor: 'rgba(255,255,255,0.15)',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.3)',
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                fontWeight: 700,
              }}
            >
              <PlusCircle size={17} style={{ display: 'inline', marginRight: 6 }} />
              Apply for Equipment Grant
            </button>
          </div>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div
          style={{
            padding: '1rem 1.25rem',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: toastMessage.type === 'success' ? '#ecfdf5' : '#fef2f2',
            color: toastMessage.type === 'success' ? '#065f46' : '#991b1b',
            border: `1px solid ${toastMessage.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            fontSize: '0.95rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <CheckCircle size={18} />
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Primary Tab Navigation */}
      <div
        style={{
          display: 'flex',
          borderBottom: '2px solid #e2e8f0',
          marginBottom: '2rem',
          gap: '1.5rem',
        }}
      >
        <button
          onClick={() => setActiveTab('browse')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.85rem 0.5rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'browse' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeTab === 'browse' ? '#2563eb' : '#64748b',
            fontWeight: activeTab === 'browse' ? 700 : 500,
            cursor: 'pointer',
            fontSize: '1.05rem',
            marginBottom: '-2px',
          }}
        >
          <TrendingUp size={19} />
          <span>Active Micro-Ventures ({campaigns.length})</span>
        </button>

        <button
          onClick={() => {
            if (!isAuthenticated) navigate('/login');
            else setActiveTab('create');
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.85rem 0.5rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'create' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeTab === 'create' ? '#2563eb' : '#64748b',
            fontWeight: activeTab === 'create' ? 700 : 500,
            cursor: 'pointer',
            fontSize: '1.05rem',
            marginBottom: '-2px',
          }}
        >
          <PlusCircle size={19} />
          <span>Launch a Venture (Apply for Grant)</span>
        </button>

        {isAuthenticated && (
          <button
            onClick={() => setActiveTab('my')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.85rem 0.5rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'my' ? '3px solid #2563eb' : '3px solid transparent',
              color: activeTab === 'my' ? '#2563eb' : '#64748b',
              fontWeight: activeTab === 'my' ? 700 : 500,
              cursor: 'pointer',
              fontSize: '1.05rem',
              marginBottom: '-2px',
            }}
          >
            <Briefcase size={19} />
            <span>My Ventures ({myCampaigns.length})</span>
          </button>
        )}
      </div>

      {/* TAB 1: BROWSE VENTURES */}
      {activeTab === 'browse' && (
        <div>
          {/* Industry Pills Filter */}
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
            {INDUSTRIES.map((ind) => (
              <button
                key={ind.id}
                onClick={() => setSelectedIndustry(ind.id)}
                style={{
                  padding: '0.45rem 1rem',
                  borderRadius: '9999px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  border: selectedIndustry === ind.id ? '1px solid #2563eb' : '1px solid #cbd5e1',
                  backgroundColor: selectedIndustry === ind.id ? '#2563eb' : '#ffffff',
                  color: selectedIndustry === ind.id ? '#ffffff' : '#475569',
                  transition: 'all 0.15s ease',
                }}
              >
                {ind.label}
              </button>
            ))}
          </div>

          {/* Search Header */}
          <div style={{ position: 'relative', marginBottom: '2rem' }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search by business name, equipment needed, or founder..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '42px', borderRadius: '12px', height: '46px' }}
            />
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#64748b' }}>
              <Loader2 size={36} className="animate-spin" style={{ margin: '0 auto 1rem', color: '#2563eb' }} />
              <p>Loading enterprise campaigns...</p>
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '4rem 2rem',
                backgroundColor: '#f8fafc',
                borderRadius: '16px',
                border: '1px dashed #cbd5e1',
              }}
            >
              <Briefcase size={48} style={{ color: '#94a3b8', margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1e293b' }}>
                No micro-ventures found
              </h3>
              <p style={{ color: '#64748b', maxWidth: '440px', margin: '0 auto 1.5rem', fontSize: '0.9rem' }}>
                Be the first to launch an equipment grant proposal or explore other industry categories.
              </p>
              <button
                onClick={() => {
                  if (!isAuthenticated) navigate('/login');
                  else setActiveTab('create');
                }}
                className="btn btn-primary"
                style={{ borderRadius: '9999px', padding: '0.55rem 1.35rem' }}
              >
                Apply for Equipment Grant
              </button>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                gap: '1.75rem',
              }}
            >
              {filteredCampaigns.map((camp) => {
                const raised = camp.raisedAmount || 0;
                const target = camp.targetAmount || 1;
                const pct = Math.min(100, Math.round((raised / target) * 100));
                const isFullyFunded = raised >= target || camp.status === 'FUNDED';
                const completedMilestones = (camp.milestones || []).filter((m) => m.status === 'COMPLETED').length;
                const totalMilestones = (camp.milestones || []).length;

                return (
                  <div
                    key={camp.id}
                    className="card"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: '16px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                      padding: '1.5rem',
                      justifyContent: 'space-between',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <div>
                      {/* Card Header: Industry badge & Location */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                        <span
                          style={{
                            padding: '0.2rem 0.65rem',
                            borderRadius: '9999px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            backgroundColor: '#eff6ff',
                            color: '#1d4ed8',
                            border: '1px solid #bfdbfe',
                            letterSpacing: '0.02em',
                          }}
                        >
                          {camp.industry.replace(/_/g, ' ')}
                        </span>

                        {camp.location && (
                          <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <MapPin size={12} />
                            <span>{camp.location}</span>
                          </span>
                        )}
                      </div>

                      {/* Title & Tagline */}
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.35rem 0' }}>
                        {camp.businessName}
                      </h3>
                      <p style={{ fontSize: '0.85rem', color: '#2563eb', fontWeight: 600, margin: '0 0 0.85rem 0' }}>
                        "{camp.tagline}"
                      </p>

                      {/* Founder Info & Connect */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.65rem 0.85rem',
                          backgroundColor: '#f8fafc',
                          borderRadius: '10px',
                          marginBottom: '1rem',
                        }}
                      >
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Founder & Owner</span>
                          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b' }}>{camp.founderName}</span>
                        </div>
                        <ConnectButton targetUserId={camp.founderId} targetUserName={camp.founderName} compact />
                      </div>

                      {/* Equipment Needed Box (Crucial HOP Feature) */}
                      <div
                        style={{
                          backgroundColor: '#fffbeb',
                          border: '1px solid #fef3c7',
                          borderRadius: '10px',
                          padding: '0.85rem',
                          marginBottom: '1rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#b45309', fontWeight: 700, fontSize: '0.78rem', marginBottom: '0.25rem' }}>
                          <Wrench size={13} />
                          <span>REQUIRED TOOLS & EQUIPMENT:</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.825rem', color: '#78350f', lineHeight: 1.4 }}>
                          {camp.equipmentNeeded}
                        </p>
                      </div>

                      <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                        {camp.description}
                      </p>
                    </div>

                    <div>
                      {/* Funding Progress Bar */}
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                          <span style={{ fontWeight: 800, color: '#059669' }}>
                            ${(camp.raisedAmount || 0).toLocaleString()} raised
                          </span>
                          <span style={{ color: '#64748b' }}>
                            Goal: ${camp.targetAmount.toLocaleString()} ({pct}%)
                          </span>
                        </div>
                        <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${pct}%`,
                              height: '100%',
                              backgroundColor: isFullyFunded ? '#10b981' : '#2563eb',
                              borderRadius: '9999px',
                              transition: 'width 0.4s ease',
                            }}
                          />
                        </div>
                      </div>

                      {/* Milestones count button */}
                      <button
                        type="button"
                        onClick={() => setSelectedCampaignForMilestones(camp)}
                        style={{
                          width: '100%',
                          background: 'none',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          padding: '0.45rem',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          color: '#475569',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          marginBottom: '0.75rem',
                        }}
                      >
                        <CheckCircle size={14} color="#10b981" />
                        <span>Roadmap Milestones ({completedMilestones}/{totalMilestones} Completed)</span>
                      </button>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => setSelectedCampaignForFunding(camp)}
                          className="btn btn-primary"
                          style={{
                            flex: 1,
                            padding: '0.6rem 0.85rem',
                            fontWeight: 700,
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.4rem',
                          }}
                        >
                          <DollarSign size={16} />
                          <span>Fund Micro-Grant</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CREATE A VENTURE FORM */}
      {activeTab === 'create' && (
        <div style={{ maxWidth: '780px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '16px', padding: '2rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
          <div style={{ marginBottom: '1.75rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.35rem 0', color: '#0f172a' }}>
              Apply for a Micro-Grant / Launch Your Enterprise
            </h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
              Describe the tools, equipment, or starter supplies you need to establish a self-sustaining income source.
            </p>
          </div>

          <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>Business / Venture Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sunrise Custom Tailoring & Alterations"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="form-control"
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>Industry *</label>
                <select
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className="form-control"
                >
                  {INDUSTRIES.filter((i) => i.id !== 'ALL').map((ind) => (
                    <option key={ind.id} value={ind.id}>
                      {ind.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>Tagline / Catchphrase *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Precision stitching for school uniforms & bridal wear"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  className="form-control"
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>Location (City, District)</label>
                <input
                  type="text"
                  placeholder="e.g. Sector 4, Community Market"
                  value={formData.location || ''}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="form-control"
                />
              </div>
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: 700, color: '#b45309' }}>
                Required Equipment & Tools Breakdown *
              </label>
              <textarea
                required
                rows={3}
                placeholder="List exact tools to be bought (e.g. 1x Singer heavy duty machine ($280), 1x Overlock serger ($140), Cutting table & scissors ($80))"
                value={formData.equipmentNeeded}
                onChange={(e) => setFormData({ ...formData, equipmentNeeded: e.target.value })}
                className="form-control"
              />
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Donors value transparency: list exact tools and their approximate prices.
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>Target Grant Budget ($) *</label>
                <input
                  type="number"
                  required
                  min={10}
                  step={10}
                  value={formData.targetAmount}
                  onChange={(e) => setFormData({ ...formData, targetAmount: Number(e.target.value) })}
                  className="form-control"
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>Sustainability & Revenue Plan</label>
                <input
                  type="text"
                  placeholder="e.g. Expected 15 orders/week generating $120 net profit for family needs"
                  value={formData.sustainabilityPlan || ''}
                  onChange={(e) => setFormData({ ...formData, sustainabilityPlan: e.target.value })}
                  className="form-control"
                />
              </div>
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: 700 }}>Business Description & Background *</label>
              <textarea
                required
                rows={4}
                placeholder="Share your experience, work history, target customers, and how this micro-grant will transform your family's future..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="form-control"
              />
            </div>

            <button
              type="submit"
              disabled={createSubmitting}
              className="btn btn-primary"
              style={{
                padding: '0.85rem',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '1rem',
                marginTop: '0.5rem',
              }}
            >
              {createSubmitting ? 'Submitting Proposal...' : 'Publish Micro-Grant Proposal'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: MY VENTURES */}
      {activeTab === 'my' && (
        <div>
          {myCampaigns.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
              <Briefcase size={44} style={{ color: '#94a3b8', margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>You have not launched any ventures yet</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Apply for an equipment grant to launch your venture and receive support from donors.
              </p>
              <button onClick={() => setActiveTab('create')} className="btn btn-primary" style={{ borderRadius: '9999px' }}>
                Create Venture Proposal
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {myCampaigns.map((camp) => (
                <div
                  key={camp.id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    padding: '1.75rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>
                          {camp.businessName}
                        </h3>
                        <span
                          style={{
                            padding: '0.2rem 0.55rem',
                            borderRadius: '9999px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            backgroundColor: camp.status === 'APPROVED' ? '#ecfdf5' : '#eff6ff',
                            color: camp.status === 'APPROVED' ? '#059669' : '#2563eb',
                          }}
                        >
                          {camp.status}
                        </span>
                      </div>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>
                        {camp.tagline} • Goal: ${camp.targetAmount} (Raised: ${camp.raisedAmount || 0})
                      </p>
                    </div>

                    <button
                      onClick={() => setSelectedCampaignForMilestones(camp)}
                      className="btn btn-outline btn-sm"
                      style={{ borderRadius: '8px' }}
                    >
                      Manage Milestones ({(camp.milestones || []).length})
                    </button>
                  </div>

                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', fontSize: '0.85rem' }}>
                    <div>
                      <span style={{ fontWeight: 600, color: '#475569' }}>Equipment Needed: </span>
                      <span style={{ color: '#1e293b' }}>{camp.equipmentNeeded}</span>
                    </div>
                    <div>
                      <span style={{ fontWeight: 600, color: '#475569' }}>Backers: </span>
                      <span style={{ color: '#2563eb', fontWeight: 700 }}>{camp.totalBackersCount || 0} supporters</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: FUND MICRO-GRANT */}
      {selectedCampaignForFunding && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              maxWidth: '520px',
              width: '100%',
              padding: '2rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              position: 'relative',
            }}
          >
            <button
              onClick={() => setSelectedCampaignForFunding(null)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#94a3b8',
              }}
            >
              <X size={20} />
            </button>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#ecfdf5', color: '#059669', padding: '0.2rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                <DollarSign size={12} />
                <span>Micro-Enterprise Grant</span>
              </div>
              <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
                Back {selectedCampaignForFunding.businessName}
              </h3>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>
                Founded by {selectedCampaignForFunding.founderName}. Every dollar funds essential tools for self-reliance.
              </p>
            </div>

            <form onSubmit={handleFundSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Preset Amounts */}
              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>Select Grant Contribution ($)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '0.65rem' }}>
                  {['25', '50', '100', '250'].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setFundingAmount(amt)}
                      style={{
                        padding: '0.6rem',
                        borderRadius: '10px',
                        border: fundingAmount === amt ? '2px solid #2563eb' : '1px solid #cbd5e1',
                        backgroundColor: fundingAmount === amt ? '#eff6ff' : '#ffffff',
                        color: fundingAmount === amt ? '#1d4ed8' : '#334155',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={fundingAmount}
                  onChange={(e) => setFundingAmount(e.target.value)}
                  placeholder="Or enter custom amount..."
                  className="form-control"
                  style={{ borderRadius: '10px' }}
                />
              </div>

              {/* Mentorship Toggle */}
              <div
                onClick={() => setIsMentorOffer(!isMentorOffer)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.85rem',
                  borderRadius: '12px',
                  backgroundColor: isMentorOffer ? '#f0fdf4' : '#f8fafc',
                  border: isMentorOffer ? '1.5px solid #22c55e' : '1px solid #e2e8f0',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={isMentorOffer}
                  onChange={(e) => setIsMentorOffer(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <div>
                  <span style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#166534' }}>
                    Offer Mentorship & Business Advice
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#4b5563' }}>
                    I can advise this entrepreneur on pricing, marketing, or operations.
                  </span>
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>Message of Encouragement (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Wishing you huge success! Keep striving forward."
                  value={fundingMessage}
                  onChange={(e) => setFundingMessage(e.target.value)}
                  className="form-control"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedCampaignForFunding(null)}
                  className="btn btn-secondary"
                  style={{ flex: 1, borderRadius: '10px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={fundingLoading || !fundingAmount}
                  className="btn btn-primary"
                  style={{ flex: 2, borderRadius: '10px', fontWeight: 700 }}
                >
                  {fundingLoading ? 'Processing...' : `Confirm $${fundingAmount} Grant`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ROADMAP MILESTONES */}
      {selectedCampaignForMilestones && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              maxWidth: '600px',
              width: '100%',
              padding: '2rem',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              position: 'relative',
            }}
          >
            <button
              onClick={() => setSelectedCampaignForMilestones(null)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#94a3b8',
              }}
            >
              <X size={20} />
            </button>

            <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 700, textTransform: 'uppercase' }}>
                Self-Reliance Roadmap
              </span>
              <h3 style={{ margin: '0.2rem 0', fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
                {selectedCampaignForMilestones.businessName} Milestones
              </h3>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>
                Track the purchase of equipment and growth steps toward sustainability.
              </p>
            </div>

            {/* Milestones Timeline */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              {(selectedCampaignForMilestones.milestones || []).length === 0 ? (
                <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', margin: '1rem 0' }}>
                  No milestones added yet.
                </p>
              ) : (
                (selectedCampaignForMilestones.milestones || []).map((m, idx) => {
                  const isCompleted = m.status === 'COMPLETED';
                  const isOwner = user?.userId === selectedCampaignForMilestones.founderId;

                  return (
                    <div
                      key={m.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.85rem',
                        padding: '0.85rem',
                        borderRadius: '12px',
                        backgroundColor: isCompleted ? '#f0fdf4' : '#f8fafc',
                        border: isCompleted ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                      }}
                    >
                      <div style={{ marginTop: '2px', color: isCompleted ? '#16a34a' : '#94a3b8' }}>
                        {isCompleted ? <CheckCircle size={20} /> : <Circle size={20} />}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <h4 style={{ margin: '0 0 0.2rem 0', fontSize: '0.95rem', fontWeight: 700, color: isCompleted ? '#166534' : '#1e293b' }}>
                            {idx + 1}. {m.title}
                          </h4>
                          {isCompleted && m.completedAt && (
                            <span style={{ fontSize: '0.7rem', color: '#15803d', fontWeight: 600 }}>
                              Completed {new Date(m.completedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <p style={{ margin: 0, fontSize: '0.825rem', color: '#475569', lineHeight: 1.4 }}>
                          {m.description}
                        </p>
                      </div>

                      {isOwner && !isCompleted && (
                        <button
                          onClick={() => handleCompleteMilestone(m.id)}
                          className="btn btn-sm btn-primary"
                          style={{
                            backgroundColor: '#10b981',
                            borderColor: '#10b981',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            padding: '0.3rem 0.6rem',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Mark Done
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Add Milestone Form (If owner) */}
            {user?.userId === selectedCampaignForMilestones.founderId && (
              <form onSubmit={handleAddMilestone} style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>
                  + Add Next Business Milestone
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <input
                    type="text"
                    required
                    placeholder="Milestone Title (e.g. Procured wholesale fabrics & inventory)"
                    value={newMilestoneTitle}
                    onChange={(e) => setNewMilestoneTitle(e.target.value)}
                    className="form-control"
                  />
                  <input
                    type="text"
                    placeholder="Description / Specific target..."
                    value={newMilestoneDesc}
                    onChange={(e) => setNewMilestoneDesc(e.target.value)}
                    className="form-control"
                  />
                  <button
                    type="submit"
                    disabled={milestoneSubmitting || !newMilestoneTitle.trim()}
                    className="btn btn-secondary btn-sm"
                    style={{ alignSelf: 'flex-start', borderRadius: '8px', padding: '0.45rem 1rem' }}
                  >
                    {milestoneSubmitting ? 'Adding...' : 'Add Milestone'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
